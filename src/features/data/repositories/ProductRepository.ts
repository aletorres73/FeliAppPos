import { db } from "../services/FirebaseService";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import type { Product } from "../../orders/types/types";

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