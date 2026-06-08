import React, { useState, useEffect, useMemo } from 'react';

import {
    getProducts, deleteProduct, addProduct, updateProduct
} from '../../../data/repositories/ProductRepository';

import { type Product } from '../../../domain/types/productTypes';
import { formatCurrency } from '../../../../utils/formats';
import {
    stockContainer, headerStyle, mainTitleStyle,
    primaryButtonStyle, productCard, searchInputStyle,
    searchContainer, gridStyle, cardHeader, articleName,
    productBadge, cardBody, dataGroup, labelStyle, valueStyle, cardFooter,
    editAction, deleteAction, subtitleStyle,
    branchLabel,
    soldValueStyle,
    fullScreenCenter,
} from '../styles/StockScreenStyles';
// import { setLogLevel } from 'firebase/app';

export default function StockScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Nueva bandera para diferenciar entre creación y edición real
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Error cargando stock:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            // Aseguramos que si la propiedad no existe, se evalúe como un texto vacío
            const article = p?.article || '';
            const branch = p?.branch || '';
            const id = p?.id || '';

            return (
                article.toLowerCase().includes(searchTerm.toLowerCase()) ||
                branch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [products, searchTerm]);

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este producto?")) {
            await deleteProduct(id);
            loadProducts();
        }
    };

    // --- Lógica de Cálculos Bidireccionales ---
    const handleCostChange = (costVal: number) => {
        const gains = editingProduct?.gains || 0;
        // Si cambia el costo, recalculamos el precio manteniendo el % de ganancia actual
        const calculatedPrice = costVal * (1 + gains / 100);

        setEditingProduct(prev => prev ? {
            ...prev,
            cost: costVal,
            price: Number(calculatedPrice.toFixed(2))
        } : null);
    };

    const handleGainsChange = (gainsVal: number) => {
        const cost = editingProduct?.cost || 0;
        // Si cambia la ganancia, calculamos el precio de venta final
        const calculatedPrice = cost * (1 + gainsVal / 100);

        setEditingProduct(prev => prev ? {
            ...prev,
            gains: gainsVal,
            price: Number(calculatedPrice.toFixed(2))
        } : null);
    };

    const handlePriceChange = (priceVal: number) => {
        const cost = editingProduct?.cost || 0;
        let calculatedGains = 0;

        // Si el costo es mayor a 0, calculamos el % de ganancia con base en el precio ingresado
        if (cost > 0) {
            calculatedGains = ((priceVal - cost) / cost) * 100;
        }

        setEditingProduct(prev => prev ? {
            ...prev,
            price: priceVal,
            gains: Number(calculatedGains.toFixed(2))
        } : null);
    };

    // --- Guardar Cambios ---
    const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        if (!editingProduct?.id || !editingProduct?.article || !editingProduct?.price) {
            alert("Por favor, completa los campos obligatorios (Código, Artículo y Precio).");
            return;
        }

        try {
            if (isEditingMode) {
                // Modo Edición
                await updateProduct(editingProduct.id, editingProduct as Product);
            } else {
                // Modo Nuevo Producto (Mapeo completo)
                const newProduct: Product = {
                    id: editingProduct.id.trim(),
                    article: editingProduct.article,
                    branch: editingProduct.branch || '',
                    price: editingProduct.price,
                    stock: editingProduct.stock || 0,
                    cost: editingProduct.cost || 0,
                    weight: editingProduct.weight || 0,
                    saleWeight: editingProduct.saleWeight || false,
                    active: editingProduct.active ?? true,
                    gains: editingProduct.gains || 0,
                    quantitySold: 0,
                    weightSold: 0,
                    createdAt: new Date().getTime(), // Usamos timestamp para consistencia
                    updatedAt: null,
                };
                await addProduct(newProduct);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            loadProducts();
        } catch (error) {
            console.error("Error al guardar el producto:", error);
        }
    };

    if (isLoading) return <div style={fullScreenCenter}>CARGANDO INVENTARIO...</div>;

    return (
        <div style={stockContainer}>
            <header style={headerStyle}>
                <div style={{ textAlign: 'left' }}>
                    <h2 style={mainTitleStyle}>Control de Inventario</h2>
                    <p style={subtitleStyle}>{products.length} productos en el catálogo</p>
                </div>
                <button
                    style={primaryButtonStyle}
                    onClick={() => {
                        setIsEditingMode(false);
                        setEditingProduct({ id: '', active: true, saleWeight: false, stock: 0, weight: 0, cost: 0, gains: 0, price: 0 });
                        setIsModalOpen(true);
                    }}
                >
                    + NUEVO ARTÍCULO
                </button>
            </header>

            <div style={searchContainer}>
                <input
                    type="text"
                    placeholder="Buscar por artículo, marca o código..."
                    style={searchInputStyle}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={gridStyle}>
                {filteredProducts.map(product => (
                    <div key={product.id} style={productCard}>
                        <div style={cardHeader}>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                                <span style={articleName}>{product.article}</span>
                                <span style={branchLabel}>
                                    {product.branch || 'Sin Marca'} <span style={{ color: 'rgba(255,255,255,0.2)' }}>| ID: {product.id}</span>
                                </span>
                            </div>
                            <span style={productBadge(product.active)}>
                                {product.active ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>

                        <div style={cardBody}>
                            <div style={dataGroup}>
                                <span style={labelStyle}>STOCK DISPONIBLE</span>
                                <span style={{
                                    ...valueStyle,
                                    color: (product.stock <= 5 && !product.saleWeight) ? '#FFAB40' : '#54C4F0'
                                }}>
                                    {product.saleWeight ? `${product.weight.toFixed(3)} kg` : `${product.stock} un.`}
                                </span>
                            </div>

                            <div style={dataGroup}>
                                <span style={labelStyle}>PRECIO UNITARIO</span>
                                <span style={valueStyle}>{formatCurrency(product.price)}</span>
                            </div>

                            <div style={{ ...dataGroup, gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                                <span style={labelStyle}>RENDIMIENTO HISTÓRICO</span>
                                <span style={soldValueStyle}>
                                    Vendido: {product.saleWeight
                                        ? `${(product.weightSold || 0).toFixed(3)} kg`
                                        : `${product.quantitySold || 0} unidades`}
                                </span>
                            </div>
                        </div>

                        <div style={cardFooter}>
                            <button style={editAction} onClick={() => { setIsEditingMode(true); setEditingProduct(product); setIsModalOpen(true); }}>EDITAR</button>
                            <button style={deleteAction} onClick={() => handleDelete(product.id)}>ELIMINAR</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL DINÁMICA DE CREACIÓN / EDICIÓN --- */}
            {isModalOpen && editingProduct && ( 
                <div style={modalStyles.overlay}>
                    <div style={modalStyles.content}>
                        <h3 style={modalStyles.title}>
                            {isEditingMode ? 'Editar Artículo' : 'Nuevo Artículo'}
                        </h3>

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
                                    disabled={isEditingMode} // Bloqueado en edición para proteger claves primarias
                                    placeholder="Escribe o escanea con el lector..."
                                    autoFocus={!isEditingMode} // Foco automático al crear para pistolear directo
                                    value={editingProduct.id || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, id: e.target.value.toUpperCase() })} // Convertir a mayúsculas para consistencia en códigos
                                />
                            </div>

                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>NOMBRE DEL ARTÍCULO *</label>
                                <input
                                    type="text"
                                    style={modalStyles.input}
                                    required
                                    value={editingProduct.article || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, article: e.target.value })}
                                />
                            </div>

                            <div style={modalStyles.formGroup}>
                                <label style={modalStyles.label}>MARCA / PROVEEDOR</label>
                                <input
                                    type="text"
                                    style={modalStyles.input}
                                    value={editingProduct.branch || ''}
                                    onChange={e => setEditingProduct({ ...editingProduct, branch: e.target.value })}
                                />
                            </div>

                            {/* Fila Financiera: Costo, Ganancia y Precio Venta Interconectados */}
                            <div style={modalStyles.row}>
                                <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                    <label style={modalStyles.label}>COSTO ($)</label>
                                    <input
                                        type="number"
                                        style={modalStyles.input}
                                        min="0"
                                        step="any"
                                        value={editingProduct.cost || ''}
                                        onChange={e => handleCostChange(Number(e.target.value))}
                                    />
                                </div>
                                <div style={{ ...modalStyles.formGroup, flex: 1 }}>
                                    <label style={modalStyles.label}>GANANCIA (%)</label>
                                    <input
                                        type="number"
                                        style={modalStyles.input}
                                        min="0"
                                        step="any"
                                        placeholder="0"
                                        value={editingProduct.gains || ''}
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
                                        value={editingProduct.price || ''}
                                        onChange={e => handlePriceChange(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Fila de Control de Stock / Peso */}
                            <div style={modalStyles.formGroup}>
                                {editingProduct.saleWeight ? (
                                    <>
                                        <label style={modalStyles.label}>PESO DISPONIBLE (KG)</label>
                                        <input
                                            type="number"
                                            style={modalStyles.input}
                                            min="0"
                                            step="0.001"
                                            value={editingProduct.weight || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, weight: Number(e.target.value) })}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label style={modalStyles.label}>STOCK (UNIDADES)</label>
                                        <input
                                            type="number"
                                            style={modalStyles.input}
                                            min="0"
                                            value={editingProduct.stock || ''}
                                            onChange={e => setEditingProduct({ ...editingProduct, stock: Math.floor(Number(e.target.value)) })}
                                        />
                                    </>
                                )}
                            </div>

                            <div style={modalStyles.checkboxRow}>
                                <label style={modalStyles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        style={modalStyles.checkbox}
                                        checked={editingProduct.saleWeight || false}
                                        onChange={e => setEditingProduct({
                                            ...editingProduct,
                                            saleWeight: e.target.checked,
                                            stock: e.target.checked ? 0 : editingProduct.stock,
                                            weight: e.target.checked ? editingProduct.weight : 0
                                        })}
                                    />
                                    Se vende por peso (Fraccionado)
                                </label>

                                <label style={modalStyles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        style={modalStyles.checkbox}
                                        checked={editingProduct.active ?? true}
                                        onChange={e => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                                    />
                                    Artículo activo en catálogo
                                </label>
                            </div>

                            <div style={modalStyles.actions}>
                                <button
                                    type="button"
                                    style={modalStyles.cancelButton}
                                    onClick={() => { setIsModalOpen(false); setEditingProduct(null) }}
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
            )}
        </div>
    );
};

// --- Estilos Centralizados de la Modal ---
const modalStyles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 17, 21, 0.85)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 200, backdropFilter: 'blur(4px)',
    },
    content: {
        backgroundColor: '#161920',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '540px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        textAlign: 'left'
    },
    title: { margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 600, color: 'white', letterSpacing: '-0.3px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    row: {
        display: 'flex',
        gap: '16px',
        width: '100%', // Asegura que la fila use todo el ancho de la modal
        boxSizing: 'border-box'
    },
    label: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px' },
    input: {
        backgroundColor: '#1A1D23',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '12px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none',

        // --- AQUÍ ESTÁ EL FIX PARA EL DESBORDAMIENTO ---
        width: '100%',
        boxSizing: 'border-box',
        minWidth: '0', // Permite que el input se encoja correctamente en flexbox
    },
    checkboxRow: {
        display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0', padding: '14px',
        backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)'
    },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' },
    checkbox: { width: '16px', height: '16px', accentColor: '#54C4F0', cursor: 'pointer' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' },
    cancelButton: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', padding: '12px 20px' },
    submitButton: { backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }
};