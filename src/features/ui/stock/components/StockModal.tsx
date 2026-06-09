import { modalStyles } from '../styles/ModalStockStyles';
import { type Product } from '../../../domain/types/productTypes';

interface StockModalProps {
    isEditingMode: boolean;
    product: Partial<Product>; // Debería ser un tipo específico de producto
    setEditingProduct: (product: Partial<Product> | null) => void;
    handleSave: (e: React.SubmitEvent<HTMLFormElement>) => void;
    handleCostChange: (cost: number) => void;
    handleGainsChange: (gains: number) => void;
    handlePriceChange: (price: number) => void;
    setIsModalOpen: (open: boolean) => void;
    onClose?: () => void;
}

export function StockModal(
    {
        isEditingMode,
        product,
        setEditingProduct,
        handleSave,
        handleCostChange,
        handleGainsChange,
        handlePriceChange,
        onClose

    }: StockModalProps
) {

    return (<div style={modalStyles.overlay}>
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
                        value={product.id || ''}
                        onChange={e => setEditingProduct({ ...product, id: e.target.value.toUpperCase() })} // Convertir a mayúsculas para consistencia en códigos
                    />
                </div>

                <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>NOMBRE DEL ARTÍCULO *</label>
                    <input
                        type="text"
                        style={modalStyles.input}
                        required
                        value={product.article || ''}
                        onChange={e => setEditingProduct({ ...product, article: e.target.value })}
                    />
                </div>

                <div style={modalStyles.formGroup}>
                    <label style={modalStyles.label}>MARCA / PROVEEDOR</label>
                    <input
                        type="text"
                        style={modalStyles.input}
                        value={product.branch || ''}
                        onChange={e => setEditingProduct({ ...product, branch: e.target.value })}
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
                            value={product.cost || ''}
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
                            value={product.gains || ''}
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
                            value={product.price || ''}
                            onChange={e => handlePriceChange(Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* Fila de Control de Stock / Peso */}
                <div style={modalStyles.formGroup}>
                    {product.saleWeight ? (
                        <>
                            <label style={modalStyles.label}>PESO DISPONIBLE (KG)</label>
                            <input
                                type="number"
                                style={modalStyles.input}
                                min="0"
                                step="0.001"
                                value={product.weight || ''}
                                onChange={e => setEditingProduct({ ...product, weight: Number(e.target.value) })}
                            />
                        </>
                    ) : (
                        <>
                            <label style={modalStyles.label}>STOCK (UNIDADES)</label>
                            <input
                                type="number"
                                style={modalStyles.input}
                                min="0"
                                value={product.stock || ''}
                                onChange={e => setEditingProduct({ ...product, stock: Math.floor(Number(e.target.value)) })}
                            />
                        </>
                    )}
                </div>

                <div style={modalStyles.checkboxRow}>
                    <label style={modalStyles.checkboxLabel}>
                        <input
                            type="checkbox"
                            style={modalStyles.checkbox}
                            checked={product.saleWeight || false}
                            onChange={e => setEditingProduct({
                                ...product,
                                saleWeight: e.target.checked,
                                stock: e.target.checked ? 0 : product.stock,
                                weight: e.target.checked ? product.weight : 0
                            })}
                        />
                        Se vende por peso (Fraccionado)
                    </label>

                    <label style={modalStyles.checkboxLabel}>
                        <input
                            type="checkbox"
                            style={modalStyles.checkbox}
                            checked={product.active ?? true}
                            onChange={e => setEditingProduct({ ...product, active: e.target.checked })}
                        />
                        Artículo activo en catálogo
                    </label>
                </div>

                <div style={modalStyles.actions}>
                    <button
                        type="button"
                        style={modalStyles.cancelButton}
                        onClick={onClose}
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
    );
}