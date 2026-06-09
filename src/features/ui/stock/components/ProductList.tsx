import { type Product } from "../../../domain/types/productTypes";
import { formatCurrency } from "../../../domain/utils/formats";
import { 
    gridStyle,
    productCard,
    cardHeader,
    articleName,
    branchLabel,
    productBadge,
    cardBody,
    dataGroup,
    labelStyle,
    valueStyle,
    soldValueStyle,
    cardFooter,
    editAction,
    deleteAction
} from '../styles/StockScreenStyles';


interface ProductListProps {
    filteredProducts: Product[];
    setIsEditingMode: (isEditing: boolean) => void;
    setEditingProduct: (product: Partial<Product> | null) => void;
    setIsModalOpen: (isOpen: boolean) => void;
    handleDelete: (id: string) => void;
}


export function ProductList({ filteredProducts, setIsEditingMode, setEditingProduct, setIsModalOpen, handleDelete }: ProductListProps) {
    return (
        <div style={gridStyle}>
            {filteredProducts.map(product => (
                <div key={product.id} style={productCard}>
                    <div style={cardHeader}>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <span style={articleName}>{product.article}</span>
                            <span style={branchLabel}>
                                {product.branch || 'Sin Marca'} <span style={{ color: 'rgba(255,255,255,0.2)' }}>| ID: {product.id}</span>
                            </span>
                        </div>
                        <span style={productBadge(product.active)}>
                            {product.active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                    </div>

                    <div style={cardBody}>
                        <div style={dataGroup}>
                            <span style={labelStyle}>STOCK DISPONIBLE</span>
                            <span style={{
                                ...valueStyle,
                                color: (product.stock <= 5 && !product.saleWeight) ? '#FFAB40' : '#54C4F0'
                            }}>
                                {product.saleWeight ? `${product.weight.toFixed(3)} kg` : `${product.stock} un.`}
                            </span>
                        </div>

                        <div style={dataGroup}>
                            <span style={labelStyle}>PRECIO UNITARIO</span>
                            <span style={valueStyle}>{formatCurrency(product.price)}</span>
                        </div>

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
                        <button style={editAction} onClick={() => { setIsEditingMode(true); setEditingProduct(product); setIsModalOpen(true); }}>EDITAR</button>
                        <button style={deleteAction} onClick={() => handleDelete(product.id)}>ELIMINAR</button>
                    </div>
                </div>
            ))}
        </div>
    )
};