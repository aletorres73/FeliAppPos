import { useState, useEffect } from "react";
import { useOrder } from "../hooks/useOrder";

// Componentes UI de la orden
import { ScannerInput } from "../../../ui/orders/components/ScannerImput";
import { CustomerSelector } from "../../../ui/orders/components/CustomerSelector";
import { OrderList } from "../../../ui/orders/components/OrderList";
import { ManualItemModal } from "../../../ui/orders/components/ManualItemModal";
import { CustomerSelectorModal } from "../../../ui/orders/components/CustomerSelectorModal";
import { Footer } from "../../../ui/orders/components/Footer";
import { CustomerCreateModal } from "../../../ui/orders/components/CustomerCreateModal";
import { CheckoutModal } from "../../../ui/orders/components/CheckoutModal";

// Repositorios y Tipos
import { getProductById } from "../../../data/repositories/ProductRepository";
import { customerRepository } from "../../../data/repositories/CustomerRepository";
import type { OrderItem, OrderPayStatus, PaymentMethod } from "../../../domain/types/orderTypes";
import type { Product } from "../../../domain/types/productTypes";
import { AnonymousCustomer } from "../../../domain/types/customersTypes";

export default function OrderScreen() {
  const {
    draft,
    searchTerm,
    setSearchTerm,
    suggestions,
    addItem,
    updateComments,
    clearDraft,
    removeItem,
    updateQuantity,
    commitOrder,
    applyGlobalDiscount,
  } = useOrder();

  const [manualCode, setManualCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(AnonymousCustomer);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // 🆕 ESTADOS PARA EL MULTIPLICADOR INYECTADO (F1)
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isChangingMultiplier, setIsChangingMultiplier] = useState(false);
  const [multiplierInput, setMultiplierInput] = useState("");

  const totalFinal = draft.total;

  // --- Atajos de teclado Globales (F9 para Cobro, F1 para Multiplicador) ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isAnyModalOpen = showCheckout || showCustomerModal || showCreateCustomerModal || !!manualCode;

      // F9 - Checkout
      if (e.key === "F9" && draft.items.length > 0 && !isAnyModalOpen && !isChangingMultiplier) {
        e.preventDefault();
        setShowCheckout(true);
      }

      // 🆕 F1 - Activar modo Multiplicador
      if (e.key === "F1" && !isAnyModalOpen) {
        e.preventDefault();
        setMultiplierInput(""); // Limpiamos para escribir de cero
        setIsChangingMultiplier(true);
      }

      // 🆕 Escape - Cancelar el multiplicador si se estaba editando
      if (e.key === "Escape" && isChangingMultiplier) {
        e.preventDefault();
        setIsChangingMultiplier(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [draft.items.length, showCheckout, showCustomerModal, showCreateCustomerModal, manualCode, isChangingMultiplier]);

  // --- Auto-focus Inteligente del Scanner o del Multiplicador ---
  useEffect(() => {
    if (isChangingMultiplier) {
      const multInput = document.getElementById("multiplier-input") as HTMLInputElement;
      if (multInput) multInput.focus();
      return;
    }

    const isAnyModalOpen = showCheckout || showCustomerModal || !!manualCode;
    if (!isAnyModalOpen) {
      const focusTimer = setTimeout(() => {
        const scannerInput = document.getElementById("scanner-input") as HTMLInputElement;
        if (scannerInput) scannerInput.focus();
      }, 50);
      return () => clearTimeout(focusTimer);
    }
  }, [showCheckout, showCustomerModal, manualCode, isChangingMultiplier]);

  // --- Handlers ---
  const handleSaveNewCustomer = async (data: any) => {
    setIsLoading(true);
    try {
      const newCustomerBase = { ...data, currentBalance: 0, lastPurchaseDate: null };
      const newId = await customerRepository.saveClient(newCustomerBase);
      if (newId) {
        setSelectedCustomer({ ...newCustomerBase, id: newId });
        setShowCreateCustomerModal(false);
      }
    } catch (error) {
      alert("Error al crear el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Confirmar el número del multiplicador (Enter en el input de F1)
  const handleConfirmMultiplier = (e: React.SubmitEvent) => {
    e.preventDefault();
    const parsed = parseFloat(multiplierInput);
    if (!isNaN(parsed) && parsed > 0) {
      setMultiplier(parsed);
    }
    setIsChangingMultiplier(false);
  };

  const handleScan = async (code: string) => {
    let normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;

    // 🆕 Si el usuario metió un multiplicador clásico en el string (ej: "5*"), 
    // priorizamos ese sobre el estado F1 por flexibilidad. Si no, usamos el del estado F1.
    let currentQty = multiplier; 
    const multiplierMatch = normalizedCode.match(/^(\d+(?:\.\d+)?)[*X]/);

    if (multiplierMatch) {
      currentQty = Number(multiplierMatch[1]);
      normalizedCode = normalizedCode.replace(/^.*?[*X]/, "").trim();
    }

    setIsLoading(true);
    try {
      const product = await getProductById(normalizedCode);

      if (!product) {
        setManualCode(normalizedCode);
        setSelectedProduct(null);
        return;
      }

      if (product.saleWeight) {
        // Si el producto es pesado, le pasamos la cantidad sugerida a la modal
        setSelectedProduct(product);
        setManualCode(normalizedCode);
      } else {
        // En productos normales, agregamos aplicando el multiplicador activo
        addItem(mapProductToOrderItem(product, currentQty));
        setSearchTerm("");
        setMultiplier(1); // 🆕 Reseteamos el multiplicador a 1 para la próxima lectura
      }
    } catch (error) {
      console.error("Error en Scanner:", error);
      setManualCode(normalizedCode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeOrder = async (
    payStatus: OrderPayStatus,
    customerPayment: number,
    paymentMethod: PaymentMethod[] | null
  ) => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const orderId = await commitOrder(draft, payStatus, customerPayment, paymentMethod, selectedCustomer);
      if (orderId) {
        clearDraft();
        setShowCheckout(false);
        setSelectedCustomer(AnonymousCustomer);
        setGlobalDiscount(0);
        setMultiplier(1);
        alert(`Venta guardada con éxito. ID: ${orderId}`);
      }
    } catch (error) {
      alert("Error al guardar la venta");
    } finally {
      setIsLoading(false);
    }
  };

  const closeManualModal = () => {
    setManualCode(null);
    setSelectedProduct(null);
  };

  const handleConfirmManual = (item: OrderItem) => {
    const finalQty = item.quantity === 1 && multiplier !== 1 ? multiplier : item.quantity;
    
    addItem({
      ...item,
      quantity: finalQty,
      originalPrice: item.unitPrice, // 🆕 Seteamos el precio base con el que entró
      subtotal: finalQty * item.unitPrice
    });
    setMultiplier(1);
    closeManualModal();
  };

  return (
    <div style={styles.screenContainer}>
      <div style={styles.contentWrapper}>
        {/* <Header isLoading={isLoading} /> */}

        {/* 🆕 BANNER INDICADOR DEL MULTIPLICADOR (F1) */}
        <div style={{
          ...styles.multiplierBanner,
          borderColor: isChangingMultiplier ? "#54C4F0" : multiplier > 1 ? "#E2B63B" : "rgba(255,255,255,0.05)",
          backgroundColor: isChangingMultiplier ? "rgba(84,196,240,0.05)" : multiplier > 1 ? "rgba(226,182,59,0.05)" : "transparent"
        }}>
          {isChangingMultiplier ? (
            <form onSubmit={handleConfirmMultiplier} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#54C4F0", fontWeight: 600 }}>Multiplicador Activo [F1]:</span>
              <input
                id="multiplier-input"
                type="number"
                step="any"
                placeholder="Ej: 12 o 2.5"
                value={multiplierInput}
                onChange={(e) => setMultiplierInput(e.target.value)}
                onBlur={() => setIsChangingMultiplier(false)}
                style={styles.multiplierInputField}
              />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>[Enter] Confirmar · [Esc] Cancelar</span>
            </form>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <div>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Multiplicador actual: </span>
                <strong style={{ color: multiplier > 1 ? "#E2B63B" : "white", fontSize: "1.1rem" }}>{multiplier}x</strong>
              </div>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>Presioná <b style={{color: "#54C4F0"}}>F1</b> para cambiar</span>
            </div>
          )}
        </div>

        <CustomerSelector
          selected={selectedCustomer}
          onClick={() => setShowCustomerModal(true)}
          onClear={() => setSelectedCustomer(AnonymousCustomer)}
          onOpenCreate={() => setShowCreateCustomerModal(true)}
        />

        <section style={{ marginBottom: 40 }}>
          <ScannerInput
            externalValue={searchTerm}
            onChange={setSearchTerm}
            onScan={handleScan}
            suggestions={suggestions}
          />
        </section>

        <section>
          <OrderList
            items={draft.items}
            onRemove={removeItem}
            onUpdate={(index, newQty) => updateQuantity(index, newQty)}
          />
        </section>

        <Footer
          subtotal={draft.subtotal}
          total={totalFinal}
          discount={globalDiscount}
          itemsCount={draft.items.length}
          isLoading={isLoading}
          onDiscountChange={setGlobalDiscount}
          onCheckout={() => setShowCheckout(true)}
          onConfirm={(val) => { applyGlobalDiscount(val) }}
        />
      </div>

      {/* --- MODALES --- */}
      {showCreateCustomerModal && (
        <CustomerCreateModal
          isLoading={isLoading}
          onClose={() => setShowCreateCustomerModal(false)}
          onSave={handleSaveNewCustomer}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          customerSelected={selectedCustomer}
          total={totalFinal}
          comments={draft.comments || ""}
          isLoading={isLoading}
          onCommentsChange={updateComments}
          onClose={() => !isLoading && setShowCheckout(false)}
          onConfirm={handleFinalizeOrder}
        />
      )}

      {manualCode && (
        <ManualItemModal
          code={manualCode}
          // Si es un producto con peso, le inyectamos la cantidad del multiplicador como base
          product={selectedProduct ?? undefined}
          onClose={closeManualModal}
          onConfirm={handleConfirmManual}
        />
      )}

      {showCustomerModal && (
        <CustomerSelectorModal
          onClose={() => setShowCustomerModal(false)}
          onSelect={(c) => {
            setSelectedCustomer(c);
            setShowCustomerModal(false);
          }}
        />
      )}
    </div>
  );
}


// --- Funciones de Mapeo actualizadas ---
const mapProductToOrderItem = (p: Product, qty: number = 1): OrderItem => ({
  productId: p.id,
  barcode: p.id,
  branch: p.branch,
  article: p.article,
  unitPrice: p.price, // Este va a cambiar dinámicamente con el volumen
  originalPrice: p.price, // 🆕 Guardamos el precio base fijo de la fábrica
  quantity: qty, 
  subtotal: p.price * qty 
});

// --- Objeto de Estilos Optimizado para Layout ---
const styles: Record<string, React.CSSProperties> = {
  screenContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#0F1115", /* Asegura consistencia de fondo */
  },
  contentWrapper: {
    maxWidth: "1000px",
    width: "100%",
    padding: "20px 40px 160px 40px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: 20
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 600,
    margin: "0 0 4px 0",
    color: "white"
  },
  subtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.85rem",
    margin: 0
  },
  loader: {
    color: "#54C4F0",
    fontSize: "0.85rem",
    fontWeight: 500
  },
  multiplierBanner: {
    display: "flex",
    alignItems: "center",
    padding: "12px 30px",
    borderRadius: "8px",
    border: "1px solid",
    marginBottom: 10,
    transition: "all 0.2s ease",
    height: "45px",
    boxSizing: "border-box"
  },
  multiplierInputField: {
    background: "#161920",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    color: "white",
    padding: "4px 8px",
    fontSize: "0.9rem",
    width: "100px",
    outline: "none"
  },
};

