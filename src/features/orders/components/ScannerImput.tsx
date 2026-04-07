import { useEffect, useRef } from "react"

type Props = {
  onScan: (code: string) => void;
  externalValue: string;        // Nuevo: Valor que viene del Hook
  onChange: (val: string) => void; // Nuevo: Para actualizar el Hook
  suggestions: any[];           // Nuevo: Lista de productos filtrados
}

export function ScannerInput({ onScan, externalValue, onChange, suggestions }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleFocus = (e: MouseEvent) => {
      // 1. Detectamos si hay un modal abierto (dialog)
      const isModalOpen = document.querySelector('[role="dialog"]');

      // 2. Detectamos si el usuario hizo clic en OTRO input o textarea
      // (Por ejemplo, el campo de comentarios o el de efectivo del Checkout)
      const target = e.target as HTMLElement;
      const clickedInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (!isModalOpen && !clickedInput) {
        // Solo robamos el foco si no hay modales y no se hizo clic en otro input
        ref.current?.focus();
      }
    };

    // Foco inicial
    ref.current?.focus();

    // Escuchamos clics en el documento
    document.addEventListener("click", handleFocus);

    return () => document.removeEventListener("click", handleFocus);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column", // Cambiado a column para que las sugerencias bajen
      alignItems: "center",
      margin: "20px 0",
      position: "relative",
      width: "100%",
    }}>
      <style>{`
        .scanner-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          padding: 12px 16px 12px 60px;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          max-width: 600px;
          box-sizing: border-box;
          font-family: monospace;
        }

        .scanner-field:focus {
          border-color: #54C4F0;
          box-shadow: 0 0 15px rgba(84, 196, 240, 0.1);
        }

        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1A1D23;
          border: 1px solid #54C4F0;
          border-radius: 0 0 8px 8px;
          z-index: 1000;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          margin-top: -2px;
        }

        .suggestion-item {
          padding: 12px 15px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
        }

        .suggestion-item:hover {
          background: rgba(84, 196, 240, 0.1);
        }
      `}</style>

      <div style={{ position: "relative", width: "100%", maxWidth: "600px" }}>
        <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>

        <input
          ref={ref}
          className="scanner-field"
          placeholder="Escanear o buscar producto..."
          value={externalValue} // Usa el valor del hook
          onChange={(e) => onChange(e.target.value)} // Actualiza el hook
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (externalValue.trim()) onScan(externalValue.trim());
              onChange(""); // Limpia el buscador
            }
          }}
          autoComplete="off"
        />

        {/* RENDER DE SUGERENCIAS */}
        {suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((p) => (
              <div
                key={p.id}
                className="suggestion-item"
                onMouseDown={(e) => {
                  e.preventDefault(); // Evita que el input pierda el foco antes del click
                  onScan(p.id.toString());
                  onChange("");
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{p.article}</span>
                {/* <span style={{ color: "#54C4F0", fontWeight: "bold" }}>${p.price}</span> */}
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{p.branch}</span>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Disponible: {p.saleWeight ? `${p.weight.toFixed(2)} kg` : p.stock}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}