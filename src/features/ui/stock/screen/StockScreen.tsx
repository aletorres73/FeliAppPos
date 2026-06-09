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
        filteredProducts,
        setSearchTerm,
        setIsEditingMode,
        setEditingProduct,
        setIsModalOpen,
        handleDelete,
        handleSave,
        handleCostChange,
        handleGainsChange,
        handlePriceChange,
        openCreateModal,
        closeModal
    } = useStock();

    if (isLoading) return <div style={fullScreenCenter}>CARGANDO INVENTARIO...</div>;

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
                filteredProducts={filteredProducts}
                setIsEditingMode={setIsEditingMode}
                setEditingProduct={setEditingProduct}
                setIsModalOpen={setIsModalOpen}
                handleDelete={handleDelete}
            />

            {/* --- MODAL DINÁMICA DE CREACIÓN / EDICIÓN --- */}
            {isModalOpen && editingProduct && (
                <StockModal
                    product={editingProduct}
                    setEditingProduct={setEditingProduct}
                    isEditingMode={isEditingMode}
                    setIsModalOpen={setIsModalOpen}
                    onClose={closeModal}
                    handleSave={handleSave}
                    handleCostChange={handleCostChange}
                    handleGainsChange={handleGainsChange}
                    handlePriceChange={handlePriceChange}
                />
            )}
        </div>
    );
}