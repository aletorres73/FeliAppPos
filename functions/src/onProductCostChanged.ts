import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "./data/firebase";
import type { FirestoreProduct } from "./domain/firestoreProductTypes";

const roundToNearestHundred = (value: number): number => {
    return Math.round(value / 100) * 100;
};

export const onProductCostChanged = onDocumentUpdated("products/{productId}", async (event) => {
    const beforeData = event.data?.before.data() as FirestoreProduct;
    const afterData = event.data?.after.data() as FirestoreProduct;

    if (!beforeData || !afterData) return;

    const oldCost = beforeData.costo || 0;
    const newCost = afterData.costo || 0;

    if (oldCost === newCost) return;

    const oldPrice = beforeData.precio || 0;
    const newPrice = afterData.precio || 0;
    const oldGains = beforeData.ganancia || 0;
    const newGains = afterData.ganancia || 0;

    // 1. DETECCIÓN DE EDICIÓN MANUAL
    const isManualEdit = oldPrice !== newPrice || oldGains !== newGains;
    if (isManualEdit) {
        console.log(`Edición manual detectada en ${afterData.articulo}. Omitiendo automatización.`);
        return;
    }

    // 2. PROPAGACIÓN INVERSA (De Hijo a Padre)
    if (!afterData.isParent && afterData.parentId) {
        console.log(`El hijo ${afterData.articulo} cambió de costo. Propagando al Padre...`);
        const parentRef = db.collection("products").doc(afterData.parentId);

        // Le pasamos el nuevo costo al Padre. Esto disparará automáticamente 
        // una nueva ejecución de esta función para el Padre, que aplicará 
        // la regla matemática a toda la familia.
        await parentRef.update({ costo: newCost });
        return;
    }

    const batch = db.batch();
    const productRef = event.data!.after.ref;
    const productId = event.params.productId;

    let notificationTitle = "";
    let notificationMessage = "";
    let notificationType = "INFO";



    // CASO A: El costo SUBE
    if (newCost > oldCost) {
        const currentGains = afterData.ganancia || 0;
        const exactNewPrice = newCost * (1 + currentGains / 100);
        const roundedNewPrice = roundToNearestHundred(exactNewPrice);

        batch.update(productRef, {
            precio: roundedNewPrice,
            pricingReviewPending: false,
            costUpdatedAt: Date.now()
        });

        notificationTitle = "Precio ajustado al alza";
        notificationMessage = `El costo de ${afterData.articulo} subió a $${newCost}. El precio se actualizó a $${roundedNewPrice} para mantener el ${currentGains}%.`;
        notificationType = "PRICE_UPDATE";

        // Replicar a los hijos si es padre
        if (afterData.isParent) {
            const childrenSnap = await db.collection("products").where("parentId", "==", productId).get();
            childrenSnap.forEach(childDoc => {
                batch.update(childDoc.ref, {
                    precio: roundedNewPrice,
                    // FIX 1: Envolvemos el toFixed en un Number() para asegurar que Firestore guarde un número y no un string.
                    ganancia: Number((((roundedNewPrice - newCost) / newCost) * 100).toFixed(2)),
                    costo: newCost,
                    costUpdatedAt: Date.now()
                });
            });
            notificationMessage += ` Se actualizaron ${childrenSnap.size} variaciones hijas.`;
        }
    }

    // CASO B: El costo BAJA
    else if (newCost < oldCost) {
        const currentPrice = afterData.precio || 0;
        // Congelamos el precio y recalculamos el nuevo margen real
        const recalculatedGains = newCost > 0 ? Number((((currentPrice - newCost) / newCost) * 100).toFixed(2)) : 0;
        const newSuggestedPrice = roundToNearestHundred(newCost * (1 + (beforeData.ganancia || 0) / 100));

        batch.update(productRef, {
            ganancia: recalculatedGains, // FIX 2: Agregamos la ganancia recalculada al padre
            pricingReviewPending: true,
            previousCost: oldCost,
            suggestedPrice: newSuggestedPrice,
            costUpdatedAt: Date.now()
        });

        notificationTitle = "Revisión de precio sugerida";
        notificationMessage = `El costo de ${afterData.articulo} bajó a $${newCost}. Tu margen creció a ${recalculatedGains}%. Revisá si querés bajar el precio.`;
        notificationType = "WARNING";

        // Replicar a los hijos si es padre
        if (afterData.isParent) {
            const childrenSnap = await db.collection("products").where("parentId", "==", productId).get();
            childrenSnap.forEach(childDoc => {
                batch.update(childDoc.ref, {
                    costo: newCost, // FIX 3: Actualizamos el costo en los hijos
                    ganancia: recalculatedGains, // FIX 4: Actualizamos la ganancia en los hijos
                    pricingReviewPending: true,
                    previousCost: oldCost,
                    suggestedPrice: newSuggestedPrice,
                    costUpdatedAt: Date.now()
                });
            });
            notificationMessage += ` Se marcaron para revisión ${childrenSnap.size} variaciones hijas.`;
        }
    }

    // Escribimos la notificación
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        createdAt: Date.now(),
        read: false,
        actionRoute: "/stock"
    });

    await batch.commit();
});