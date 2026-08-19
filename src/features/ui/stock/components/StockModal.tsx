//stockmodal
import type React from 'react';
import { useEffect, useState } from 'react';
import { modalStyles } from '../styles/ModalStockStyles';
import { type Product, type VolumePrice } from '../../../domain/types/productTypes'; // 🆕 Asegurá tener exportado VolumePrice de tus types
import { labelStyle, searchInputStyle } from '../styles/StockScreenStyles';
import { formatCurrency, formatDateForInput } from '../../../domain/utils/formats';
import { useKeyboardShortcuts } from '../../../domain/utils/keyboardShorcuts';
import { supplierRepository } from '../../../data/repositories/SupplierRepository';

interface StockModalProps {
    isEditingMode: boolean;
    product: Partial<Product>;
    allProducts: Product[];
    setEditingProduct: (product: Partial<Product> | null) => void;
    handleSave: (e: React.SubmitEvent<HTMLFormElement>) => void;
    handleCostChange: (cost: number) => void;
    handleGainsChange: (gains: number) => void;
    handlePriceChange: (price: number) => void;
    handleGroupAssignment: (parentId: string) => void;
    setIsModalOpen: (open: boolean) => void;
    onClose?: () => void;
}

// utils/priceCalculator.ts
const calculatePrice = (cost: number, margin: number) => (cost * (1 + margin / 100));
const calculateMargin = (cost: number, price: number) => (cost > 0 ? ((price - cost) / cost) * 100 : 0);



export function StockModal(
    {
        isEditingMode,
        product,
        allProducts,
        setEditingProduct,
        handleSave,
        handleCostChange,
        handleGainsChange,
        handlePriceChange,
        handleGroupAssignment,
        onClose
    }: StockModalProps
) {

    // --- 🆕 Nombre del último proveedor (para datos de bulto) ---
    const [lastSupplierName, setLastSupplierName] = useState('');

    useEffect(() => {
        let active = true;
        if (product.lastSupplierId) {
            supplierRepository.getById(product.lastSupplierId).then((supplier) => {
                if (active && supplier) setLastSupplierName(supplier.name);
            });
        } else {
            setLastSupplierName('');
        }
        return () => { active = false; };
    }, [product.lastSupplierId]);

    // --- 🆕 Funciones Locales para Manejar Escalas de Precios ---
    const addVolumePriceRule = () => {
        const currentRules = product.volumePrices || [];
        const newRule: VolumePrice = { fromQuantity: '0', specialPrice: '0', gains: '0' };
        setEditingProduct({
            ...product,
            volumePrices: [...currentRules, newRule]
        });
    };

    useKeyboardShortcuts({
        'Escape': () => {
            if (onClose) onClose();
        },
        'Enter': () => {
            // Solo guardamos si el foco no está en un textarea (para evitar conflictos con comentarios)
            if (!(document.activeElement instanceof HTMLTextAreaElement)) {
                handleSave({
                    preventDefault: () => { },
                    target: document.querySelector('form')
                } as unknown as React.FormEvent<HTMLFormElement> as React.SubmitEvent<HTMLFormElement>);;
            }
        }
    });

    const updateVolumePriceRule = (index: number, field: keyof VolumePrice, value: number) => {
        if (!product.volumePrices) return;

        const newRules = [...product.volumePrices];
        const baseCost = product.cost || 0;

        // Clonamos la regla a modificar
        const updatedRule = { ...newRules[index], [field]: value };

        // Lógica reactiva: si cambia el margen, recalcula el precio. Si cambia el precio, recalcula el margen.
        if (field === 'gains') {
            updatedRule.specialPrice = calculatePrice(baseCost, value).toFixed(2);
        } else if (field === 'specialPrice') {
            updatedRule.gains = calculateMargin(baseCost, value).toFixed(2);
        }

        newRules[index] = updatedRule;
        setEditingProduct({ ...product, volumePrices: newRules });
    };

    const removeVolumePriceRule = (index: number) => {
        const currentRules = product.volumePrices ? [...product.volumePrices] : [];
        currentRules.splice(index, 1);
        setEditingProduct({
            ...product,
            volumePrices: currentRules
        });
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={{ ...modalStyles.content, maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}> {/* Fix para que no se desborde la modal en pantallas chicas */}
                <h3 style={modalStyles.title}>
                    {isEditingMode ? 'Editar Artículo' : 'Nuevo Artículo'}
                </h3>

                {/* 🆕 ETIQUETA DE CAMBIO DE COSTO PENDIENTE DE REVISIÓN */}
                {product.pricingReviewPending && (
                    <div style={{
                        backgroundColor: 'rgba(255, 171, 64, 0.12)',
                        border: '1px solid rgba(255, 171, 64, 0.45)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '16px',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                            <strong style={{ color: '#FFAB40', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                                COSTO ACTUALIZADO · REVISAR PRECIO
                            </strong>
                            <button
                                type="button"
                                onClick={() => {
                                    const suggested = product.suggestedPrice ?? product.price ?? 0;
                                    const newCost = product.cost ?? 0;
                                    setEditingProduct({
                                        ...product,
                                        cost: newCost,
                                        price: suggested,
                                        gains: Number(calculateMargin(newCost, suggested).toFixed(2)),
                                        pricingReviewPending: false
                                    });
                                }}
                                style={{
                                    marginLeft: 'auto',
                                    background: '#54C4F0',
                                    color: '#0F1115',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                APLICAR SUGERIDO
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.8rem' }}>
                            <div>
                                <small style={{ opacity: 0.55, display: 'block' }}>COSTO ANTERIOR</small>
                                <strong style={{ color: '#FF9A9A' }}>{formatCurrency(product.previousCost ?? 0)}</strong>
                            </div>
                            <div>
                                <small style={{ opacity: 0.55, display: 'block' }}>COSTO ACTUAL</small>
                                <strong style={{ color: '#FFAB40' }}>{formatCurrency(product.cost ?? 0)}</strong>
                            </div>
                            <div>
                                <small style={{ opacity: 0.55, display: 'block' }}>MARGEN</small>
                                <strong>{product.gains ?? 0}%</strong>
                            </div>
                            <div>
                                <small style={{ opacity: 0.55, display: 'block' }}>PRECIO SUGERIDO</small>
                                <strong style={{ color: '#54C4F0' }}>{formatCurrency(product.suggestedPrice ?? 0)}</strong>
                            </div>
                        </div>
                        {product.costUpdatedAt ? (
                            <small style={{ opacity: 0.5, display: 'block', marginTop: '8px' }}>
                                Cambio registrado el {formatDateForInput(product.costUpdatedAt)}
                            </small>
                        ) : null}
                    </div>
                )}

                <div style={modalStyles.checkboxRow}>
                    <span style={modalStyles.checkboxLabel}>
                        Definir como producto base
                    </span>
                    <input
                        style={modalStyles.checkbox}
                        type="checkbox"
                        checked={product.isParent || false}
                        onChange={(e) => setEditingProduct({ ...product, isParent: e.target.checked, parentId: null })}
                    />
                </div>

                {/* Asignar a un Grupo */}
                {!product.isParent && (
                    <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                        <span style={labelStyle}>ASIGNAR A GRUPO EXISTENTE</span>
                        <select
                            style={searchInputStyle}
                            value={product.parentId || ""}
                            onChange={(e) => handleGroupAssignment(e.target.value)}
                        >
                            <option value="">Producto independiente</option>
                            {allProducts.filter(p => p.isParent).map(parent => (
                                <option key={parent.id} value={parent.id}>{parent.article} ({parent.branch})</option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handleSave} style={modalStyles.form}>

                    {/* Input para ID / Código de barras */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>CÓDIGO DE BARRAS / ID *</label>
                        <input
                            type="text"
                            style={{
                                ...modalStyles.input,
                                backgroundColor: isEditingMode ? '#22262F' : '#1A1D23',
                                color: isEditingMode ? 'rgba(255,255,255,0.4)' : 'white'
                            }}
                            required
                            disabled={isEditingMode}
                            placeholder="Escribe o escanea con el lector..."
                            autoFocus={!isEditingMode}
                            value={product.id || ''}
                            onChange={e => setEditingProduct({ ...product, id: e.target.value.toUpperCase() })}
                        />
                    </div>

                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>NOMBRE DEL ARTÍCULO *</label>
                        <input
                            type="text"
                            style={modalStyles.input}
                            required
                            value={product.article || ''}
                            onChange={e => setEditingProduct({ ...product, article: e.target.value })}
                        />
                    </div>

                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>MARCA / PROVEEDOR</label>
                        <input
                            type="text"
                            style={modalStyles.input}
                            value={product.branch || ''}
                            onChange={e => setEditingProduct({ ...product, branch: e.target.value })}
                        />
                    </div>

                    {/* Fila Financiera */}
                    <div style={modalStyles.row}>
                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                            <label style={modalStyles.label}>COSTO ($)</label>
                            <input
                                type="number"
                                style={modalStyles.input}
                                min="0"
                                step="any"
                                value={product.pricingReviewPending ? (product.previousCost ?? '') : (product.cost ?? '')}
                                onChange={e => handleCostChange(Number(e.target.value))}
                            />
                        </div>
                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                            <label style={modalStyles.label}>MARGEN (%)</label>
                            <input
                                type="number"
                                style={modalStyles.input}
                                min="0"
                                step="any"
                                placeholder="0"
                                value={product.gains || ''}
                                onChange={e => handleGainsChange(Number(e.target.value))}
                            />
                        </div>
                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                            <label style={modalStyles.label}>PRECIO VENTA ($) *</label>
                            <input
                                type="number"
                                style={modalStyles.input}
                                required
                                min="0"
                                step="any"
                                value={product.price || ''}
                                onChange={e => handlePriceChange(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* 🆕 DATOS DE COMPRA POR BULTO */}
                    {(product.unitsPerBulk || product.bulkCost || product.lastSupplierId) && (
                        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                            <span style={labelStyle}>DATOS DE COMPRA POR BULTO</span>
                            <div style={modalStyles.row}>
                                <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                    <label style={{ ...modalStyles.label, fontSize: '0.55rem' }}>CANTIDAD POR BULTO</label>
                                    <input
                                        type="number"
                                        style={modalStyles.input}
                                        min="1"
                                        step="1"
                                        value={product.unitsPerBulk ?? ''}
                                        onChange={e => {
                                            const units = Math.max(1, Number(e.target.value) || 1);
                                            setEditingProduct({ ...product, unitsPerBulk: units });
                                            if (product.bulkCost && product.bulkCost > 0) handleCostChange(product.bulkCost / units);
                                        }}
                                    />
                                </div>
                                <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                    <label style={{ ...modalStyles.label, fontSize: '0.55rem' }}>COSTO POR BULTO</label>
                                    <input
                                        type="number"
                                        style={modalStyles.input}
                                        min="0"
                                        step="0.01"
                                        value={product.bulkCost ?? ''}
                                        onChange={e => {
                                            const bulkCost = Number(e.target.value);
                                            const units = product.unitsPerBulk || 1;
                                            setEditingProduct({ ...product, bulkCost });
                                            if (units > 0 && bulkCost > 0) handleCostChange(bulkCost / units);
                                        }}
                                    />
                                </div>
                                <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                    <label style={{ ...modalStyles.label, fontSize: '0.55rem' }}>ÚLTIMO PROVEEDOR</label>
                                    <input
                                        type="text"
                                        style={{ ...modalStyles.input, backgroundColor: '#22262F', color: 'rgba(255,255,255,0.4)' }}
                                        disabled
                                        value={lastSupplierName || (product.lastSupplierId || 'Sin proveedor registrado')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🆕 SECCIÓN DE PRECIOS POR VOLUMEN / ESCALONADOS */}
                    <div style={modalStyles.volumeSectionContainer}>
                        <div style={modalStyles.volumeHeaderRow}>
                            <label style={modalStyles.label}>PRECIOS ESPECIALES POR CANTIDAD / VOLUMEN</label>
                            <button
                                type="button"
                                style={modalStyles.addRuleButton}
                                onClick={addVolumePriceRule}
                            >
                                + AGREGAR ESCALA
                            </button>
                        </div>

                        {product.volumePrices && product.volumePrices.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                {product.volumePrices.map((rule, index) => (
                                    <div key={index} style={modalStyles.row}>
                                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                            <label style={{ ...modalStyles.label, fontSize: '0.55rem' }}>A PARTIR DE ({product.saleWeight ? 'KG' : 'UDS'})</label>
                                            <input
                                                type="number"
                                                style={modalStyles.input}
                                                min="0.001"
                                                step="any"
                                                required
                                                placeholder={product.saleWeight ? "Ej: 2" : "Ej: 12"}
                                                value={rule.fromQuantity || ''}
                                                onChange={e => updateVolumePriceRule(index, 'fromQuantity', Number(e.target.value))}
                                            />
                                        </div>
                                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                            <label style={modalStyles.label}>MARGEN (%)</label>
                                            <input
                                                type="number"
                                                style={modalStyles.input}
                                                min="0"
                                                step="any"
                                                placeholder="0"
                                                value={rule.gains || ''}
                                                onChange={e => updateVolumePriceRule(index, 'gains', Number(e.target.value))}
                                            />
                                        </div>
                                        <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                            <label style={{ ...modalStyles.label, fontSize: '0.55rem' }}>PRECIO ESPECIAL UNITARIO ($)</label>
                                            <input
                                                type="number"
                                                style={modalStyles.input}
                                                min="0"
                                                step="any"
                                                required
                                                placeholder="Ej: 4000"
                                                value={rule.specialPrice || ''}
                                                onChange={e => updateVolumePriceRule(index, 'specialPrice', Number(e.target.value))}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            style={modalStyles.deleteRuleButton}
                                            onClick={() => removeVolumePriceRule(index)}
                                            title="Eliminar regla"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={modalStyles.emptyRulesText}>
                                No hay precios preferenciales por cantidad configurados para este artículo.
                            </div>
                        )}
                    </div>
                    {/* --- FIN SECCIÓN NUEVA --- */}

                    {/* Fila de Control de Stock / Peso */}
                    <div style={modalStyles.formGroup}>
                        {product.saleWeight ? (
                            <>
                                <label style={modalStyles.label}>PESO DISPONIBLE (KG)</label>
                                <input
                                    type="number"
                                    style={modalStyles.input}
                                    min="0"
                                    step="0.001"
                                    value={product.weight || ''}
                                    onChange={e => setEditingProduct({ ...product, weight: Number(e.target.value) })}
                                />
                            </>
                        ) : (
                            <>
                                <label style={modalStyles.label}>STOCK (UNIDADES)</label>
                                <input
                                    type="number"
                                    style={modalStyles.input}
                                    min="0"
                                    value={product.stock || ''}
                                    onChange={e => setEditingProduct({ ...product, stock: Math.floor(Number(e.target.value)) })}
                                />
                            </>
                        )}
                    </div>

                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>FECHA DE VENCIMIENTO</label>
                        <input
                            type="date"
                            style={modalStyles.input}
                            value={formatDateForInput(product.expirationDate || Date.now())}
                            onChange={e => setEditingProduct({
                                ...product,
                                expirationDate: e.target.value ? new Date(e.target.value + 'T00:00:00').getTime() : null
                            })}
                        />
                    </div>

                    <div style={modalStyles.checkboxRow}>
                        <label style={modalStyles.checkboxLabel}>
                            <input
                                type="checkbox"
                                style={modalStyles.checkbox}
                                checked={product.saleWeight || false}
                                onChange={e => setEditingProduct({
                                    ...product,
                                    saleWeight: e.target.checked,
                                    stock: e.target.checked ? 0 : product.stock,
                                    weight: e.target.checked ? product.weight : 0
                                })}
                            />
                            Se vende por peso (Fraccionado)
                        </label>

                        <label style={modalStyles.checkboxLabel}>
                            <input
                                type="checkbox"
                                style={modalStyles.checkbox}
                                checked={product.active ?? true}
                                onChange={e => setEditingProduct({ ...product, active: e.target.checked })}
                            />
                            Artículo activo en catálogo
                        </label>
                    </div>

                    <div style={modalStyles.actions}>
                        <button
                            type="button"
                            style={modalStyles.cancelButton}
                            onClick={onClose}
                        >
                            CANCELAR
                        </button>
                        <button type="submit" style={modalStyles.submitButton}>
                            {isEditingMode ? 'GUARDAR CAMBIOS' : 'AGREGAR ARTÍCULO'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}