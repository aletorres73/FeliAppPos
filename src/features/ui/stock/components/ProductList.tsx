import { type Product } from "../../../domain/types/productTypes";
import { formatCurrency } from "../../../domain/utils/formats";
import {
    articleName,
    branchLabel,
    productBadge,
    labelStyle,
    valueStyle,
    soldValueStyle,
    editAction,
    deleteAction
} from '../styles/StockScreenStyles';

interface GroupedProduct extends Product {
    variations?: Product[];
}

interface ProductListProps {
    filteredProducts: GroupedProduct[];
    setIsEditingMode: (isEditing: boolean) => void;
    setEditingProduct: (product: Partial<Product> | null) => void;
    setIsModalOpen: (isOpen: boolean) => void;
    handleDelete: (id: string, isParent?: boolean) => void; // 💡 Agregamos flag opcional
}

export function ProductList({ filteredProducts, setIsEditingMode, setEditingProduct, setIsModalOpen, handleDelete }: ProductListProps) {
    return (
        <div style={listWrapperStyle}>
            {filteredProducts.map(product => {
                const variations = product.variations || [];
                const hasVariations = variations.length > 0;

                // 🧮 Métricas del grupo o producto simple
                const totalGroupStock = variations.reduce((acc, v) => acc + (v.stock || 0), 0);
                const totalGroupWeight = variations.reduce((acc, v) => acc + (v.weight || 0), 0);
                const totalGroupSold = variations.reduce((acc, v) => acc + (v.quantitySold || 0), 0) + (product.quantitySold || 0);
                const totalGroupWeightSold = variations.reduce((acc, v) => acc + (v.weightSold || 0), 0) + (product.weightSold || 0);
                const groupPrice = product.price || (hasVariations ? variations[0].price : 0);

                return (
                    <div key={product.id} style={cardContainerStyle}>

                        {/* 1. SECCIÓN SUPERIOR: Información Principal y Precios */}
                        <div style={topSectionStyle}>

                            {/* Bloque Identificador */}
                            <div style={mainInfoBlockStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                    <span style={{ ...articleName, fontSize: '1.2rem' }}>{product.article}</span>
                                    {hasVariations && (
                                        <span style={productBadge(product.active)}>
                                            GRUPO
                                        </span>
                                    )}
                                </div>
                                <span style={branchLabel}>
                                    {product.branch || 'Sin Marca'}
                                    <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: '10px', fontSize: '0.75rem' }}>ID: {product.id}</span>
                                </span>
                            </div>

                            {/* Bloque Financiero y Rendimiento */}
                            <div style={metricsBlockStyle}>
                                <div style={metricItemStyle}>
                                    <span style={labelStyle}>PRECIO DE VENTA</span>
                                    <span style={{ ...valueStyle, color: '#54C4F0', fontSize: '1.2rem', fontWeight: '700' }}>
                                        {formatCurrency(groupPrice)}
                                    </span>
                                </div>

                                <div style={metricItemStyle}>
                                    <span style={labelStyle}>HISTORIAL DE VENTAS</span>
                                    <span style={{ ...soldValueStyle, margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                                        {product.saleWeight ? `${totalGroupWeightSold.toFixed(3)} kg` : `${totalGroupSold} un.`}
                                    </span>
                                </div>

                                {/* Stock Global (Se muestra aquí si es un producto simple) */}
                                {!hasVariations && (
                                    <div style={metricItemStyle}>
                                        <span style={labelStyle}>STOCK DISPONIBLE</span>
                                        <span style={{
                                            ...valueStyle,
                                            fontSize: '1.1rem',
                                            color: (product.stock <= 5 && !product.saleWeight) ? '#FFAB40' : '#47D6A7'
                                        }}>
                                            {product.saleWeight ? `${(product.weight || 0).toFixed(3)} kg` : `${product.stock || 0} un.`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Botones de Control Superiores */}
                            <div style={actionsBlockStyle}>
                                <button
                                    style={{ ...editAction, padding: '8px 16px', fontSize: '0.75rem', borderRadius: '6px' }}
                                    onClick={() => { setIsEditingMode(true); setEditingProduct(product); setIsModalOpen(true); }}
                                >
                                    {hasVariations ? 'CONFIG. GRUPO' : 'EDITAR'}
                                </button>

                                <button
                                    style={{
                                        ...deleteAction,
                                        padding: '8px 16px',
                                        fontSize: '0.75rem',
                                        borderRadius: '6px',
                                        // 🎨 Si tiene hijos, aplicamos un estilo desaturado/bloqueado
                                        ...(hasVariations ? disabledDeleteActionStyle : {})
                                    }}
                                    disabled={hasVariations} // 🛑 Bloqueo nativo de HTML
                                    title={hasVariations ? "No puedes eliminar un grupo que contiene variaciones. Elimina primero todos sus hijos." : "Eliminar este producto"}
                                    onClick={() => {
                                        // Este bloque ahora solo se ejecuta si NO tiene variaciones (es producto simple)
                                        if (window.confirm(`¿Eliminar el producto "${product.article}"?`)) {
                                            handleDelete(product.id, true);
                                        }
                                    }}
                                >
                                    ELIMINAR
                                </button>
                            </div>
                        </div>

                        {/* 2. SECCIÓN INFERIOR: Desglose de Variaciones */}
                        {hasVariations && (
                            <div style={bottomVariationsSectionStyle}>
                                <div style={variationsHeaderStyle}>
                                    <span style={{ ...labelStyle, letterSpacing: '1px' }}>VARIACIONES EN CATÁLOGO</span>
                                    <span style={totalStockBadgeStyle}>
                                        STOCK TOTAL: {product.saleWeight ? `${totalGroupWeight.toFixed(3)} kg` : `${totalGroupStock} un.`}
                                    </span>
                                </div>

                                <div style={variationsGridStyle}>
                                    {variations.map(v => (
                                        <div key={v.id} style={variationItemStyle}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={variationNameStyle}>
                                                    {v.article.toUpperCase().replace(product.article.toUpperCase(), '').replace(/[-_]/g, '').trim() || 'Estándar'}
                                                </span>
                                                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>ID: {v.id}</span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem',
                                                    marginRight: '4px',
                                                    color: (v.stock <= 5 && !v.saleWeight) ? '#FFAB40' : '#FFF'
                                                }}>
                                                    {v.saleWeight ? `${(v.weight || 0).toFixed(3)} kg` : `${v.stock || 0} un.`}
                                                </span>

                                                {/* Botón Editar variante */}
                                                <button
                                                    type="button"
                                                    style={miniActionButtonStyle}
                                                    title="Editar stock de variante"
                                                    onClick={() => { setIsEditingMode(true); setEditingProduct(v); setIsModalOpen(true); }}
                                                >
                                                    ✏️
                                                </button>

                                                {/* 🗑️ NUEVO: Botón Eliminar Variante Individual */}
                                                <button
                                                    type="button"
                                                    style={{ ...miniActionButtonStyle, color: '#E53E3E' }}
                                                    title="Eliminar esta variación"
                                                    onClick={() => {
                                                        if (window.confirm(`¿Eliminar la variación "${v.article}"?`)) {
                                                            handleDelete(v.id, false); // false indica que es un hijo
                                                        }
                                                    }}
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                );
            })}
        </div>
    );
}

// --- 🎨 ACTUALIZACIÓN DE ESTILOS ---

const listWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    padding: '12px 0',
    boxSizing: 'border-box'
};

const cardContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#14171C',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '10px',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const topSectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box'
};

const mainInfoBlockStyle: React.CSSProperties = {
    flex: '1.5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left'
};

const metricsBlockStyle: React.CSSProperties = {
    flex: '2',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: '40px',
    alignItems: 'center'
};

const metricItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left'
};

const actionsBlockStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    alignItems: 'center'
};

const bottomVariationsSectionStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
};

const variationsHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
};

const totalStockBadgeStyle: React.CSSProperties = {
    backgroundColor: 'rgba(84, 196, 240, 0.08)',
    color: '#54C4F0',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '4px',
    letterSpacing: '0.5px'
};

const variationsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', // Ajustado a 240px para acomodar el nuevo botón holgadamente
    gap: '10px',
    width: '100%'
};

const variationItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C2028',
    border: '1px solid rgba(255,255,255,0.02)',
    borderRadius: '6px',
    padding: '10px 14px',
    textAlign: 'left'
};

const variationNameStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.85rem',
    fontWeight: '500'
};

// Unificamos el estilo de los botones internos
const miniActionButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    padding: '4px',
    opacity: 0.6,
    transition: 'opacity 0.2s, transform 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const disabledDeleteActionStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.02)',
    cursor: 'not-allowed', // Cambia el puntero a una señal de prohibido
    opacity: 0.6
};