import { useEffect, useState, useMemo } from "react"
import type { OrderDraft, OrderItem, Product } from "../types/types"
import { getProducts } from "../../data/repositories/ProductRepository"
import { roundToNearestHundred } from "../../../utils/formats";

export function useOrder() {
  const [draft, setDraft] = useState<OrderDraft>({
    items: [],
    total: 0,
    subtotal: 0,
    comments: "" 
  })
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para la búsqueda

  // CARGA INICIAL: 
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data || []); // Aseguramos que sea un array
        console.log("Productos cargados en Hook:", data.length);
      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    };
    fetchProducts();
  }, []);

  // SUGERENCIAS: Usamos useMemo para que no se recalcule en cada render
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      
      p.article.toLowerCase().includes(term) || 
      p.id.toString().includes(term) ||
      p.branch.toLowerCase().includes(term)

    ).slice(0, 10); // Limitamos a 10 resultados por performance
  }, [searchTerm, products]);

  const addItem = (newItem: OrderItem) => {
    const existingItemIndex = draft.items.findIndex(
      (i) => i.productId === newItem.productId && i.productId !== ""
    );

    let newItems: OrderItem[];

    if (existingItemIndex !== -1) {
      newItems = [...draft.items];
      const existingItem = newItems[existingItemIndex];
      const updatedQuantity = existingItem.quantity + newItem.quantity;

      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: updatedQuantity,
        subtotal: updatedQuantity * existingItem.unitPrice
      };
    } else {
      newItems = [...draft.items, newItem];
    }

    const newTotal = newItems.reduce((acc, i) => acc + i.subtotal, 0);

    setDraft({
      ...draft,
      items: newItems,
      subtotal: newTotal,
      total: roundToNearestHundred(newTotal)
    });
  };

  const removeItem = (index: number) => {
    const items = draft.items.filter((_, i) => i !== index);
    const total = items.reduce((acc, i) => acc + i.subtotal, 0);
    setDraft({
      ...draft,
      items,
      total,
      subtotal: total
    });
  }

  const updateQuantity = (index: number, newQty: number) => {
    const items = draft.items.map((item, i) => {
      if (i === index) {
        return { ...item, quantity: newQty, subtotal: item.unitPrice * newQty };
      }
      return item;
    });

    const total = items.reduce((acc, i) => acc + i.subtotal, 0);
    setDraft({ ...draft, items, total, subtotal: total });
  }

  const clearDraft = () => {
    setDraft({ items: [], total: 0, subtotal: 0, comments: "" });
    setSearchTerm("");
  }

  const updateComments = (comments: string) => {
    setDraft(prev => ({ ...prev, comments }));
  }

  return { 
    draft, 
    addItem, 
    removeItem, 
    updateQuantity, 
    clearDraft, 
    updateComments, 
    searchTerm, 
    setSearchTerm, 
    suggestions 
  }
}