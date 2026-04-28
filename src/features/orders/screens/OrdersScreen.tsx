import { useState } from "react";
import { ScannerInput } from "../components/ScannerImput";
import { OrderList } from "../components/OrderList";
import { ManualItemModal } from "../components/ManualItemModal";
import { CustomerSelectorModal } from "../components/CustomerSelectorModal";
import { useOrder } from "../hook/useOrder";
import { getProductById } from "../../data/repositories/ProductRepository";
import feliLogo from "../../../assets/logo-feli.webp";
import type { Product, OrderItem, OrderPayStatus, PaymentMethod } from "../types/orderTypes";
import { CheckoutModal } from "../components/CheckoutModal";
import { AnonymousCustomer, type Customer } from "../../customers/types/types";
import { CustomerSelector } from "../components/CustomerSelector";
import { customerRepository } from "../../data/repositories/CustomerRepository";
import { CustomerCreateModal } from "../components/CustomerCreateModal";
import { CashFlowButton, SaleDashboardButton } from "../components/navigationButtons";
import { useNavigate } from 'react-router-dom'; // Importamos el hook de navegación
import { Footer } from "../components/Footer";

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

  // Derivación de datos (Selectors)
  // const subtotal = draft.subtotal;
  // const totalDiscount = Math.max(0, subtotal - globalDiscount);
  const totalFinal = draft.total

  const navigate = useNavigate();

  // Handlers
  const handleSaveNewCustomer = async (data: any) => {
    setIsLoading(true);
    try {
      const newCustomerBase = {
        ...data,
        currentBalance: 0,
        lastPurchaseDate: null,
      };

      // 1. Guardar en Firebase (nos devuelve el ID generado por la transacción)
      const newId = await customerRepository.saveClient(newCustomerBase);

      if (newId) {
        // 2. Crear el objeto completo para el estado local
        const fullCustomer: Customer = {
          ...newCustomerBase,
          id: newId
        };

        // 3. SELECCIONAR AUTOMÁTICAMENTE
        setSelectedCustomer(fullCustomer);
        setShowCreateCustomerModal(false);
        console.log("Cliente creado y seleccionado:", fullCustomer);
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
      console.log("Producto encontrado:", product);

      if (!product) {
        // CASO A: Producto no existe en BD -> Modal Manual para crear uno nuevo
        setManualCode(normalizedCode);
        setSelectedProduct(null); // Aseguramos que esté limpio
        return;
      }

      if (product.saleWeight) {
        // CASO B: Existe y es pesable -> Modal para ingresar peso
        setSelectedProduct(product);
        setManualCode(normalizedCode);
      } else {
        // CASO C: Existe y es unidad simple -> Agregar directo
        addItem(mapProductToOrderItem(product));
        setSearchTerm(""); // Limpiamos el buscador tras agregar
      }
    } catch (error) {
      console.error("Error en Scanner:", error);
      // Si hay error de red, también podemos permitir el ingreso manual
      setManualCode(normalizedCode);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeOrder = async (
    payStatus: OrderPayStatus,
    customerPayment: number,
    paymentMethod: PaymentMethod) => {
    // 1. Evitar ejecución si ya está en curso
    if (isLoading) return;

    try {
      setIsLoading(true);
      const orderId = await commitOrder(draft, payStatus, customerPayment, paymentMethod, selectedCustomer);

      if (orderId) {
        clearDraft();
        setShowCheckout(false);
        setSelectedCustomer(AnonymousCustomer); // Resetear para la próxima venta
        setGlobalDiscount(0)
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
    <div style={styles.container}>
      <div style={styles.content}>
        <Header isLoading={isLoading} onNavigate={(route) => navigate(route)} />

        <CustomerSelector
          selected={selectedCustomer}
          onClick={() => setShowCustomerModal(true)}
          onClear={() => setSelectedCustomer(AnonymousCustomer)} // <--- Aquí la lógica
          onOpenCreate={() => setShowCreateCustomerModal(true)} // <--- Aquí la lógica
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
            onUpdate={(index, newQty) => updateQuantity(index, newQty)} // Conexión aquí
          />
        </section>

        <section>
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
        </section>
      </div>

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
          isLoading={isLoading} // <--- IMPORTANTE: Conecta el estado de carga aquí
          onCommentsChange={updateComments}
          onClose={() => !isLoading && setShowCheckout(false)} // No deja cerrar si está guardando
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
            console.log("Cliente seleccionado:", c);
            setSelectedCustomer(c);
            setShowCustomerModal(false);
          }}
        />
      )}
    </div>
  );
}

// --- Sub-componentes internos para mayor claridad ---

interface HeaderProps {
  isLoading: boolean;
  onNavigate: (route: string) => void;
}


const Header = ({ isLoading, onNavigate }: HeaderProps) => (
  <header style={styles.header}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
      <div style={styles.headerBrand}>
        <div style={styles.logoWrapper}>
          <img src={feliLogo} alt="Logo" style={styles.logo} />
        </div>
        <div>
          <h1 style={styles.title}>Feli App - Nuevo Pedido</h1>
          <p style={styles.subtitle}>Escanea productos para comenzar</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {isLoading && (
          <div style={styles.loader}>
            <span className="pulse-animation">●</span> Buscando...
          </div>
        )}
        {/* Ahora el botón ejecuta la navegación */}
        <CashFlowButton onClick={() => {}} />
        <SaleDashboardButton onClick={() => onNavigate('reports')} />
      </div>
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

// --- Objeto de Estilos ---
const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh", // Forzamos que la app mida exactamente el alto de la pantalla
    backgroundColor: "#0F1115",
    color: "white",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    // flexDirection: "column", // Layout vertical
    // overflow: "hidden" // Evitamos scroll en el body
  },
  content: {
    flex: 1, // Este contenedor ocupará todo el espacio sobrante entre header y footer
    maxWidth: "900px",
    margin: "0 auto",
    width: "100%",
    padding: "10px 120px 180px 120px", // El padding inferior (120px) previene que el footer pise el contenido
    overflowY: "auto", // Solo el contenido hace scroll
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: 20
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "18px"
  },
  logoWrapper: {
    width: "80px", height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
    overflow: "hidden"
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain"
  },
  title: {
    fontSize: "1.35rem",
    fontWeight: 600,
    margin: 2
  },
  subtitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.8rem",
    margin: 0
  },
  loader: {
    color: "#54C4F0",
    fontSize: "0.85rem",
    fontWeight: 500
  },
  label: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.9rem",
    display: "block",
    marginBottom: 4
  },
  subtotalValue: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "1.2rem"
  },
  itemCount: {
    color: "rgba(255,255,255,0.3)"
  },
  totalLabel: {
    color: "#54C4F0",
    fontSize: "0.9rem",
    fontWeight: 600, display: "block",
    // marginBottom: 5
  },
  totalValue: {
    fontSize: "2.5rem",
    // margin: 0,
    color: "#54C4F0",
    fontWeight: 700
  },
};

