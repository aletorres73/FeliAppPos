import type { OrderItem } from "../types/types"

type Props = {
  items: OrderItem[]
  onRemove: (index: number) => void
}

export function OrderList({ items, onRemove }: Props) {
  // Layout limpio para 6 columnas alineadas
  const gridLayout = "1.2fr 2fr 1fr 0.6fr 1fr 50px";

  return (
    <div style={{ marginTop: 20 }}>
      {/* Estilos CSS Inyectados (In-component styles) */}
      <style>{`
        .order-item-row {
          transition: background-color 0.15s ease-in-out, border-radius 0.15s ease-in-out;
        }
        
        .order-item-row:hover {
          background-color: rgba(255, 255, 255, 0.04); /* Un toque casi invisible */
          border-radius: 6px; /* Redondeamos ligeramente al hover */
          cursor: pointer;
        }

        /* Ajuste para el botón de eliminar cuando la fila tiene hover */
        .order-item-row:hover .delete-btn {
          color: rgba(230, 57, 70, 0.6) !important; /* Rojo más visible al hover de la fila */
        }
      `}</style>

      {/* Cabecera Ultra Minimalista */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: gridLayout, 
        padding: "0 12px 12px 12px", 
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)", // Aún más sutil
        color: "rgba(255, 255, 255, 0.45)", 
        fontSize: "0.75rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: "normal",
      }}>
        <div>Marca</div>
        <div>Artículo</div>
        <div style={{ textAlign: "right" }}>Precio</div>
        <div style={{ textAlign: "center" }}>Cant.</div>
        <div style={{ textAlign: "right" }}>Total</div>
      </div>

      {/* Listado de Items con Hover */}
      <div style={{ maxHeight: "400px", overflowY: "auto", marginTop: 8 }}>
        {items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "rgba(255, 255, 255, 0.2)", fontSize: '0.9rem' }}>
            🛒 El pedido está vacío
          </div>
        ) : (
          items.map((item, i) => (
            <div 
              key={`${item.productId}-${i}`} 
              // Añadimos la clase CSS aquí
              className="order-item-row"
              style={{ 
                display: "grid", 
                gridTemplateColumns: gridLayout, 
                padding: "16px 12px", 
                alignItems: "center",
                fontSize: "0.85rem",
                color: "white", 
                borderBottom: "1px solid rgba(255, 255, 255, 0.02)", 
              }}
            >
              <div style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem" }}>
                {item.branch || "—"}
              </div>
              
              <div style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.95)" }}>
                {item.article}
              </div>
              
              <div style={{ textAlign: "right", fontFamily: "monospace", color: "rgba(255, 255, 255, 0.7)" }}>
                {item.unitPrice.toFixed(2)}
              </div>
              
              <div style={{ textAlign: "center", fontWeight: 'bold', fontSize: '1.05rem', color: "white" }}>
                {item.quantity}
              </div>
              
              <div style={{ textAlign: "right", fontWeight: "bold", fontSize: '0.9rem', color: "#54C4F0" }}> {/* Un toque de color sutil para el total */}
                {item.subtotal.toFixed(2)}
              </div>

              {/* Botón Eliminar con Clase para CSS */}
              <div style={{ textAlign: "center" }}>
                <button 
                  onClick={() => onRemove(i)}
                  // Clase para el selector CSS compuesto
                  className="delete-btn"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(230, 57, 70, 0.2)", // Rojo súper atenuado
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.1s"
                  }}
                  title="Eliminar ítem"
                  onMouseOver={(e) => (e.currentTarget.style.color = "#e63946")} // Resalta totalmente al hover directo
                  onMouseOut={(e) => (e.currentTarget.style.color = "rgba(230, 57, 70, 0.2)")}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}