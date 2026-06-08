import { useState } from "react"
import type { OrderItem } from "../../../domain/types/orderTypes"
import type { Product } from "../../../domain/types/productTypes"

type Props = {
  code: string,
  product?: Product,
  onConfirm: (item: OrderItem) => void
  onClose: () => void
}

export function ManualItemModal({ code, product, onConfirm, onClose }: Props) {
  const [name, setName] = useState(product?.article || "")
  const [price, setPrice] = useState(product?.price || 0)
  const [qty, setQty] = useState<number>(0)
  
  // Estado para el tipo de venta: 'UNIT' o 'WEIGHT'
  // Si viene de la base de datos, respetamos su tipo. Si es nuevo, default 'UNIT'.
  const [saleType, setSaleType] = useState<'UNIT' | 'WEIGHT'>(
    product ? (product.saleWeight ? 'WEIGHT' : 'UNIT') : 'UNIT'
  )

  const isNewProduct = !product;

  const calculateSubtotal = () => {
    if (saleType === 'WEIGHT') {
      return price * qty * 10; // Lógica de balanza (precio x 100g)
    }
    return price * qty; // Lógica de unidad simple
  };

  return (
    <div style={styles.overlay} role="dialog">
      <div style={styles.modal}>
        <h3 style={{ marginBottom: '1.5rem', color: '#54C4F0' }}>
          {isNewProduct ? `Producto nuevo (${code})` : `Balanza: ${product.article}`}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Selector de Tipo (Solo si es producto nuevo) */}
          {isNewProduct && (
            <div style={styles.typeSelector}>
              <button 
                onClick={() => setSaleType('UNIT')}
                style={{ ...styles.typeBtn, backgroundColor: saleType === 'UNIT' ? '#54C4F0' : 'transparent', color: saleType === 'UNIT' ? '#000' : '#fff' }}
              >
                Por Unidad
              </button>
              <button 
                onClick={() => setSaleType('WEIGHT')}
                style={{ ...styles.typeBtn, backgroundColor: saleType === 'WEIGHT' ? '#54C4F0' : 'transparent', color: saleType === 'WEIGHT' ? '#000' : '#fff' }}
              >
                Por Peso
              </button>
            </div>
          )}

          <label style={styles.label}>
            Artículo
            <input 
              style={styles.input}
              value={name} 
              disabled={!isNewProduct} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nombre del producto..."
            />
          </label>

          <label style={styles.label}>
            Precio {saleType === 'WEIGHT' ? 'por 100g' : 'por Unidad'}
            <input 
              type="number"
              style={styles.input}
              value={price} 
              disabled={!isNewProduct} 
              onChange={(e) => setPrice(Number(e.target.value))} 
            />
          </label>

          <label style={styles.label}>
            Ingrese {saleType === 'WEIGHT' ? 'Peso (Kg)' : 'Cantidad'}
            <input 
              type="number" 
              step={saleType === 'WEIGHT' ? "0.001" : "1"}
              autoFocus
              style={{ ...styles.input, border: '1px solid #54C4F0', fontSize: '1.5rem' }}
              placeholder={saleType === 'WEIGHT' ? "0.000" : "0"}
              onChange={(e) => setQty(Number(e.target.value))} 
            />
          </label>

          <div style={styles.subtotalBox}>
            <span style={{ fontSize: '0.9rem', color: '#54C4F0' }}>Subtotal calculado:</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
              ${calculateSubtotal().toFixed(2)}
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button 
            style={styles.confirmBtn}
            onClick={() => onConfirm({
              productId: product?.id || `MANUAL-${code}`,
              barcode: code,
              branch: product?.branch || "Manual",
              article: name,
              unitPrice: price,
              quantity: qty,
              subtotal: calculateSubtotal()
            })}
            disabled={qty <= 0 || !name}
          >
            Confirmar
          </button>
          <button style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { background: "#1A1D23", padding: 30, borderRadius: 16, width: "100%", maxWidth: "400px", border: "1px solid rgba(255,255,255,0.1)" },
  typeSelector: { display: 'flex', gap: '10px', marginBottom: '10px', background: '#0F1115', padding: '5px', borderRadius: '10px' },
  typeBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' as const, transition: '0.2s' },
  label: { display: 'flex', flexDirection: 'column' as const, gap: '5px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0F1115', color: 'white', outline: 'none' },
  subtotalBox: { marginTop: '10px', padding: '15px', background: 'rgba(84, 196, 240, 0.1)', borderRadius: '12px', textAlign: 'center' as const },
  actions: { display: 'flex', gap: '12px', marginTop: '25px' },
  confirmBtn: { flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#54C4F0', color: '#000', fontWeight: 'bold' as const, cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer' }
};