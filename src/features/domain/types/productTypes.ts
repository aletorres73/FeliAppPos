export type Product = {
  id: string;
  branch: string;
  article: string;
  cost: number;
  gains: number;
  price: number;
  stock: number;
  weight: number;
  active: boolean;
  saleWeight: boolean;
  quantitySold: number;
  createdAt: number;
  updatedAt: number | null;
  weightSold: number;

  // --- Campos para Lógica Masiva y Jerárquica ---
  isParent: boolean;      // Define si es el producto "plantilla" del grupo
  parentId: string | null; // ID del producto raíz (ej: Galletitas Pitusas base)
  stockLinked: boolean;    // Si es true, descuenta stock del parentId (ej: venta por docena)
  conversionFactor: number | null; // Cuántas unidades del padre representa este hijo (ej: 12 para docena)
  volumePrices?: VolumePrice[]; // Opcional para soportar los que no tienen escala
}

export type VolumePrice = {
  fromQuantity: number;
  specialPrice: number;
}