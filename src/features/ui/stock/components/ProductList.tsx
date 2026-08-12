import type React from 'react';
import { getExpirationState, type Product } from "../../../domain/types/productTypes";
import { formatCurrency } from "../../../domain/utils/formats";
import {
    articleName, branchLabel, productBadge, soldValueStyle, editAction, deleteAction, variationNameStyle,
    miniActionButtonStyle, destroyGroupButtonStyle, disabledDeleteActionStyle, bulkActionBarStyle,
    bulkSelectStyle, checkboxStyle, listWrapperStyle, tableHeaderStyle, cardContainerStyle,
    rowStyle, variationsListStyle, cellValueStyle, subCellValueStyle,
    productBadgePromotion
} from '../styles/StockScreenStyles';

interface GroupedProduct extends Product {
    variations?: Product[];
}

// 1. Agregamos las nuevas props a la interfaz
interface ProductListProps {
    filteredProducts: GroupedProduct[];
    setIsEditingMode: (isEditing: boolean) => void;
    setEditingProduct: (product: Partial<Product> | null) => void;
    setIsModalOpen: (isOpen: boolean) => void;
    handleDelete: (id: string, isParent?: boolean) => void;
    handleDestroyGroup: (parentId: string) => void;

    // 🆕 Props para selección masiva
    selectedProductIds: string[];
    toggleSelectProduct: (id: string) => void;
    handleBulkGroupAssignment: (parentId: string) => void;
}

const getExpirationBadgeStyle = (state: 'expired' | 'expiringSoon' | null): React.CSSProperties => {
    if (state === 'expired') {
        return {
            fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px',
            backgroundColor: '#D64545', color: '#FFF4F4', fontWeight: 700,
            border: '1px solid rgba(214,69,69,0.4)', marginBottom: '8px'
        };
    }

    if (state === 'expiringSoon') {
        return {
            fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px',
            backgroundColor: '#FFAB40', color: '#4A2300', fontWeight: 700,
            border: '1px solid rgba(255,171,64,0.4)', marginBottom: '8px'
        };
    }

    return {};
};

const formatExpirationDate = (expirationDate?: number | null) => {
    if (!expirationDate) return '';
    return new Date(expirationDate).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export function ProductList({
    filteredProducts, setIsEditingMode, setEditingProduct, setIsModalOpen, handleDelete, handleDestroyGroup,
    selectedProductIds, toggleSelectProduct, handleBulkGroupAssignment // 🆕
}: ProductListProps) {

    // Filtramos cuáles de los productos en pantalla podrían ser elegidos como "Padre"
    const posiblesPadres = filteredProducts.filter(p => !p.parentId);

    return (
        <div style={listWrapperStyle}>

            {/* ─── 🆕 BARRA DE ACCIÓN MASIVA (Aparece solo si hay seleccionados) ─── */}
            {selectedProductIds.length > 0 && (
                <div style={bulkActionBarStyle}>
                    <span>🛒 <b>{selectedProductIds.length}</b> productos seleccionados</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8rem', color: '#AAA' }}>Agrupar dentro de:</label>
                        <select
                            style={bulkSelectStyle}
                            defaultValue=""
                            onChange={(e) => {
                                const parentId = e.target.value;
                                if (parentId) {
                                    if (window.confirm(`¿Quieres meter los ${selectedProductIds.length} productos seleccionados dentro de este grupo?`)) {
                                        handleBulkGroupAssignment(parentId);
                                    }
                                    e.target.value = ""; // Resetea el select
                                }
                            }}
                        >
                            <option value="" disabled>-- Selecciona el Producto Padre --</option>
                            {posiblesPadres.map(p => (
                                <option key={p.id} value={p.id}>{p.article} ({p.branch})</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div style={tableHeaderStyle}>
                <div></div> {/* Espacio Checkbox */}
                <div>PRODUCTO</div>
                <div>COSTO</div>
                <div>GANANCIA (%)</div>
                <div>P. VENTA</div>
                <div>STOCK</div>
                <div>VENDIDOS</div>
                <div style={{ textAlign: 'right' }}>ACCIONES</div>
            </div>

            {filteredProducts.map(product => {
                const variations = product.variations || [];
                const hasVariations = variations.length > 0;
                const totalGroupSold = variations.reduce((acc, v) => acc + (v.quantitySold || 0), 0) + (product.quantitySold || 0);
                const totalGroupWeightSold = variations.reduce((acc, v) => acc + (v.weightSold || 0), 0) + (product.weightSold || 0);
                const hasVolumePrice = (product.volumePrices || []).length > 0;
                const productExpirationState = getExpirationState(product.expirationDate);

                return (
                    <div key={product.id} style={cardContainerStyle}>

                        {/* FILA PADRE O INDEPENDIENTE */}
                        <div style={rowStyle(true)}>

                            {/* 🆕 Checkbox de Selección */}
                            <div style={{ width: '10px', display: 'flex', justifyContent: 'flex-start', alignSelf: 'flex-start', marginTop: '3px' }}>
                                <input
                                    type="checkbox"
                                    style={checkboxStyle}
                                    checked={selectedProductIds.includes(product.id)}
                                    onChange={() => toggleSelectProduct(product.id)}
                                />
                            </div>

                            {/* Columna 1: Info Principal */}
                            <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {hasVariations && <span style={productBadge(product.active)}>GRUPO</span>}
                                    {hasVolumePrice && <span style={productBadgePromotion(product.active)}>PROMOCION</span>}
                                    {productExpirationState && (
                                        <span style={getExpirationBadgeStyle(productExpirationState)}>
                                            {productExpirationState === 'expired' ? 'VENCIDO' : 'VENCE PRONTO'} · {formatExpirationDate(product.expirationDate)}
                                        </span>
                                    )}
                                    {(() => {
                                        const lastActivity = product.lastSoldAt ?? product.createdAt;
                                        const isLowRotation = ((Date.now() - lastActivity) > 20 * 24 * 60 * 60 * 1000) &&
                                            (product.saleWeight ? (product.weight || 0) > 0 : (product.stock || 0) > 0);
                                        return isLowRotation  ? (
                                            <span style={{
                                                fontSize: '0.5rem', padding: '2px 4px', borderRadius: '4px',
                                                backgroundColor: 'rgba(255, 171, 64, 0.12)',
                                                color: '#FFAB40', fontWeight: 700,
                                                border: '1px solid rgba(255, 171, 64, 0.25)',
                                                marginBottom: '8px',
                                            }}
                                            >
                                                BAJA ROTACIÓN
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                                <span style={{ ...articleName, fontSize: '1.05rem' }}>{product.article}</span>
                                <span style={branchLabel}>
                                    {product.branch || 'Sin Marca'}
                                    <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '8px', fontSize: '0.7rem' }}>ID: {product.id}</span>
                                </span>
                            </div>

                            <div style={{ flex: '1' }}><span style={cellValueStyle}>{formatCurrency(product.cost || 0)}</span></div>
                            <div style={{ flex: '1' }}><span style={{ ...cellValueStyle, color: '#47D6A7' }}>{product.gains ? `${product.gains}%` : '0%'}</span></div>
                            <div style={{ flex: '1' }}><span style={{ ...cellValueStyle, color: '#54C4F0', fontWeight: '700' }}>{formatCurrency(product.price || 0)}</span></div>
                            <div style={{ flex: '1' }}><span style={{ ...cellValueStyle, color: (product.stock <= 5 && !product.saleWeight) ? '#FFAB40' : '#FFF' }}>{product.saleWeight ? `${(product.weight || 0).toFixed(3)} kg` : `${product.stock || 0} un.`}</span></div>
                            <div style={{ flex: '1' }}><span style={{ ...soldValueStyle, fontSize: '0.9rem', margin: 0 }}>{product.saleWeight ? `${totalGroupWeightSold.toFixed(3)} kg` : `${totalGroupSold} un.`}</span></div>

                            {/* Acciones Padre */}
                            <div style={{ flex: '0.8', display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                                {hasVariations && (
                                    <button style={{ ...destroyGroupButtonStyle, width: '100%' }} onClick={() => handleDestroyGroup(product.id)}>DISOLVER</button>
                                )}
                                <button style={{ ...editAction, padding: '6px 12px', fontSize: '0.6rem', borderRadius: '4px', width: '100%' }} onClick={() => { setIsEditingMode(true); setEditingProduct(product); setIsModalOpen(true); }}>{hasVariations ? 'CONFIG' : 'EDITAR'}</button>
                                <button style={{ ...deleteAction, padding: '6px 12px', fontSize: '0.6rem', borderRadius: '4px', width: '100%', ...(hasVariations ? disabledDeleteActionStyle : {}) }} disabled={hasVariations} onClick={() => handleDelete(product.id, true)}>ELIMINAR</button>
                            </div>
                        </div>

                        {/* FILAS HIJOS (VARIACIONES) */}
                        {hasVariations && (
                            <div style={variationsListStyle}>
                                {[...variations].sort((a, b) => {
                                    if (!a.expirationDate) return 1;
                                    if (!b.expirationDate) return -1;
                                    return a.expirationDate - b.expirationDate;
                                }).map(v => {
                                    const variantName = v.article.toUpperCase().replace(product.article.toUpperCase(), '').replace(/[-_]/g, '').trim() || 'Estándar';
                                    const variationExpirationState = getExpirationState(v.expirationDate);
                                    return (
                                        <div key={v.id} style={rowStyle(true)}>

                                            {/* 🆕 Checkbox de Selección para Hijos (por si quieres moverlos a otro grupo) */}
                                            <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-start' }}>
                                                <input
                                                    type="checkbox"
                                                    style={checkboxStyle}
                                                    checked={selectedProductIds.includes(v.id)}
                                                    onChange={() => toggleSelectProduct(v.id)}
                                                />
                                            </div>

                                            <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                                                {variationExpirationState && (
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <span style={getExpirationBadgeStyle(variationExpirationState)}>
                                                            {variationExpirationState === 'expired' ? 'VENCIDO' : 'VENCE PRONTO'} · {formatExpirationDate(v.expirationDate)}
                                                        </span>
                                                    </div>
                                                )}
                                                <span style={variationNameStyle}>{variantName}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem', marginLeft: '14px' }}>ID: {v.id}</span>

                                            </div>

                                            {/* ... (Las columnas del hijo y sus botones quedan EXACTAMENTE IGUALES) ... */}
                                            <div style={{ flex: '1' }}><span style={subCellValueStyle}>{formatCurrency(v.cost || 0)}</span></div>
                                            <div style={{ flex: '1' }}><span style={{ ...subCellValueStyle, color: 'rgba(71, 214, 167, 0.7)' }}>{v.gains ? `${v.gains}%` : '0%'}</span></div>
                                            <div style={{ flex: '1' }}><span style={{ ...subCellValueStyle, color: '#54C4F0' }}>{formatCurrency(v.price || 0)}</span></div>
                                            <div style={{ flex: '1' }}><span style={{ ...subCellValueStyle, color: (v.stock <= 5 && !v.saleWeight) ? '#FFAB40' : 'rgba(255,255,255,0.8)' }}>{v.saleWeight ? `${(v.weight || 0).toFixed(3)} kg` : `${v.stock || 0} un.`}</span></div>
                                            <div style={{ flex: '1' }}><span style={subCellValueStyle}>{v.saleWeight ? `${(v.weightSold || 0).toFixed(3)} kg` : `${v.quantitySold || 0} un.`}</span></div>
                                            <div style={{ flex: '1.2', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button type="button" style={miniActionButtonStyle} onClick={() => { setIsEditingMode(true); setEditingProduct(v); setIsModalOpen(true); }}>✏️</button>
                                                <button type="button" style={{ ...miniActionButtonStyle, color: '#E53E3E' }} onClick={() => handleDelete(v.id, false)}>❌</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
