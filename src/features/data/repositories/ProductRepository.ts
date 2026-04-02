import { db } from "../services/FirebaseService";
import { doc, getDoc } from "firebase/firestore";
import type { Product } from "../../orders/types/types";

export const getProductById = async (docId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Mapeo manual: transformamos los nombres de la DB a los de tu App
      const mappedProduct: Product = {
          id: docSnap.id,
          article: data.articulo,
          branch: data.marca,
          price: data.precio,
          cost: data.costo,
          stock: data.stock || 0,
          active: data.activo ?? true,
          saleWeight: data.ventaPorPeso ?? false,
          gains: data.ganancia,
          weight: data.peso,
          quantitySold: data.cantidadVendida,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          weightSold: data.pesoVendido
      };

      console.log(`Producto parseado: ${mappedProduct.article}`);
      return mappedProduct;
    } 
    
    return null;
  } catch (error) {
    console.error("Error al parsear producto:", error);
    return null;
  }
};