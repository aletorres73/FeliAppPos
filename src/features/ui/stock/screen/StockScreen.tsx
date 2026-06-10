import { useStock } from '../hooks/useStock'; // Ajusta la ruta según tu estructura
import {
    stockContainer, headerStyle, mainTitleStyle,
    primaryButtonStyle, subtitleStyle, fullScreenCenter,
} from '../styles/StockScreenStyles';
import { StockModal } from '../components/StockModal';
import { SearchContainer } from '../components/SearchContainer';
import { ProductList } from '../components/ProductList';
import { formatCurrency } from '../../../domain/utils/formats';

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
        totalInvestment,
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


            <div style={
                {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>

                <SearchContainer searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                {/* ─── 🆕 TARJETA DE INVERSIÓN TOTAL EN PANTALLA ─── */}
                <div style={investmentCardStyle}>
                    <span style={investmentLabelStyle}>
                        Inversión estimada
                    </span>
                    <span style={investmentValueStyle}>
                        {formatCurrency(totalInvestment)}
                    </span>
                </div>

            </div>

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

const investmentCardStyle: React.CSSProperties = {
    backgroundColor: '#1C2028',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '1em',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    marginBottom: '20px'
};

const investmentLabelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '2px'
};

const investmentValueStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    color: '#47D6A7', // Color verde para denotar dinero/activo
    fontWeight: '700',
    fontFamily: 'monospace' // Para que los números no bailen al cambiar el filtro
};