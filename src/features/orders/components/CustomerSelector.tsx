interface SelectorProps {
  selected: any;
  onClick: () => void;
  onClear: () => void; // Nueva prop para limpiar
}

export function CustomerSelector({ selected, onClick, onClear }: SelectorProps) {
  const isAnonymous = selected.id === "0";

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
        transition: "0.3s"
      }}
    >
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: "0 0 4px 0", color: "#54C4F0", fontSize: "0.95rem" }}>
          Cliente: {selected.name} {selected.lastname}
        </h3>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
          {isAnonymous ? "Venta al mostrador" : `ID: ${selected.id} • Saldo: $${selected.currentBalance}`}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Solo mostramos la X si NO es anónimo */}
        {!isAnonymous && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita que se abra la modal
              onClear();
            }}
            style={{
              background: "rgba(255, 75, 75, 0.1)",
              border: "none",
              color: "#FF4B4B",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold"
            }}
            title="Quitar cliente"
          >
            ✕
          </button>
        )}
        <span style={{ color: "#54C4F0", fontSize: "0.85rem" }}>
          {isAnonymous ? "Seleccionar ➜" : "Cambiar"}
        </span>
      </div>
    </div>
  );
}