import { useState } from "react";
import type { Customer } from "../../customers/types/types";

interface Props {
  onClose: () => void;
  onSave: (newCustomer: Omit<Customer, "id" | "currentBalance" | "lastPurchaseDate">) => Promise<void>;
  isLoading: boolean;
}

export function CustomerCreateModal({ onClose, onSave, isLoading }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    phone: "",
    address: "" // Lo enviamos vacío por defecto
  });

  const isFormValid = formData.name.trim() !== "" && formData.lastname.trim() !== "";

  const handleSubmit = async () => {
    if (!isFormValid) return;
    console.log("Guardando nuevo cliente con datos:", formData);
    await onSave(formData);
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.content}>
        <h2 style={{ color: "#54C4F0", marginTop: 0 }}>Nuevo Cliente</h2>
        
        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Nombre *</label>
          <input
            style={modalStyles.input}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Alejandro"
          />
        </div>

        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Apellido *</label>
          <input
            style={modalStyles.input}
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            placeholder="Ej: Torres"
          />
        </div>

        <div style={modalStyles.field}>
          <label style={modalStyles.label}>Teléfono (Opcional)</label>
          <input
            style={modalStyles.input}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Ej: 11 2345 6789"
          />
        </div>

        <div style={modalStyles.actions}>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            style={modalStyles.cancelBtn}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={!isFormValid || isLoading}
            style={{
              ...modalStyles.saveBtn,
              opacity: (!isFormValid || isLoading) ? 0.5 : 1
            }}
          >
            {isLoading ? "Guardando..." : "Guardar y Seleccionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 },
  content: { backgroundColor: "#1A1D23", padding: "24px", borderRadius: "16px", width: "90%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.1)" },
  field: { marginBottom: "16px" },
  label: { display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: "6px" },
  input: { width: "100%", padding: "12px", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", outline: "none" },
  actions: { display: "flex", gap: "12px", marginTop: "24px" },
  cancelBtn: { flex: 1, padding: "12px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "white", borderRadius: "8px", cursor: "pointer" },
  saveBtn: { flex: 2, padding: "12px", backgroundColor: "#54C4F0", border: "none", color: "#0F1115", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }
};