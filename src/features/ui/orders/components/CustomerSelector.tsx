interface SelectorProps {
  selected: any;
  onClick: () => void;      // Abre el buscador de clientes
  onClear: () => void;      // Vuelve a AnonymousCustomer
  onOpenCreate: () => void; // Abre el modal de creación
}

export function CustomerSelector({ selected, onClick, onClear, onOpenCreate }: SelectorProps) {
  const isAnonymous = selected.id === null;

  return (
    <div 
      onClick={onClick}
      style={{ 
        padding: "12px 16px", 
        backgroundColor: "rgba(84, 196, 240, 0.05)", 
        borderRadius: "12px",
        border: isAnonymous ? "1px dashed rgba(84, 196, 240, 0.3)" : "1px solid #54C4F0",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "0.2s",
        marginBottom: "10px"
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 4px 0", color: "#54C4F0", fontSize: "0.95rem" }}>
          {isAnonymous ? "Venta al mostrador" : `Cliente: ${selected.name} ${selected.lastname}`}
        </h3>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          {isAnonymous 
            ? "No se asociará deuda a ninguna cuenta" 
            : `ID: ${selected.id} • Saldo actual: $${selected.currentBalance}`
          }
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* BOTÓN PARA CREAR NUEVO (Solo se ve si es anónimo) */}
        {isAnonymous && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Importante para no abrir el buscador
              onOpenCreate();
            }}
            style={{
              backgroundColor: "rgba(84, 196, 240, 0.1)",
              border: "1px solid rgba(84, 196, 240, 0.5)",
              color: "#54C4F0",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "0.75rem",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>+</span> NUEVO
          </button>
        )}

        {/* BOTÓN PARA LIMPIAR (Solo si hay un cliente real) */}
        {!isAnonymous && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={{
              background: "rgba(255, 75, 75, 0.1)",
              border: "none",
              color: "#FF4B4B",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px"
            }}
            title="Quitar cliente"
          >
            ✕
          </button>
        )}

        {/* INDICADOR DE ACCIÓN */}
        <span style={{ 
          color: "rgba(255,255,255,0.3)", 
          fontSize: "1.2rem", 
          marginLeft: "5px",
          userSelect: "none"
        }}>
          {isAnonymous ? "🔍" : "➜"}
        </span>
      </div>
    </div>
  );
}