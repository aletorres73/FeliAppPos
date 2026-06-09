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
import { AnonymousCustomer, type Customer } from "../../../domain/types/customersTypes";

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

  const totalFinal = draft.total;

  // --- Atajo de teclado Global (F9) para abrir Cobro ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F9" &&
        draft.items.length > 0 &&
        !showCheckout &&
        !showCustomerModal &&
        !showCreateCustomerModal &&
        !manualCode
      ) {
        e.preventDefault();
        setShowCheckout(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [draft.items.length, showCheckout, showCustomerModal, showCreateCustomerModal, manualCode]);

  // --- Auto-focus del scanner ---
  useEffect(() => {
    const isAnyModalOpen = showCheckout || showCustomerModal || manualCode;

    if (!isAnyModalOpen) {
      const focusTimer = setTimeout(() => {
        const scannerInput = document.getElementById("scanner-input") as HTMLInputElement;
        if (scannerInput) scannerInput.focus();
      }, 50);

      return () => clearTimeout(focusTimer);
    }
  }, [showCheckout, showCustomerModal, manualCode]);

  // --- Handlers ---
  const handleSaveNewCustomer = async (data: any) => {
    setIsLoading(true);
    try {
      const newCustomerBase = {
        ...data,
        currentBalance: 0,
        lastPurchaseDate: null,
      };

      const newId = await customerRepository.saveClient(newCustomerBase);

      if (newId) {
        const fullCustomer: Customer = { ...newCustomerBase, id: newId };
        setSelectedCustomer(fullCustomer);
        setShowCreateCustomerModal(false);
      }
    } catch (error) {
      alert("Error al crear el cliente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;

    setIsLoading(true);
    try {
      const product = await getProductById(normalizedCode);

      if (!product) {
        setManualCode(normalizedCode);
        setSelectedProduct(null);
        return;
      }

      if (product.saleWeight) {
        setSelectedProduct(product);
        setManualCode(normalizedCode);
      } else {
        addItem(mapProductToOrderItem(product));
        setSearchTerm("");
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
    addItem(item);
    closeManualModal();
  };

  return (
    <div style={styles.screenContainer}>
      <div style={styles.contentWrapper}>
        <Header isLoading={isLoading} />

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

// --- Header simplificado ---
interface HeaderProps {
  isLoading: boolean;
}

const Header = ({ isLoading }: HeaderProps) => (
  <header style={styles.header}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      <div>
        <h1 style={styles.title}>Nuevo Pedido</h1>
        <p style={styles.subtitle}>Escanea productos o búscalos manualmente</p>
      </div>

      {isLoading && (
        <div style={styles.loader}>
          <span className="pulse-animation">●</span> Buscando...
        </div>
      )}
    </div>
  </header>
);

// --- Funciones de Mapeo ---
const mapProductToOrderItem = (p: Product): OrderItem => ({
  productId: p.id,
  barcode: p.id,
  branch: p.branch,
  article: p.article,
  unitPrice: p.price,
  quantity: 1,
  subtotal: p.price
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
    padding: "30px 40px 160px 40px",
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
};