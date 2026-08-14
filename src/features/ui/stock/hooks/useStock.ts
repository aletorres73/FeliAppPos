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
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]); // 🆕 Estado de selección
    const [productFilter, setProductFilter] = useState<'all' | 'combos' | 'promotions' | 'grouped' | 'expiration' | 'slowMovers'>('all');

    useEffect(() => {
        loadProducts();
    }, []);

    const toggleSelectProduct = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // 🆕 Acción masiva
    const handleBulkGroupAssignment = async (parentId: string) => {
        if (selectedProductIds.length === 0) return;
        setIsLoading(true);
        try {
            await bulkActionRepository.assignProductsToGroup(parentId, selectedProductIds);
            setSelectedProductIds([]); // Limpiamos los checkboxes
            await loadProducts();      // Recargamos el inventario
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
            await loadProducts(); // Recarga la lista actualizada desde Firebase
        } catch (error) {
            console.error("Error al destruir el grupo:", error);
            setIsLoading(false);
        }
    };

    const groupedProducts = useMemo(() => {
    // 1. Separamos Padres e Hijos
    const parents = products.filter(p => p.isParent || !p.parentId);
    const children = products.filter(p => p.parentId);
    const term = searchTerm.toLowerCase();

    // 2. Mapeamos y pre-filtramos a los hijos según el filtro activo
    let filteredGroups = parents.map(parent => {
        let variations = children.filter(child => child.parentId === parent.id);

        if (productFilter === 'expiration') {
            // Dejamos solo los hijos que tienen stock y están por vencer
            variations = variations.filter(v => (v.stock > 0 || v.weight > 0) && v.expirationDate != null);
        } else if (productFilter === 'slowMovers') {
            // Dejamos solo los hijos que tienen baja rotación
            variations = variations.filter(v => {
                const hasStock = v.saleWeight ? (v.weight || 0) > 0 : (v.stock || 0) > 0;
                const lastActivity = v.lastSoldAt ? v.lastSoldAt : v.createdAt;
                return hasStock && ((Date.now() - lastActivity) > getSlowMovers());
            });
        }

        return { ...parent, variations };
    }).filter(group => {
        // 3. Evaluamos la búsqueda de texto (Aplica si coincide el padre o algún hijo sobreviviente)
        const parentSearchMatch = group.article.toLowerCase().includes(term) || group.branch.toLowerCase().includes(term);
        const childSearchMatch = group.variations.some(v => v.article.toLowerCase().includes(term));
        const searchMatch = parentSearchMatch || childSearchMatch;

        if (!searchMatch) return false; // Si no coincide la búsqueda, lo descartamos de inmediato

        // 4. Lógica por filtro para decidir si el bloque se renderiza
        if (productFilter === 'all') return true;
        if (productFilter === 'combos') return group.isCombo;
        if (productFilter === 'promotions') return group.volumePrices?.length !== 0;
        if (productFilter === 'grouped') return group.parentId != null || group.isParent;

        if (productFilter === 'expiration') {
            const parentHasStock = (group.stock > 0 || group.weight > 0);
            const parentMatchesExp = parentHasStock && group.expirationDate != null;
            
            // Se muestra si el padre vence O si al menos un hijo vence
            return parentMatchesExp || group.variations.length > 0;
        }

        if (productFilter === 'slowMovers') {
            const parentHasStock = group.saleWeight ? (group.weight || 0) > 0 : (group.stock || 0) > 0;
            const parentLastActivity = group.lastSoldAt ? group.lastSoldAt : group.createdAt;
            const parentIsStagnant = (Date.now() - parentLastActivity) > getSlowMovers();
            const parentMatchesSlow = parentHasStock && parentIsStagnant;

            // Se muestra si el padre tiene baja rotación O si al menos un hijo la tiene
            return parentMatchesSlow || group.variations.length > 0;
        }

        return false;
    });

    // 5. Ordenamiento corregido (Busca la fecha más cercana entre el padre y todos sus hijos)
    if (productFilter === 'expiration') {
        filteredGroups.sort((a, b) => {
            const getMinDate = (item: Product & { variations: Product[] }) => {
                const dates = [item.expirationDate, ...item.variations.map(v => v.expirationDate)]
                    .filter(d => d != null) as number[];
                return dates.length > 0 ? Math.min(...dates) : Infinity;
            };

            return getMinDate(a) - getMinDate(b); // Ascendente: Fechas más cercanas primero
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

    // --- Lógica de Cálculos Bidireccionales ---
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

    // --- Abrir Modal para Nuevo Producto ---
    const openCreateModal = () => {
        setIsEditingMode(false);
        setEditingProduct({
            id: '', active: true, saleWeight: false, stock: 0,
            weight: 0, cost: 0, gains: 0, price: 0
        });
        setIsModalOpen(true);
    };

    // --- Cerrar Modal ---
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    // ---useStock.ts (Formato optimizado para handleSave) ---
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
                // SI ES UN PADRE: Usamos la actualización en lote (Batch)
                if (editingProduct.isParent) {
                    await bulkActionRepository.updateParentAndChildren(editingProduct.id, editingProduct);
                } else {
                    // SI ES UN HIJO O INDEPENDIENTE: Actualización normal
                    await updateProduct(editingProduct.id, editingProduct);
                }
            } else {
                // ... (Tu lógica actual de crear nuevo producto se mantiene igual)
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
                    // isCombo: editingProduct.isCombo || false,
                    // comboComponenets: editingProduct.comboComponenets || []

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

    // 🆕 Cálculo de la inversión total en tiempo real de lo que está en pantalla
    const totalInvestment = useMemo(() => {
        return groupedProducts.reduce((total, parent) => {
            // 1. Sumar la inversión del producto principal (Padre o Independiente)
            const parentCost = parent.cost || 0;
            const parentInvestment = parent.saleWeight
                ? parentCost * 10 * (parent.weight || 0)
                : parentCost * (parent.stock || 0);

            // 2. Sumar la inversión de cada una de sus variaciones (hijos) si existen
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
        // Estados
        products,
        isLoading,
        searchTerm,
        isModalOpen,
        isEditingMode,
        editingProduct,
        groupedProducts,
        selectedProductIds,
        totalInvestment,
        productFilter,

        // Modificadores de estado directos (para los subcomponentes)
        setSearchTerm,
        setIsEditingMode,
        setEditingProduct,
        setIsModalOpen,
        setSelectedProductIds,

        // Acciones y Handlers
        handleDelete,
        handleSave,
        handleCostChange,
        handleGainsChange,
        handlePriceChange,
        handleDestroyGroup,
        openCreateModal,
        closeModal,
        toggleSelectProduct,
        handleBulkGroupAssignment, // 🆕 Nueva acción enviada a la vista,
        setProductFilter
    };
}