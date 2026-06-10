import { type Product } from "../../../domain/types/productTypes";
import { formatCurrency } from "../../../domain/utils/formats";
import {
    articleName,
    branchLabel,
    productBadge,
    soldValueStyle,
    editAction,
    deleteAction
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

            {/* Cabecera de la tabla */}
            <div style={tableHeaderStyle}>
                <div style={{ width: '40px' }}></div> {/* 🆕 Espacio para el checkbox */}
                <div style={{ flex: '2' }}>PRODUCTO / DETALLE</div>
                <div style={{ flex: '1' }}>COSTO</div>
                <div style={{ flex: '1' }}>GANANCIA (%)</div>
                <div style={{ flex: '1' }}>P. VENTA</div>
                <div style={{ flex: '1' }}>STOCK</div>
                <div style={{ flex: '1' }}>VENDIDOS</div>
                <div style={{ flex: '1.2', textAlign: 'right' }}>ACCIONES</div>
            </div>

            {filteredProducts.map(product => {
                const variations = product.variations || [];
                const hasVariations = variations.length > 0;
                const totalGroupSold = variations.reduce((acc, v) => acc + (v.quantitySold || 0), 0) + (product.quantitySold || 0);
                const totalGroupWeightSold = variations.reduce((acc, v) => acc + (v.weightSold || 0), 0) + (product.weightSold || 0);

                return (
                    <div key={product.id} style={cardContainerStyle}>

                        {/* FILA PADRE O INDEPENDIENTE */}
                        <div style={rowStyle(true)}>

                            {/* 🆕 Checkbox de Selección */}
                            <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-start' }}>
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
                                    <span style={{ ...articleName, fontSize: '1.05rem' }}>{product.article}</span>
                                    {hasVariations && <span style={productBadge(product.active)}>GRUPO</span>}
                                </div>
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
                            <div style={{ flex: '1.2', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                {hasVariations && (
                                    <button style={destroyGroupButtonStyle} onClick={() => handleDestroyGroup(product.id)}>DISOLVER</button>
                                )}
                                <button style={{ ...editAction, padding: '6px 12px', fontSize: '0.7rem', borderRadius: '4px' }} onClick={() => { setIsEditingMode(true); setEditingProduct(product); setIsModalOpen(true); }}>{hasVariations ? 'CONFIG' : 'EDITAR'}</button>
                                <button style={{ ...deleteAction, padding: '6px 12px', fontSize: '0.7rem', borderRadius: '4px', ...(hasVariations ? disabledDeleteActionStyle : {}) }} disabled={hasVariations} onClick={() => handleDelete(product.id, true)}>ELIMINAR</button>
                            </div>
                        </div>

                        {/* FILAS HIJOS (VARIACIONES) */}
                        {hasVariations && (
                            <div style={variationsListStyle}>
                                {variations.map(v => {
                                    const variantName = v.article.toUpperCase().replace(product.article.toUpperCase(), '').replace(/[-_]/g, '').trim() || 'Estándar';
                                    return (
                                        <div key={v.id} style={rowStyle(false)}>

                                            {/* 🆕 Checkbox de Selección para Hijos (por si quieres moverlos a otro grupo) */}
                                            <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-start' }}>
                                                <input
                                                    type="checkbox"
                                                    style={checkboxStyle}
                                                    checked={selectedProductIds.includes(v.id)}
                                                    onChange={() => toggleSelectProduct(v.id)}
                                                />
                                            </div>

                                            <div style={{ flex: '2', paddingLeft: '20px', display: 'flex', flexDirection: 'column' }}>
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

// ─── 🎨 ESTILOS ACTUALIZADOS (SISTEMA DE COLUMNAS) ───

const listWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box'
};

const tableHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '10px 20px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
};

const cardContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#14171C',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    width: '100%',
    overflow: 'hidden'
};

// Generador de estilos de fila para sincronizar anchos exactos
const rowStyle = (isParent: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: isParent ? '14px 20px' : '10px 20px',
    backgroundColor: isParent ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
    borderBottom: isParent && !isParent ? '1px solid rgba(255,255,255,0.02)' : 'none',
    transition: 'background-color 0.2s',
});

const variationsListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    backgroundColor: '#111418'
};

const cellValueStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: '#FFF',
    fontWeight: '500'
};

const subCellValueStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.6)'
};

const variationNameStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.85rem',
    fontWeight: '500'
};

const miniActionButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '4px'
};

const destroyGroupButtonStyle: React.CSSProperties = {
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    color: '#FEB2B2',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    padding: '6px 12px',
    fontSize: '0.7rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s'
};

const disabledDeleteActionStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid transparent',
    cursor: 'not-allowed',
    opacity: 0.5
};

const bulkActionBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C2028',
    border: '1px dashed #54C4F0',
    borderRadius: '6px',
    padding: '12px 20px',
    color: '#FFF',
    fontSize: '0.9rem',
};

const bulkSelectStyle: React.CSSProperties = {
    backgroundColor: '#14171C',
    color: '#FFF',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    outline: 'none'
};

const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#54C4F0' // Da un color celeste al check en navegadores modernos
};