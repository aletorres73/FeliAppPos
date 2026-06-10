import { useStock } from '../hooks/useStock'; // Ajusta la ruta según tu estructura
import {
    stockContainer, headerStyle, mainTitleStyle,
    primaryButtonStyle, subtitleStyle, fullScreenCenter,
} from '../styles/StockScreenStyles';
import { StockModal } from '../components/StockModal';
import { SearchContainer } from '../components/SearchContainer';
import { ProductList } from '../components/ProductList';

export default function StockScreen() {
    const {
        products,
        isLoading,
        searchTerm,
        isModalOpen,
        isEditingMode,
        editingProduct,
        groupedProducts,
        selectedProductIds,
        toggleSelectProduct,
        handleBulkGroupAssignment,
        setSearchTerm,
        setIsEditingMode,
        setEditingProduct,
        setIsModalOpen,
        handleDelete,
        handleSave,
        handleCostChange,
        handleGainsChange,
        handlePriceChange,
        handleDestroyGroup,
        openCreateModal,
        closeModal
    } = useStock();

    if (isLoading) return <div style={fullScreenCenter}><span>CARGANDO INVENTARIO...</span></div>;

    const handleGroupAssignment = (parentId: string) => {
        const parent = products.find(p => p.id === parentId);
        if (parent && editingProduct) {
            setEditingProduct({
                ...editingProduct,
                parentId,
                price: parent.price,   // Herencia de precio
                cost: parent.cost,     // Herencia de costo
                branch: parent.branch, // Herencia de marca
                isParent: false        // Un hijo no puede ser padre a la vez
            });
        } else if (editingProduct) {
            setEditingProduct({ ...editingProduct, parentId: null });
        }

        console.log(`Producto ${editingProduct?.id} asignado al grupo ${parentId}`);
    };

    return (
        <div style={stockContainer}>
            <header style={headerStyle}>
                <div style={{ textAlign: 'left' }}>
                    <h2 style={mainTitleStyle}>Control de Inventario</h2>
                    <p style={subtitleStyle}>{products.length} productos en el catálogo</p>
                </div>
                <button style={primaryButtonStyle} onClick={openCreateModal}>
                    + NUEVO ARTÍCULO
                </button>
            </header>

            <SearchContainer searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            <ProductList
                filteredProducts={groupedProducts}
                setIsEditingMode={setIsEditingMode}
                setEditingProduct={setEditingProduct}
                setIsModalOpen={setIsModalOpen}
                handleDelete={handleDelete}
                handleDestroyGroup={handleDestroyGroup}
                selectedProductIds={selectedProductIds}
                toggleSelectProduct={toggleSelectProduct}
                handleBulkGroupAssignment={handleBulkGroupAssignment}
            />

            {/* --- MODAL DINÁMICA DE CREACIÓN / EDICIÓN --- */}
            {isModalOpen && editingProduct && (
                <StockModal
                    isEditingMode={isEditingMode}
                    product={editingProduct}
                    allProducts={products}
                    setEditingProduct={setEditingProduct}
                    handleSave={handleSave}
                    handleCostChange={handleCostChange}
                    handleGainsChange={handleGainsChange}
                    handlePriceChange={handlePriceChange}
                    handleGroupAssignment={handleGroupAssignment}
                    setIsModalOpen={setIsModalOpen}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}