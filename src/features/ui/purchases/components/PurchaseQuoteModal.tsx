import React, { useState } from 'react';
import type { Purchase, PurchaseItem } from '../../../domain/types/purchaseTypes';
import type { Supplier } from '../../../domain/types/supplierTypes';
import { formatCurrency } from '../../../domain/utils/formats';

interface PurchaseQuoteModalProps {
    purchase: Purchase;
    supplier?: Supplier;
    onClose: () => void;
    onUpdateDraft?: (updatedPurchase: Purchase) => Promise<void>;
    onDeleteDraft?: (docId: string) => Promise<void>;
    onOpenReceive?: (purchase: Purchase) => void;
    isSaving?: boolean;
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 35,
    background: 'rgba(0,0,0,.75)',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
};

const panelStyle: React.CSSProperties = {
    width: 'min(700px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#1A1D23',
    border: '1px solid rgba(84,196,240,.3)',
    borderRadius: 12,
    color: 'white',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const inputStyle: React.CSSProperties = {
    background: '#12151b',
    color: 'white',
    border: '1px solid rgba(255,255,255,.16)',
    borderRadius: 6,
    padding: '6px 10px',
    boxSizing: 'border-box',
    fontSize: '0.85rem',
};

const primaryButtonStyle: React.CSSProperties = {
    background: '#54C4F0',
    color: '#0F1115',
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    padding: '9px 16px',
    borderRadius: 6,
    fontSize: '0.85rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
};

const secondaryButtonStyle: React.CSSProperties = {
    background: 'rgba(84,196,240,.12)',
    color: '#54C4F0',
    border: '1px solid rgba(84,196,240,.4)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: '0.85rem',
};

const ghostButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,.16)',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: '0.85rem',
};

const dangerButtonStyle: React.CSSProperties = {
    background: 'rgba(255,126,126,.12)',
    color: '#FF7E7E',
    border: '1px solid rgba(255,126,126,.3)',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: 6,
    fontSize: '0.85rem',
};

const monoStyle: React.CSSProperties = { fontFamily: 'monospace' };

export function PurchaseQuoteModal({
    purchase,
    supplier,
    onClose,
    onUpdateDraft,
    onDeleteDraft,
    onOpenReceive,
    isSaving = false,
}: PurchaseQuoteModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [items, setItems] = useState<PurchaseItem[]>(purchase.items);
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState('');

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handlePriceChange = (index: number, newUnitCost: number) => {
        setItems((current) => current.map((item, idx) => {
            if (idx !== index) return item;
            const subtotalMultiplier = item.saleWeight ? 10 : 1;
            const subtotal = item.purchaseType === 'BULK' && item.bulkCost !== null
                ? Number(((item.bulks || 0) * (item.bulkCost || 0)).toFixed(2))
                : Number((item.quantity * newUnitCost * subtotalMultiplier).toFixed(2));

            return {
                ...item,
                unitCost: newUnitCost,
                subtotal,
            };
        }));
    };

    const handleBulkCostChange = (index: number, newBulkCost: number) => {
        setItems((current) => current.map((item, idx) => {
            if (idx !== index) return item;
            const units = item.unitsPerBulk || 1;
            const unitCost = Number((newBulkCost / units).toFixed(4));
            const subtotal = Number(((item.bulks || 1) * newBulkCost).toFixed(2));
            return {
                ...item,
                bulkCost: newBulkCost,
                unitCost,
                subtotal,
            };
        }));
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        setItems((current) => current.map((item, idx) => {
            if (idx !== index) return item;
            const subtotalMultiplier = item.saleWeight ? 10 : 1;
            const subtotal = item.purchaseType === 'BULK' && item.bulkCost !== null
                ? Number(((item.bulks || 0) * (item.bulkCost || 0)).toFixed(2))
                : Number((newQuantity * item.unitCost * subtotalMultiplier).toFixed(2));

            return {
                ...item,
                quantity: newQuantity,
                subtotal,
            };
        }));
    };

    const handleBulksChange = (index: number, newBulks: number) => {
        setItems((current) => current.map((item, idx) => {
            if (idx !== index) return item;
            const units = item.unitsPerBulk || 1;
            const quantity = newBulks * units;
            const subtotal = Number((newBulks * (item.bulkCost || 0)).toFixed(2));
            return {
                ...item,
                bulks: newBulks,
                quantity,
                subtotal,
            };
        }));
    };

    const handleSave = async () => {
        if (!onUpdateDraft) return;
        const updatedPurchase: Purchase = {
            ...purchase,
            items,
            total,
            debt: total,
        };
        await onUpdateDraft(updatedPurchase);
        setIsEditing(false);
        setMessage('Cambios guardados en el pedido.');
        setTimeout(() => setMessage(''), 3000);
    };

    const generateTextForSharing = (): string => {
        const supplierName = supplier?.name ? `Proveedor: ${supplier.name}\n` : '';
        const dateStr = new Date(purchase.createdAt).toLocaleDateString('es-AR');
        let text = `📦 *PEDIDO DE MERCADERÍA*\n`;
        text += `ID: ${purchase.docId}\n`;
        text += `Fecha: ${dateStr}\n`;
        if (supplierName) text += `${supplierName}`;
        text += `----------------------------------------\n`;

        items.forEach((item, index) => {
            const branchText = item.branch ? `[${item.branch.toUpperCase()}] ` : '';
            text += `${index + 1}. *${branchText}${item.article}*\n`;
            if (item.purchaseType === 'BULK') {
                text += `   • Cantidad: ${item.bulks} bulto(s) (${item.unitsPerBulk} u/bulto = ${item.quantity} ${item.saleWeight ? 'kg' : 'uds'})\n`;
                text += `   • Precio x bulto: ${formatCurrency(item.bulkCost || 0)} (Unit: ${formatCurrency(item.unitCost)})\n`;
            } else {
                text += `   • Cantidad: ${item.quantity} ${item.saleWeight ? 'kg' : 'unidades'}\n`;
                text += `   • Precio unitario: ${formatCurrency(item.unitCost)}\n`;
            }
            text += `   • Subtotal: ${formatCurrency(item.subtotal)}\n\n`;
        });

        text += `----------------------------------------\n`;
        text += `💰 *TOTAL ESTIMADO: ${formatCurrency(total)}*`;
        return text;
    };

    const copyToClipboard = async () => {
        try {
            const text = generateTextForSharing();
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            alert('No se pudo copiar automáticamente. Puedes seleccionar el texto.');
        }
    };

    const isDraft = purchase.status === 'DRAFT';

    return (
        <div style={overlayStyle} role="dialog" aria-modal="true">
            <div style={panelStyle} id="purchase-quote-capture-area">
                {/* Header de Cotización */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,.1)', paddingBottom: 16, marginBottom: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.3px', color: '#54C4F0' }}>
                                {isDraft ? 'Pedido / Cotización a Proveedor' : 'Detalle de Compra'}
                            </h2>
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: isDraft ? 'rgba(255,171,64,.15)' : 'rgba(128,224,176,.15)',
                                color: isDraft ? '#FFAB40' : '#80E0B0',
                                border: isDraft ? '1px solid rgba(255,171,64,.3)' : '1px solid rgba(128,224,176,.3)',
                            }}>
                                {isDraft ? 'BORRADOR / NO EN STOCK' : 'INGRESADO A STOCK'}
                            </span>
                        </div>
                        <p style={{ opacity: .65, margin: '6px 0 0', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            {supplier?.name ? `Proveedor: ${supplier.name} · ` : ''}Fecha: {new Date(purchase.createdAt).toLocaleDateString('es-AR')} · <span style={monoStyle}>{purchase.docId}</span>
                        </p>
                    </div>
                    <button type="button" onClick={onClose} style={ghostButtonStyle}>✕ Cerrar</button>
                </div>

                {message && (
                    <div style={{ background: 'rgba(128,224,176,.12)', color: '#80E0B0', border: '1px solid rgba(128,224,176,.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: '0.85rem' }}>
                        ✓ {message}
                    </div>
                )}

                {/* Tabla de Artículos */}
                <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                <th style={{ padding: '8px 6px' }}>Marca / Artículo</th>
                                <th style={{ padding: '8px 6px' }}>Tipo</th>
                                <th style={{ padding: '8px 6px', textAlign: 'center' }}>Cantidad</th>
                                <th style={{ padding: '8px 6px', textAlign: 'right' }}>P. Unit / Bulto</th>
                                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.productId} style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                                    <td style={{ padding: '10px 6px', verticalAlign: 'middle' }}>
                                        {item.branch && <span style={{ display: 'block', fontSize: '0.75rem', opacity: .55, textTransform: 'uppercase' }}>{item.branch}</span>}
                                        <strong style={{ fontSize: '0.9rem' }}>{item.article}</strong>
                                    </td>
                                    <td style={{ padding: '10px 6px', verticalAlign: 'middle', opacity: .75 }}>
                                        {item.purchaseType === 'BULK' ? 'Por Bulto' : 'Por Unidad'}
                                    </td>
                                    <td style={{ padding: '10px 6px', verticalAlign: 'middle', textAlign: 'center' }}>
                                        {isEditing ? (
                                            item.purchaseType === 'BULK' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <input
                                                            style={{ ...inputStyle, width: 60, textAlign: 'center' }}
                                                            type="number"
                                                            min="1"
                                                            value={item.bulks}
                                                            onChange={(e) => handleBulksChange(index, Number(e.target.value) || 1)}
                                                        />
                                                        <span style={{ fontSize: '0.75rem', opacity: .6 }}>bultos</span>
                                                    </div>
                                                    <small style={{ opacity: .5, fontSize: '0.7rem' }}>({item.quantity} {item.saleWeight ? 'kg' : 'uds'})</small>
                                                </div>
                                            ) : (
                                                <input
                                                    style={{ ...inputStyle, width: 70, textAlign: 'center' }}
                                                    type="number"
                                                    min="0"
                                                    step={item.saleWeight ? '0.001' : '1'}
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(index, Number(e.target.value) || 0)}
                                                />
                                            )
                                        ) : (
                                            item.purchaseType === 'BULK' ? (
                                                <span>{item.bulks} bulto(s) <small style={{ opacity: .5 }}>({item.quantity} {item.saleWeight ? 'kg' : 'uds'})</small></span>
                                            ) : (
                                                <span>{item.quantity} {item.saleWeight ? 'kg' : 'uds'}</span>
                                            )
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 6px', verticalAlign: 'middle', textAlign: 'right' }}>
                                        {isEditing ? (
                                            item.purchaseType === 'BULK' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                    <input
                                                        style={{ ...inputStyle, width: 90, textAlign: 'right' }}
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.bulkCost ?? ''}
                                                        onChange={(e) => handleBulkCostChange(index, Number(e.target.value) || 0)}
                                                    />
                                                    <small style={{ opacity: .5, fontSize: '0.7rem' }}>u: {formatCurrency(item.unitCost)}</small>
                                                </div>
                                            ) : (
                                                <input
                                                    style={{ ...inputStyle, width: 90, textAlign: 'right' }}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitCost}
                                                    onChange={(e) => handlePriceChange(index, Number(e.target.value) || 0)}
                                                />
                                            )
                                        ) : (
                                            <div>
                                                <strong style={monoStyle}>{formatCurrency(item.purchaseType === 'BULK' && item.bulkCost ? item.bulkCost : item.unitCost)}</strong>
                                                {item.purchaseType === 'BULK' && (
                                                    <small style={{ display: 'block', opacity: .5, fontSize: '0.7rem' }}>u: {formatCurrency(item.unitCost)}</small>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '10px 6px', verticalAlign: 'middle', textAlign: 'right' }}>
                                        <strong style={{ ...monoStyle, color: '#54C4F0' }}>{formatCurrency(item.subtotal)}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Resumen Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16191F', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '14px 18px', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Total Estimado del Pedido:</span>
                    <strong style={{ ...monoStyle, fontSize: '1.3rem', color: '#54C4F0' }}>{formatCurrency(total)}</strong>
                </div>

                {/* Barra de Acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {isDraft && onDeleteDraft && (
                            <button
                                type="button"
                                style={dangerButtonStyle}
                                onClick={() => {
                                    if (window.confirm(`¿Estás seguro de eliminar el pedido ${purchase.docId}?`)) {
                                        void onDeleteDraft(purchase.docId);
                                    }
                                }}
                                disabled={isSaving}
                            >
                                🗑️ Eliminar Pedido
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                            type="button"
                            style={isEditing ? primaryButtonStyle : secondaryButtonStyle}
                            onClick={() => {
                                if (isEditing) {
                                    void handleSave();
                                } else {
                                    setIsEditing(true);
                                }
                            }}
                            disabled={isSaving}
                        >
                            {isEditing ? (isSaving ? 'Guardando...' : '💾 Guardar Cambios') : '✏️ Modificar Precios'}
                        </button>
                        <button
                            type="button"
                            style={{ ...secondaryButtonStyle, color: copied ? '#80E0B0' : '#54C4F0', borderColor: copied ? '#80E0B0' : 'rgba(84,196,240,.4)' }}
                            onClick={() => void copyToClipboard()}
                        >
                            {copied ? '✓ ¡Copiado para WhatsApp!' : '📋 Copiar Texto'}
                        </button>

                        {isDraft && onOpenReceive && (
                            <button
                                type="button"
                                style={primaryButtonStyle}
                                onClick={() => onOpenReceive({ ...purchase, items, total, debt: total })}
                            >
                                📥 Recepcionar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
