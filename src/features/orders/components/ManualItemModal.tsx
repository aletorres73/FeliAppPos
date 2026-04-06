import { useState } from "react"
import type { OrderItem } from "../types/types"
import type { Product } from "../types/types"

type Props = {
  code: string,
  product?: Product,
  onConfirm: (item: OrderItem) => void
  onClose: () => void
}

export function ManualItemModal({ code, product, onConfirm, onClose }: Props) {
  // Si hay producto, usamos sus valores; si no, dejamos vacío para manual
  const [name, setName] = useState(product?.article || "")
  const [price, setPrice] = useState(product?.price || 0)
  const [qty, setQty] = useState(0) // Representa el peso en kg

  return (
    <div style={overlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ marginBottom: '1rem' }}>
          {product ? `Balanza: ${product.article}` : `Producto nuevo (${code})`}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Nombre: Deshabilitado si el producto existe */}
          <label style={labelStyle}>
            Artículo
            <input 
              style={inputStyle}
              value={name} 
              disabled={!!product} 
              onChange={(e) => setName(e.target.value)} 
            />
          </label>

          {/* Precio: Deshabilitado si el producto existe */}
          <label style={labelStyle}>
            Precio por {product?.saleWeight ? '100g' : 'Unidad'}
            <input 
              type="number"
              style={inputStyle}
              value={price} 
              disabled={!!product} 
              onChange={(e) => setPrice(Number(e.target.value))} 
            />
          </label>

          {/* Cantidad/Peso: Siempre editable y con auto-focus */}
          <label style={labelStyle}>
            Ingrese Peso (Kg)
            <input 
              type="number" 
              step="0.001" // Permite gramos (ej: 0.550)
              autoFocus
              style={{ ...inputStyle, borderColor: '#54C4F0', fontSize: '1.5rem' }}
              placeholder="0.000"
              onChange={(e) => setQty(Number(e.target.value))} 
            />
          </label>

          <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(84, 196, 240, 0.1)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#54C4F0' }}>Subtotal calculado:</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
              ${(price * qty*10).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={actionsStyle}>
          <button 
            style={confirmBtnStyle}
            onClick={() => onConfirm({
              productId: product?.id || "",
              barcode: code,
              branch: product?.branch || "",
              article: name,
              unitPrice: price,
              quantity: qty,
              subtotal: price * qty *10
            })}
            disabled={qty <= 0}
          >
            Confirmar Peso
          </button>
          <button style={cancelBtnStyle} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// Estilos rápidos coherentes con tu Dark Theme
const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: "#1A1D23", padding: 30, borderRadius: 16, width: "100%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.1)" };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' };
const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0F1115', color: 'white' };
const actionsStyle: React.CSSProperties = { display: 'flex', gap: '10px', marginTop: '25px' };
const confirmBtnStyle: React.CSSProperties = { flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#54C4F0', color: '#000', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtnStyle: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer' };