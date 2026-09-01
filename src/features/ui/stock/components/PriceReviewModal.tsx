import { useState } from 'react';
import type { Product } from '../../../domain/types/productTypes';
import type { PriceReviewDecision } from '../../../data/repositories/ProductRepository';
import { formatCurrency } from '../../../domain/utils/formats';

interface PriceReviewModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onResolve: (productId: string, decision: PriceReviewDecision, customPrice?: number) => Promise<void>;
}

const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 25, background: 'rgba(0,0,0,.72)', display: 'grid', placeItems: 'center', padding: 20 };
const panelStyle: React.CSSProperties = { width: 'min(620px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#1A1D23', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, color: 'white', padding: 24 };
const inputStyle: React.CSSProperties = { background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)', borderRadius: 6, padding: '10px 12px' };

export function PriceReviewModal({ products, isOpen, onClose, onResolve }: PriceReviewModalProps) {
  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const [customPrice, setCustomPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const selectedProduct = products.find((product) => product.id === selectedId) || products[0];

  if (!isOpen) return null;

  const resolve = async (decision: PriceReviewDecision) => {
    if (!selectedProduct) return;
    const parsedPrice = Number(customPrice);
    if (decision === 'CUSTOM' && (!customPrice || !Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setError('Ingresa un precio válido.');
      return;
    }
    setError('');
    setIsProcessing(true);
    try {
      await onResolve(selectedProduct.id, decision, decision === 'CUSTOM' ? parsedPrice : undefined);
      const nextProduct = products.find((product) => product.id !== selectedProduct.id);
      if (nextProduct) {
        setSelectedId(nextProduct.id);
        setCustomPrice('');
      } else {
        onClose();
      }
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : 'No se pudo resolver la revisión.');
    } finally {
      setIsProcessing(false);
    }
  };

  return <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="price-review-title">
    <div style={panelStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div><h2 id="price-review-title" style={{ margin: 0 }}>Precios por revisar</h2><p style={{ opacity: .55, margin: '6px 0 0' }}>{products.length} producto(s) pendientes</p></div>
        <button type="button" onClick={onClose} style={{ ...inputStyle, cursor: 'pointer' }}>Cerrar</button>
      </header>
      {!products.length ? <p style={{ opacity: .6, padding: '30px 0' }}>No hay revisiones pendientes.</p> : <>
        <label style={{ display: 'grid', gap: 6, marginTop: 20 }}><span style={{ opacity: .65 }}>PRODUCTO</span><select style={{ ...inputStyle, cursor: 'pointer' }} value={selectedProduct?.id || ''} onChange={(event) => { setSelectedId(event.target.value); setCustomPrice(''); }}><option value="" disabled>Seleccionar producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.article} · {product.id}</option>)}</select></label>
        {selectedProduct && <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            <div><small style={{ opacity: .55 }}>COSTO ANTERIOR</small><strong style={{ display: 'block' }}>{formatCurrency(selectedProduct.previousCost || 0)}</strong></div>
            <div><small style={{ opacity: .55 }}>COSTO NUEVO</small><strong style={{ display: 'block', color: '#FFAB40' }}>{formatCurrency(selectedProduct.cost)}</strong></div>
            <div><small style={{ opacity: .55 }}>PRECIO ACTUAL</small><strong style={{ display: 'block' }}>{formatCurrency(selectedProduct.price)}</strong></div>
            <div><small style={{ opacity: .55 }}>PRECIO SUGERIDO</small><strong style={{ display: 'block', color: '#54C4F0' }}>{formatCurrency(selectedProduct.suggestedPrice || 0)}</strong></div>
          </div>
          <p style={{ opacity: .65 }}>Ganancia configurada: {selectedProduct.gains || 0}%</p>
          <label style={{ display: 'grid', gap: 6, marginTop: 16 }}><span style={{ opacity: .65 }}>PRECIO MANUAL</span><input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} type="number" min="0" step="0.01" value={customPrice} placeholder="Opcional" onChange={(event) => setCustomPrice(event.target.value)} /></label>
          {error && <p style={{ color: '#FF9A9A' }}>{error}</p>}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}><button type="button" disabled={isProcessing} onClick={() => void resolve('KEEP')} style={{ ...inputStyle, cursor: 'pointer' }}>Mantener actual</button><button type="button" disabled={isProcessing} onClick={() => void resolve('SUGGESTED')} style={{ ...inputStyle, cursor: 'pointer', color: '#54C4F0' }}>Aplicar sugerido</button><button type="button" disabled={isProcessing} onClick={() => void resolve('CUSTOM')} style={{ ...inputStyle, cursor: 'pointer', background: '#54C4F0', color: '#0F1115', fontWeight: 700 }}>Guardar manual</button></div>
        </>}
      </>}
    </div>
  </div>;
}
