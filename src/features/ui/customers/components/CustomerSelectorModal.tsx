import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "../../../domain/utils/formats";
import type { Customer } from "../../../domain/types/customersTypes";
import { customerRepository } from "../../../data/repositories/CustomerRepository";

interface Props {
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerSelectorModal({ onClose, onSelect }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  
  // Ref para controlar el scroll del contenedor de la lista
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  // Efecto para hacer scroll automático al elemento seleccionado
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const loadCustomers = async () => {
    try {
      const data = await customerRepository.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastname.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCustomers[selectedIndex]) {
          onSelect(filteredCustomers[selectedIndex]);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <div style={modalStyles.header}>
          <h2 style={{ color: "#54C4F0", margin: 0 }}>Seleccionar Cliente</h2>
          <button onClick={onClose} style={modalStyles.closeBtn}>✕</button>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(-1); // Reseteamos al escribir
          }}
          autoFocus
          style={modalStyles.searchInput}
          onKeyDown={handleKeyDown}
        />

        <div style={modalStyles.list} ref={listRef}>
          {loading ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Cargando...</p>
          ) : (
            filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                onClick={() => onSelect(customer)}
                style={{
                  ...modalStyles.item,
                  ...(index === selectedIndex ? modalStyles.itemSelected : {})
                }}
              >
                <div>
                  <strong style={{ display: "block" }}>{customer.name} {customer.lastname}</strong>
                  <small style={{ color: "rgba(255,255,255,0.4)" }}>ID: {customer.id}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: customer.currentBalance > 0 ? "#FF4B4B" : "#54C4F0" }}>
                    {formatCurrency(customer.currentBalance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Estilos consolidados
const modalStyles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" },
  content: { backgroundColor: "#1A1D23", width: "100%", maxWidth: "500px", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  closeBtn: { background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" },
  searchInput: { width: "100%", padding: "12px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", marginBottom: "15px", outline: "none" },
  list: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" },
  item: { padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "0.2s" },
  itemSelected: { backgroundColor: "rgba(84, 196, 240, 0.2)", border: "1px solid #54C4F0" }
};