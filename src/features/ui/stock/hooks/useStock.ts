import { useState, useEffect, useMemo } from 'react';
import { getProducts, deleteProduct, addProduct, updateProduct, bulkActionRepository } from '../../../data/repositories/ProductRepository';
import { type Product } from '../../../domain/types/productTypes';

export function useStock() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]); // 🆕 Estado de selección

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
        // 1. Separamos los productos que son "Padres" o "Independientes"
        const parents = products.filter(p => p.isParent || !p.parentId);

        // 2. Filtramos los productos que son variaciones (hijos)
        const children = products.filter(p => p.parentId);

        // 3. Mapeamos cada padre para que contenga su lista de variaciones
        return parents.map(parent => ({
            ...parent,
            variations: children.filter(child => child.parentId === parent.id)
        })).filter(group => {
            // Lógica de búsqueda optimizada que revisa marca y artículo
            const term = searchTerm.toLowerCase();
            return (
                group.article.toLowerCase().includes(term) ||
                group.branch.toLowerCase().includes(term) ||
                group.variations.some(v => v.article.toLowerCase().includes(term))
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
                    conversionFactor: editingProduct.conversionFactor || null

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

    return {
        // Estados
        products,
        isLoading,
        searchTerm,
        isModalOpen,
        isEditingMode,
        editingProduct,
        // filteredProducts,
        groupedProducts,
        selectedProductIds,

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
        handleBulkGroupAssignment, // 🆕 Nueva acción enviada a la vista
    };
}