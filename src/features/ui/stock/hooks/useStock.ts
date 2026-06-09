import { useState, useEffect, useMemo } from 'react';
import { getProducts, deleteProduct, addProduct, updateProduct } from '../../../data/repositories/ProductRepository';
import { type Product } from '../../../domain/types/productTypes';

export function useStock() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    // --- Guardar Cambios ---
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        if (!editingProduct?.id || !editingProduct?.article || !editingProduct?.price) {
            alert("Por favor, completa los campos obligatorios (Código, Artículo y Precio).");
            setIsLoading(false); // Importante para no trabar la app si falla la validación
            return;
        }

        try {
            if (isEditingMode) {
                await updateProduct(editingProduct.id, editingProduct as Product);
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
                };
                await addProduct(newProduct);
            }
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
        filteredProducts,
        
        // Modificadores de estado directos (para los subcomponentes)
        setSearchTerm,
        setIsEditingMode,
        setEditingProduct,
        setIsModalOpen,

        // Acciones y Handlers
        handleDelete,
        handleSave,
        handleCostChange,
        handleGainsChange,
        handlePriceChange,
        openCreateModal,
        closeModal
    };
}