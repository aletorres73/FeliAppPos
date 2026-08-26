import { useState, useEffect, useMemo } from 'react';
import { getProducts, deleteProduct, addProduct, updateProduct, bulkActionRepository, resolvePriceReview, type PriceReviewDecision } from '../../../data/repositories/ProductRepository';
import { type Product, getSlowMovers } from '../../../domain/types/productTypes';
import { createEmptyProduct, toNewProduct, updateProductCost, updateProductGains, updateProductPrice } from './productForm';

// Definimos la interfaz GroupedProduct aquí para que el sort tenga tipado estricto
export interface GroupedProduct extends Product {
    variations: Product[];
}

export function useStock() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productFilter, setProductFilter] = useState<'all' | 'combos' | 'promotions' | 'grouped' | 'expiration' | 'slowMovers' | 'priceReview'>('all');

    useEffect(() => {
        loadProducts();
    }, []);

    const toggleSelectProduct = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkGroupAssignment = async (parentId: string) => {
        if (selectedProductIds.length === 0) return;
        setIsLoading(true);
        try {
            await bulkActionRepository.assignProductsToGroup(parentId, selectedProductIds);
            setSelectedProductIds([]);
            await loadProducts();
        } catch (error) {
            console.error("Error en asignación masiva:", error);
            setIsLoading(false);
        }
    };

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

    const handleDestroyGroup = async (parentId: string) => {
        setIsLoading(true);
        try {
            await bulkActionRepository.destroyGroup(parentId);
            console.log("Grupo disuelto correctamente.");
            await loadProducts();
        } catch (error) {
            console.error("Error al destruir el grupo:", error);
            setIsLoading(false);
        }
    };

    // Función ayudante para calcular stock unificada
    const checkHasStock = (p: Product) => p.saleWeight ? (p.weight || 0) > 0 : (p.stock || 0) > 0;

    const groupedProducts = useMemo(() => {
        const parents = products.filter(p => p.isParent || !p.parentId);
        const children = products.filter(p => p.parentId);
        const term = searchTerm.toLowerCase();

        // Optimización: Variables de tiempo calculadas una sola vez
        const now = Date.now();
        const slowMoversThreshold = getSlowMovers();

        let filteredGroups = parents.map(parent => {
            let variations = children.filter(child => child.parentId === parent.id);

            if (productFilter === 'expiration') {
                variations = variations.filter(v => (v.stock > 0 || v.weight > 0) && v.expirationDate != null);
            } else if (productFilter === 'slowMovers') {
                variations = variations.filter(v => {
                    const lastActivity = (v.lastSoldAt && v.lastSoldAt > 0)
                        ? v.lastSoldAt
                        : (v.createdAt && v.createdAt > 0)
                            ? v.createdAt : 0;
                    const isStagnant = lastActivity === 0 || (now - lastActivity) > slowMoversThreshold;
                    return checkHasStock(v) && isStagnant;
                });
            } else if (productFilter === 'priceReview') {
                variations = variations.filter(v => v.pricingReviewPending);
            }

            return { ...parent, variations } as GroupedProduct;
        }).filter(group => {
            // Evaluamos la búsqueda de texto
            const parentSearchMatch = group.article.toLowerCase().includes(term) || group.branch.toLowerCase().includes(term);
            const childSearchMatch = group.variations.some(v => v.article.toLowerCase().includes(term));

            // Corte rápido si no hay coincidencia
            if (!parentSearchMatch && !childSearchMatch) return false;

            // Lógica por filtro
            if (productFilter === 'all') return true;
            if (productFilter === 'combos') return group.isCombo;
            if (productFilter === 'promotions') return group.volumePrices?.length !== 0;
            if (productFilter === 'grouped') return group.parentId != null || group.isParent;

            if (productFilter === 'expiration') {
                const parentHasStock = (group.stock > 0 || group.weight > 0);
                const parentMatchesExp = parentHasStock && group.expirationDate != null;
                return parentMatchesExp || group.variations.length > 0;
            }

            if (productFilter === 'slowMovers') {
                const parentLastActivity = (group.lastSoldAt && group.lastSoldAt > 0)
                    ? group.lastSoldAt
                    : (group.createdAt && group.createdAt > 0)
                        ? group.createdAt : 0;
                const parentIsStagnant = parentLastActivity === 0 || (now - parentLastActivity) > slowMoversThreshold;
                const parentMatchesSlow = checkHasStock(group as Product) && parentIsStagnant;
                return parentMatchesSlow || group.variations.length > 0;
            }

            if (productFilter === 'priceReview') {
                return Boolean(group.pricingReviewPending) || group.variations.length > 0;
            }

            return false;
        });

        // Ordenamientos dinámicos
        if (productFilter === 'expiration') {
            filteredGroups.sort((a, b) => {
                const getMinDate = (item: GroupedProduct) => {
                    const dates = [item.expirationDate, ...item.variations.map(v => v.expirationDate)]
                        .filter(d => d != null) as number[];
                    return dates.length > 0 ? Math.min(...dates) : Infinity;
                };
                return getMinDate(a) - getMinDate(b);
            });
        } else if (productFilter === 'slowMovers') {
            filteredGroups.sort((a, b) => {
                const getMostStagnantActivity = (item: GroupedProduct) => {
                    const activities: number[] = [];
                    const parentActivity = (item.lastSoldAt && item.lastSoldAt > 0)
                        ? item.lastSoldAt
                        : (item.createdAt && item.createdAt > 0)
                            ? item.createdAt : 0;

                    if (checkHasStock(item as Product) && (parentActivity === 0 || (now - parentActivity) > slowMoversThreshold)) {
                        activities.push(parentActivity);
                    }

                    item.variations.forEach(v => {
                        const vActivity = (v.lastSoldAt && v.lastSoldAt > 0)
                            ? v.lastSoldAt
                            : (v.createdAt && v.createdAt > 0)
                                ? v.createdAt : 0;
                        activities.push(vActivity);
                    });

                    return activities.length > 0 ? Math.min(...activities) : Infinity;
                };
                // De menor a mayor timestamp (el más antiguo primero)
                return getMostStagnantActivity(a) - getMostStagnantActivity(b);
            });
        }

        return filteredGroups;

    }, [products, searchTerm, productFilter]);

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este producto?")) {
            await deleteProduct(id);
            loadProducts();
        }
    };

    const handleCostChange = (costVal: number) => {
        setEditingProduct(prev => prev ? updateProductCost(prev, costVal) : null);
    };

    const handleGainsChange = (gainsVal: number) => {
        setEditingProduct(prev => prev ? updateProductGains(prev, gainsVal) : null);
    };

    const handlePriceChange = (priceVal: number) => {
        setEditingProduct(prev => prev ? updateProductPrice(prev, priceVal) : null);
    };

    const resolveProductPriceReview = async (productId: string, decision: PriceReviewDecision, customPrice?: number) => {
        setIsLoading(true);
        try {
            await resolvePriceReview(productId, decision, customPrice);
            await loadProducts();
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setIsEditingMode(false);
        setEditingProduct(createEmptyProduct());
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        if (!editingProduct?.id || !editingProduct?.article || !editingProduct?.price) {
            alert("Por favor, completa los campos obligatorios.");
            setIsLoading(false);
            return;
        }

        try {
            if (isEditingMode) {
                // Al guardar desde el modal se considera revisado el cambio de costo
                const reviewedProduct = { ...editingProduct, pricingReviewPending: false };
                if (editingProduct.isParent) {
                    await bulkActionRepository.updateParentAndChildren(editingProduct.id, reviewedProduct);
                } else {
                    await updateProduct(editingProduct.id, reviewedProduct);
                }
            } else {
                await addProduct(toNewProduct(editingProduct));
            }

            console.log(`Producto procesado con éxito`);
            closeModal();
            loadProducts();
        } catch (error) {
            console.error("Error al guardar el producto:", error);
            setIsLoading(false);
        }
    };

    const totalInvestment = useMemo(() => {
        return groupedProducts.reduce((total, parent) => {
            const parentCost = parent.cost || 0;
            const parentInvestment = parent.saleWeight
                ? parentCost * 10 * (parent.weight || 0)
                : parentCost * (parent.stock || 0);

            const childrenInvestment = (parent.variations || []).reduce((subTotal, child) => {
                const childCost = child.cost || 0;
                const childValue = child.saleWeight
                    ? childCost * (child.weight || 0)
                    : childCost * (child.stock || 0);
                return subTotal + childValue;
            }, 0);

            return total + parentInvestment + childrenInvestment;
        }, 0);
    }, [groupedProducts]);

    return {
        products, isLoading, searchTerm, isModalOpen, isEditingMode,
        editingProduct, groupedProducts, selectedProductIds, totalInvestment, productFilter,
        setSearchTerm, setIsEditingMode, setEditingProduct, setIsModalOpen, setSelectedProductIds,
        handleDelete, handleSave, handleCostChange, handleGainsChange, handlePriceChange,
        handleDestroyGroup, openCreateModal, closeModal, toggleSelectProduct, resolveProductPriceReview,
        handleBulkGroupAssignment, setProductFilter
    };
}