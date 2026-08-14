import { useState, useEffect, useMemo } from 'react';
import { getProducts, deleteProduct, addProduct, updateProduct, bulkActionRepository } from '../../../data/repositories/ProductRepository';
import { type Product, getSlowMovers } from '../../../domain/types/productTypes';

export function useStock() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productFilter, setProductFilter] = useState<'all' | 'combos' | 'promotions' | 'grouped' | 'expiration' | 'slowMovers'>('all');

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

    // ⚡ OPTIMIZACIÓN: Función ayudante fuera de la carga de renderizado
    const checkHasStock = (p: Product) => p.saleWeight ? (p.weight || 0) > 0 : (p.stock || 0) > 0;

    const groupedProducts = useMemo(() => {
        const parents = products.filter(p => p.isParent || !p.parentId);
        const children = products.filter(p => p.parentId);
        const term = searchTerm.toLowerCase();
        
        // ⚡ OPTIMIZACIÓN: Calculamos esto UNA VEZ, no 1000 veces en el bucle
        const now = Date.now();
        const slowMoversThreshold = getSlowMovers();

        let filteredGroups = parents.map(parent => {
            let variations = children.filter(child => child.parentId === parent.id);

            if (productFilter === 'expiration') {
                variations = variations.filter(v => (v.stock > 0 || v.weight > 0) && v.expirationDate != null);
            } else if (productFilter === 'slowMovers') {
                variations = variations.filter(v => {
                    const lastActivity = v.lastSoldAt ? v.lastSoldAt : v.createdAt;
                    return checkHasStock(v) && ((now - lastActivity) > slowMoversThreshold);
                });
            }

            return { ...parent, variations };
        }).filter(group => {
            // 3. Evaluamos la búsqueda de texto
            const parentSearchMatch = group.article.toLowerCase().includes(term) || group.branch.toLowerCase().includes(term);
            const childSearchMatch = group.variations.some(v => v.article.toLowerCase().includes(term));
            
            // ⚡ OPTIMIZACIÓN: Si no hay match con la búsqueda, salimos de inmediato
            if (!parentSearchMatch && !childSearchMatch) return false; 

            // 4. Lógica por filtro
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
                const parentLastActivity = group.lastSoldAt ? group.lastSoldAt : group.createdAt;
                const parentIsStagnant = (now - parentLastActivity) > slowMoversThreshold;
                const parentMatchesSlow = checkHasStock(group as Product) && parentIsStagnant;
                return parentMatchesSlow || group.variations.length > 0;
            }

            return false;
        });

        // 5. Ordenamientos dinámicos (🚨 CORREGIDO: Ahora están FUERA del .filter())
        if (productFilter === 'expiration') {
            filteredGroups.sort((a, b) => {
                const getMinDate = (item: Product & { variations: Product[] }) => {
                    const dates = [item.expirationDate, ...item.variations.map(v => v.expirationDate)]
                        .filter(d => d != null) as number[];
                    return dates.length > 0 ? Math.min(...dates) : Infinity;
                };
                return getMinDate(a) - getMinDate(b);
            });
        } else if (productFilter === 'slowMovers') {
            filteredGroups.sort((a, b) => {
                const getMostStagnantActivity = (item: Product & { variations: Product[] }) => {
                    const activities: number[] = [];
                    const parentActivity = item.lastSoldAt ? item.lastSoldAt : item.createdAt;
                    
                    if (checkHasStock(item as Product) && (now - parentActivity) > slowMoversThreshold) {
                        activities.push(parentActivity);
                    }

                    item.variations.forEach(v => {
                        activities.push(v.lastSoldAt ? v.lastSoldAt : v.createdAt);
                    });

                    return activities.length > 0 ? Math.min(...activities) : Infinity;
                };
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
        const gains = editingProduct?.gains || 0;
        const calculatedPrice = costVal * (1 + gains / 100);

        setEditingProduct(prev => prev ? {
            ...prev,
            cost: costVal,
            price: Number(calculatedPrice.toFixed(2))
        } : null);
    };

    const handleGainsChange = (gainsVal: number) => {
        const cost = editingProduct?.cost || 0;
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

        if (cost > 0) {
            calculatedGains = ((priceVal - cost) / cost) * 100;
        }

        setEditingProduct(prev => prev ? {
            ...prev,
            price: priceVal,
            gains: Number(calculatedGains.toFixed(2))
        } : null);
    };

    const openCreateModal = () => {
        setIsEditingMode(false);
        setEditingProduct({
            id: '', active: true, saleWeight: false, stock: 0,
            weight: 0, cost: 0, gains: 0, price: 0
        });
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
                if (editingProduct.isParent) {
                    await bulkActionRepository.updateParentAndChildren(editingProduct.id, editingProduct);
                } else {
                    await updateProduct(editingProduct.id, editingProduct);
                }
            } else {
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
                    createdAt: new Date().getTime(),
                    updatedAt: null,
                    isParent: editingProduct.isParent || false,
                    parentId: editingProduct.parentId || null,
                    stockLinked: editingProduct.stockLinked || false,
                    conversionFactor: editingProduct.conversionFactor || null,
                    volumePrices: editingProduct.volumePrices || [],
                    expirationDate: editingProduct.expirationDate || null,
                };
                await addProduct(newProduct);
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
        handleDestroyGroup, openCreateModal, closeModal, toggleSelectProduct,
        handleBulkGroupAssignment, setProductFilter
    };
}