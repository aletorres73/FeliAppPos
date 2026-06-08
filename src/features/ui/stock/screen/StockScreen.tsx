import React, { useState, useEffect, useMemo } from 'react';

import {
    getProducts, deleteProduct
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
} from '../../stock/styles/styles';

export default function StockScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        return products.filter(p =>
            p.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.branch?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este producto?")) {
            await deleteProduct(id);    
            loadProducts();
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
                    onClick={() => { setEditingProduct({}); setIsModalOpen(true); }}
                >
                    + NUEVO ARTÍCULO
                </button>
            </header>

            <div style={searchContainer}>
                <input
                    type="text"
                    placeholder="Buscar por artículo o marca..."
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
                                <span style={branchLabel}>{product.branch || 'Sin Marca'}</span>
                            </div>
                            <span style={productBadge(product.active)}>
                                {product.active ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>

                        <div style={cardBody}>
                            {/* Sección de Stock */}
                            <div style={dataGroup}>
                                <span style={labelStyle}>STOCK DISPONIBLE</span>
                                <span style={{
                                    ...valueStyle,
                                    color: product.stock <= 5 ? '#FFAB40' : '#54C4F0'
                                }}>
                                    {product.saleWeight ? `${product.weight.toFixed(3)} kg` : `${product.stock} un.`}
                                </span>
                            </div>

                            {/* Sección de Precio */}
                            <div style={dataGroup}>
                                <span style={labelStyle}>PRECIO UNITARIO</span>
                                <span style={valueStyle}>{formatCurrency(product.price)}</span>
                            </div>

                            {/* Sección de Rendimiento (Ventas) */}
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
                            <button style={editAction} onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}>EDITAR</button>
                            <button style={deleteAction} onClick={() => handleDelete(product.id)}>ELIMINAR</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};