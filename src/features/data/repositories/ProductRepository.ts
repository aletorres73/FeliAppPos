import { db } from "../services/FirebaseService";

import {
  doc, getDoc, getDocs,
  collection, onSnapshot,
  query, deleteDoc,
  setDoc, updateDoc, writeBatch, where
} from "firebase/firestore";

import type { Product } from "../../domain/types/productTypes";

export const getProductById = async (docId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Mapeo manual: transformamos los nombres de la DB a los de tu App
      const mappedProduct = mapToProduct(data)

      console.log(`Producto parseado: ${mappedProduct.article}`);
      return mappedProduct;
    }

    return null;
  } catch (error) {
    console.error("Error al parsear producto:", error);
    return null;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const colRef = collection(db, "products");

    const querySnapshot = await getDocs(colRef);

    const products: Product[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return mapToProduct({ ...data, id: doc.id });
    });

    console.log(`Productos obtenidos: ${products.length}`);
    return products;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
};

export const deleteProduct = async (docId: string): Promise<void> => {
  try {
    const docRef = doc(db, "products", docId);
    await deleteDoc(docRef);

    console.log(`Producto con ID ${docId} eliminado`);
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
};

export const mapToProduct = (data: any): Product => {
  return {
    id: data.id,
    article: data.articulo,
    branch: data.marca,
    price: data.precio,
    cost: data.costo,
    stock: data.stock,
    active: data.activo,
    saleWeight: data.ventaPorPeso,
    gains: data.ganancia,
    weight: data.peso,
    quantitySold: data.cantidadVendida,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    weightSold: data.pesoVendido,
    isParent: data.isParent || false,
    parentId: data.parentId || null,
    stockLinked: data.stockLinked || false,
    conversionFactor: data.conversionFactor || null
  };
}

export const mapToFirestoreProduct = (product: Product): any => {
  return {
    id: product.id,
    articulo: product.article,
    marca: product.branch,
    precio: product.price,
    costo: product.cost,
    stock: product.stock,
    activo: product.active,
    ventaPorPeso: product.saleWeight,
    ganancia: product.gains,
    peso: product.weight,
    cantidadVendida: product.quantitySold,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    pesoVendido: product.weightSold,
    isParent: product.isParent || false,
    parentId: product.parentId || null,
    stockLinked: product.stockLinked || false,
    conversionFactor: product.conversionFactor || null
  };
}

export const subscribeToProducts = (onUpdate: (products: Product[]) => void) => {
  const colRef = collection(db, "products");

  // Opcional: puedes usar query(colRef, where("activo", "==", true)) si quieres filtrar
  const q = query(colRef);

  // onSnapshot devuelve una función de "unsubscribe" para cerrar el listener
  return onSnapshot(q, (querySnapshot) => {
    const products: Product[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Importante: Asegúrate de incluir el ID del documento
      return mapToProduct({ ...data, id: doc.id });
    });

    console.log(`Actualización en tiempo real: ${products.length} productos`);
    onUpdate(products);
  }, (error) => {
    console.error("Error en el listener de productos:", error);
  });
};

export const addProduct = async (product: Product): Promise<void> => {
  try {
    const docRef = doc(db, "products", product.id.trim());

    await setDoc(docRef, mapToFirestoreProduct(product));

    console.log(`Producto agregado con ID personalizado: ${product.article}`);
  } catch (error) {
    console.error("Error al agregar producto:", error);
  }
};

// --- ProductRepository.ts ---

// 1. Modificación para soportar actualizaciones parciales sin romper campos
export const updateProduct = async (docId: string, updatedData: Partial<Product>): Promise<void> => {
  try {
    const docRef = doc(db, "products", docId);

    // Convertimos solo los campos que vienen en el Partial a nomenclatura Firestore
    const firestoreUpdates: any = {};
    if (updatedData.article !== undefined) firestoreUpdates.articulo = updatedData.article;
    if (updatedData.branch !== undefined) firestoreUpdates.marca = updatedData.branch;
    if (updatedData.price !== undefined) firestoreUpdates.precio = updatedData.price;
    if (updatedData.cost !== undefined) firestoreUpdates.costo = updatedData.cost;
    if (updatedData.stock !== undefined) firestoreUpdates.stock = updatedData.stock;
    if (updatedData.active !== undefined) firestoreUpdates.activo = updatedData.active;
    if (updatedData.saleWeight !== undefined) firestoreUpdates.ventaPorPeso = updatedData.saleWeight;
    if (updatedData.gains !== undefined) firestoreUpdates.ganancia = updatedData.gains;
    if (updatedData.weight !== undefined) firestoreUpdates.peso = updatedData.weight;
    if (updatedData.isParent !== undefined) firestoreUpdates.isParent = updatedData.isParent;
    if (updatedData.parentId !== undefined) firestoreUpdates.parentId = updatedData.parentId;
    if (updatedData.stockLinked !== undefined) firestoreUpdates.stockLinked = updatedData.stockLinked;
    if (updatedData.conversionFactor !== undefined) firestoreUpdates.conversionFactor = updatedData.conversionFactor;

    firestoreUpdates.updatedAt = Date.now();

    await updateDoc(docRef, firestoreUpdates);
    console.log(`Producto actualizado: ${docId}`);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
  }
};

// 2. Corrección del BulkAction para usar los nombres correctos de la DB (Español)
export const bulkActionRepository = {
  async updateParentAndChildren(parentId: string, updates: Partial<Product>): Promise<void> {
    const batch = writeBatch(db);
    const parentRef = doc(db, "products", parentId);

    // Mapear actualizaciones del padre a Firestore
    const parentFirestoreUpdates: any = {};
    if (updates.article !== undefined) parentFirestoreUpdates.articulo = updates.article;
    if (updates.branch !== undefined) parentFirestoreUpdates.marca = updates.branch;
    if (updates.price !== undefined) parentFirestoreUpdates.precio = updates.price;
    if (updates.cost !== undefined) parentFirestoreUpdates.costo = updates.cost;
    if (updates.active !== undefined) parentFirestoreUpdates.activo = updates.active;
    if (updates.gains !== undefined) parentFirestoreUpdates.ganancia = updates.gains;
    if (updates.isParent !== undefined) parentFirestoreUpdates.isParent = updates.isParent;
    parentFirestoreUpdates.updatedAt = Date.now();

    // Aplicar al Padre
    batch.update(parentRef, parentFirestoreUpdates);

    // Buscar Hijos
    const childrenQuery = query(
      collection(db, "products"),
      where("parentId", "==", parentId)
    );
    const childrenSnap = await getDocs(childrenQuery);

    // Replicar a Hijos usando las columnas nativas de Firestore
    childrenSnap.forEach((childDoc) => {
      const childRef = doc(db, "products", childDoc.id);
      const childData = childDoc.data();

      batch.update(childRef, {
        precio: updates.price ?? childData.precio,
        costo: updates.cost ?? childData.costo,
        marca: updates.branch ?? childData.marca,
        activo: updates.active ?? childData.activo,
        ganancia: updates.gains ?? childData.ganancia,
        updatedAt: Date.now()
      });
    });

    await batch.commit();
    console.log(`Actualización en lote completada para el grupo de: ${parentId}`);
  },

  async destroyGroup(parentId: string): Promise<void> {
    const batch = writeBatch(db);
    const parentRef = doc(db, "products", parentId);

    // 1. Modificar el producto Padre para que deje de serlo
    batch.update(parentRef, {
      isParent: false,
      updatedAt: Date.now()
    });

    // 2. Traer todos los hijos vinculados
    const childrenQuery = query(
      collection(db, "products"),
      where("parentId", "==", parentId)
    );
    const childrenSnap = await getDocs(childrenQuery);

    // 3. Romper la relación quitando el parentId y el stock linked a cada uno
    childrenSnap.forEach((childDoc) => {
      const childRef = doc(db, "products", childDoc.id);
      batch.update(childRef, {
        parentId: null,
        stockLinked: false,
        conversionFactor: null,
        updatedAt: Date.now()
      });
    });

    // Ejecutar lote en Firebase
    await batch.commit();
    console.log(`Grupo ${parentId} destruido. Hijos desvinculados con éxito.`);
  }
};
