import { db } from "../services/FirebaseService";
import { doc, getDoc, getDocs, collection, onSnapshot, query } from "firebase/firestore";
import type { Product } from "../../domain/types/orderTypes";

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
    weightSold: data.pesoVendido
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