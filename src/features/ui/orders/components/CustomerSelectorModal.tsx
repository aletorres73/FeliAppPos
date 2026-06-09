import { useState, useEffect } from "react";
import { formatCurrency } from "../../../domain/utils/formats"; // Por si quieres mostrar deudas
import type { Customer } from "../../../domain/types/customersTypes";
import { customerRepository } from "../../../data/repositories/CustomerRepository"; // Asumiendo que tienes esta función

interface Props {
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerSelectorModal({ onClose, onSelect }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

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

  // Lógica de búsqueda
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.lastname.toLowerCase().includes(search.toLowerCase()) 
  );

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
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={modalStyles.searchInput}
        />

        <div style={modalStyles.list}>
          {loading ? (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Cargando clientes...</p>
          ) : (
            filteredCustomers.map(customer => (
              <div 
                key={customer.id} 
                onClick={() => onSelect(customer)}
                style={modalStyles.item}
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

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" },
  content: { backgroundColor: "#1A1D23", width: "100%", maxWidth: "500px", borderRadius: "16px", padding: "24px", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  closeBtn: { background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" },
  searchInput: { width: "100%", padding: "12px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", marginBottom: "15px", outline: "none" },
  list: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" },
  item: { padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "0.2s" }
};