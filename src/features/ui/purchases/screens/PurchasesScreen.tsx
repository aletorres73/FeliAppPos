import { useEffect, useMemo, useState } from 'react';
import { addProduct as persistProduct, getProducts } from '../../../data/repositories/ProductRepository';
import { purchaseRepository } from '../../../data/repositories/PurchaseRepository';
import { supplierRepository } from '../../../data/repositories/SupplierRepository';
import type { Product } from '../../../domain/types/productTypes';
import type { DiscountType, Purchase, PurchaseDraftItem } from '../../../domain/types/purchaseTypes';
import type { PaymentMethod } from '../../../domain/types/orderTypes';
import type { Supplier } from '../../../domain/types/supplierTypes';
import { ScannerInput } from '../../orders/components/ScannerImput';
import { PurchaseDetailModal } from '../components/PurchaseDetailModal';
import { PurchaseQuoteModal } from '../components/PurchaseQuoteModal';
import { formatCurrency } from '../../../domain/utils/formats';
import { StockModal } from '../../stock/components/StockModal';
import { createEmptyProduct, toNewProduct, updateProductCost, updateProductGains, updateProductPrice } from '../../stock/hooks/productForm';
import { useKeyboardShortcuts } from '../../../domain/utils/keyboardShorcuts';

const inputStyle: React.CSSProperties = { background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)', borderRadius: 6, padding: '10px 12px', boxSizing: 'border-box' };
const panelStyle: React.CSSProperties = { background: '#1A1D23', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 20 };
const sectionLabelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, opacity: .65, fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 };
const cardHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.08)' };
const primaryButtonStyle: React.CSSProperties = { ...inputStyle, background: '#54C4F0', color: '#0F1115', fontWeight: 700, cursor: 'pointer', border: 'none' };
const secondaryButtonStyle: React.CSSProperties = { ...inputStyle, background: 'rgba(84,196,240,.12)', color: '#54C4F0', border: '1px solid rgba(84,196,240,.4)', cursor: 'pointer', fontWeight: 600 };
const ghostButtonStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', background: 'transparent' };
const dangerButtonStyle: React.CSSProperties = { ...inputStyle, color: '#FF7E7E', cursor: 'pointer', background: 'transparent' };
const monoStyle: React.CSSProperties = { fontFamily: 'monospace' };
const discountToggleStyle = (active: boolean): React.CSSProperties => ({ ...inputStyle, padding: '6px 10px', cursor: 'pointer', background: active ? 'rgba(84,196,240,.18)' : 'transparent', color: active ? '#54C4F0' : 'white', borderColor: active ? 'rgba(84,196,240,.5)' : 'rgba(255,255,255,.14)' });

const applyDiscount = (rawValue: number, discountType: DiscountType, discountValue: number) => {
    const value = Math.max(0, Number(discountValue) || 0);
    const discounted = discountType === 'PERCENT' ? rawValue * (1 - Math.min(value, 100) / 100) : rawValue - value;
    return Number(Math.max(0, discounted).toFixed(2));
};

export default function PurchasesScreen() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [items, setItems] = useState<PurchaseDraftItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDraftMode, setIsDraftMode] = useState(false); // Switch: Pedido Borrador vs Ingreso Inmediato
    const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null); // ID del pedido que se está editando en pantalla
    const [payment, setPayment] = useState('0');
    const [paymentType, setPaymentType] = useState<PaymentMethod['type']>('CASH');
    const [totalDiscountType, setTotalDiscountType] = useState<DiscountType>('AMOUNT');
    const [totalDiscountValue, setTotalDiscountValue] = useState('0');
    const [showReview, setShowReview] = useState(false);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [supplierContact, setSupplierContact] = useState('');
    const [history, setHistory] = useState<Purchase[]>([]);
    const [message, setMessage] = useState('');
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [quotePreviewPurchase, setQuotePreviewPurchase] = useState<Purchase | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isSavingSupplier, setIsSavingSupplier] = useState(false);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);
    const [isUpdatingDraft, setIsUpdatingDraft] = useState(false);

    // Keyboard shortcuts for review modal
    useKeyboardShortcuts({
        Enter: () => { if (showReview && !isConfirmingPurchase) void handleMainAction(); },
        Escape: () => { if (showReview) setShowReview(false); },
    });

    const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId);
    const suggestions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return [];
        return products.filter((product) =>
            product.article.toLowerCase().includes(term) ||
            product.branch?.toLowerCase().includes(term) ||
            product.id.toLowerCase().includes(term)).slice(0, 8);
    }, [products, searchTerm]);
    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalDiscountAmount = totalDiscountType === 'PERCENT' ? itemsSubtotal * Math.min(Math.max(Number(totalDiscountValue) || 0, 0), 100) / 100 : Math.max(Number(totalDiscountValue) || 0, 0);
    const total = Math.max(0, Number((itemsSubtotal - totalDiscountAmount).toFixed(2)));
    const paid = isDraftMode ? 0 : Math.min(Math.max(Number(payment) || 0, 0), total);
    const debt = isDraftMode ? total : (total - paid);
    const changedCosts = items.filter((item) => item.productCost !== item.unitCost);

    const loadData = async () => {
        const [supplierData, productData] = await Promise.all([supplierRepository.getAll(), getProducts()]);
        setSuppliers(supplierData);
        setProducts(productData);
        if (!selectedSupplierId && supplierData[0]) setSelectedSupplierId(supplierData[0].id);
    };

    useEffect(() => { setIsInitialLoading(true); void loadData().finally(() => setIsInitialLoading(false)); }, []);
    useEffect(() => {
        if (!selectedSupplierId) { setHistory([]); return; }
        setIsHistoryLoading(true);
        void purchaseRepository.getBySupplier(selectedSupplierId).then(setHistory).finally(() => setIsHistoryLoading(false));
    }, [selectedSupplierId]);

    const addProduct = (productId: string) => {
        const product = products.find((candidate) => candidate.id === productId);
        if (!product) return;
        setItems((current) => {
            const existing = current.find((item) => item.productId === product.id);
            const branch = product.branch;

            if (existing) {
                return current.map((item) => {
                    if (item.productId !== product.id) return item;
                    const quantity = item.quantity + 1;
                    const rawSubtotal = Number((quantity * item.rawUnitCost).toFixed(2));
                    return {
                        ...item,
                        branch,
                        quantity,
                        rawSubtotal,
                        subtotal: Number((quantity * item.unitCost).toFixed(2))
                    };
                });
            }
            const rawUnitCost = product.cost || 0;
            const rawSubtotal = product.saleWeight ? rawUnitCost * 10 : rawUnitCost;
            return [...current, { productId: product.id, article: product.article, branch: branch, quantity: 1, saleWeight: product.saleWeight, bulks: 0, unitsPerBulk: product.unitsPerBulk || null, previousUnitsPerBulk: product.unitsPerBulk || null, purchaseType: 'UNIT', rawUnitCost, unitCost: rawUnitCost, bulkCost: null, rawSubtotal, discountType: 'AMOUNT', discountValue: 0, subtotal: rawSubtotal, productCost: product.cost || 0 }];
        });
        setSearchTerm('');
    };

    const updateItem = (productId: string, patch: Partial<PurchaseDraftItem>) => {
        setItems((current) => current.map((item) => {
            if (item.productId !== productId) return item;
            const next = { ...item, ...patch };
            const quantity = Math.max(0, Number(next.quantity) || 0);
            const rawUnitCost = Math.max(0, Number(next.rawUnitCost) || 0);
            const subtotalMultiplier = next.saleWeight ? 10 : 1;

            const rawSubtotal = next.purchaseType === 'BULK' && next.bulkCost !== null
                ? Number(((next.bulks || 0) * (next.bulkCost || 0)).toFixed(2))
                : Number((quantity * rawUnitCost * subtotalMultiplier).toFixed(2));

            const subtotal = applyDiscount(rawSubtotal, next.discountType, next.discountValue);
            const unitCost = quantity > 0 ? Number((subtotal / (quantity * subtotalMultiplier)).toFixed(4)) : rawUnitCost;

            return { ...next, quantity, rawUnitCost, unitCost, rawSubtotal, subtotal };
        }));
    };

    const updateItemDiscount = (productId: string, patch: Partial<Pick<PurchaseDraftItem, 'discountType' | 'discountValue'>>) => {
        setItems((current) => current.map((item) => {
            if (item.productId !== productId) return item;
            const next = { ...item, ...patch };
            const subtotalMultiplier = next.saleWeight ? 10 : 1;

            const rawSubtotal = next.purchaseType === 'BULK' && next.bulkCost !== null
                ? Number(((next.bulks || 0) * (next.bulkCost || 0)).toFixed(2))
                : Number((next.quantity * next.rawUnitCost * subtotalMultiplier).toFixed(2));

            const subtotal = applyDiscount(rawSubtotal, next.discountType, next.discountValue);
            const unitCost = next.quantity > 0 ? Number((subtotal / (next.quantity * subtotalMultiplier)).toFixed(4)) : next.rawUnitCost;

            return { ...next, unitCost, subtotal };
        }));
    };

    const chooseBulk = (item: PurchaseDraftItem, isBulk: boolean) => {
        const units = item.unitsPerBulk || 1;
        if (!isBulk) {
            updateItem(item.productId, { purchaseType: 'UNIT', bulks: 0, bulkCost: null, quantity: 1, rawUnitCost: item.productCost });
            return;
        }
        const bulkCost = item.bulkCost || item.productCost * units;
        updateItem(item.productId, { purchaseType: 'BULK', bulks: 1, bulkCost, quantity: units, rawUnitCost: Number((bulkCost / units).toFixed(2)) });
    };

    const saveSupplier = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!supplierName.trim() || isSavingSupplier) return;
        try {
            setIsSavingSupplier(true);
            await supplierRepository.save({ name: supplierName.trim(), contact: supplierContact.trim(), currentBalance: 0 });
            setSupplierName(''); setSupplierContact(''); setShowSupplierForm(false); await loadData();
        } finally {
            setIsSavingSupplier(false);
        }
    };

    const openProductModal = () => {
        setEditingProduct(createEmptyProduct());
        setIsProductModalOpen(true);
    };

    const closeProductModal = () => {
        setEditingProduct(null);
        setIsProductModalOpen(false);
    };

    const handleProductSave = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editingProduct?.id?.trim() || !editingProduct.article?.trim() || editingProduct.price === undefined || editingProduct.price <= 0) {
            setMessage('Completa código, nombre y un precio de venta mayor a cero.');
            return;
        }

        try {
            setIsSavingProduct(true);
            await persistProduct(toNewProduct(editingProduct));
            const updatedProducts = await getProducts();
            setProducts(updatedProducts);
            closeProductModal();
            setMessage(`Artículo ${editingProduct.article} creado y disponible para buscar.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo crear el artículo.');
        } finally {
            setIsSavingProduct(false);
        }
    };

    const handleProductGroupAssignment = (parentId: string) => {
        if (!editingProduct) return;
        const parent = products.find((product) => product.id === parentId);
        setEditingProduct(parent
            ? { ...editingProduct, parentId, price: parent.price, cost: parent.cost, branch: parent.branch, isParent: false }
            : { ...editingProduct, parentId: null });
    };

    const handlePurchasePayment = async (amount: number, paymentMethods: PaymentMethod[]) => {
        if (!selectedSupplier || !selectedPurchase) return;
        try {
            setIsProcessingPayment(true);
            await purchaseRepository.registerPayment(selectedPurchase.docId, selectedSupplier.id, amount, paymentMethods);
            const updatedHistory = await purchaseRepository.getBySupplier(selectedSupplier.id);
            setHistory(updatedHistory);
            setSelectedPurchase(null);
            setMessage(`Pago aplicado a la compra ${selectedPurchase.docId}.`);
            await loadData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo registrar el pago.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleReceiveOrder = async (updatedPurchase: Purchase, amountPaid: number, paymentMethods: PaymentMethod[]) => {
        if (!selectedSupplier) return;
        try {
            setIsProcessingPayment(true);
            await purchaseRepository.receiveOrder({
                purchase: {
                    ...updatedPurchase,
                    payed: amountPaid,
                    debt: updatedPurchase.total - amountPaid,
                    payStatus: (updatedPurchase.total - amountPaid) > 0 ? 'PENDING' : 'PAID',
                    paymentMethod: paymentMethods.length ? paymentMethods : null,
                },
                supplier: selectedSupplier,
                products,
            });
            const updatedHistory = await purchaseRepository.getBySupplier(selectedSupplier.id);
            setHistory(updatedHistory);
            setSelectedPurchase(null);
            setQuotePreviewPurchase(null);
            if (editingPurchaseId === updatedPurchase.docId) {
                setEditingPurchaseId(null);
                setItems([]);
            }
            setMessage(`Mercadería del pedido ${updatedPurchase.docId} ingresada con éxito al stock.`);
            await loadData();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo recepcionar el pedido.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleEditInScreen = (purchase: Purchase) => {
        const mappedItems: PurchaseDraftItem[] = purchase.items.map((item) => {
            const prod = products.find((p) => p.id === item.productId);
            const rawUnitCost = item.unitCost;
            const rawSubtotal = item.subtotal;
            return {
                productId: item.productId,
                article: item.article,
                branch: item.branch,
                quantity: item.quantity,
                saleWeight: item.saleWeight,
                bulks: item.bulks,
                unitsPerBulk: item.unitsPerBulk,
                previousUnitsPerBulk: prod?.unitsPerBulk || item.unitsPerBulk || null,
                purchaseType: item.purchaseType,
                unitCost: item.unitCost,
                bulkCost: item.bulkCost,
                rawUnitCost,
                rawSubtotal,
                discountType: 'AMOUNT',
                discountValue: 0,
                subtotal: item.subtotal,
                productCost: prod?.cost || item.unitCost,
            };
        });
        setItems(mappedItems);
        setSelectedSupplierId(purchase.supplierId);
        setIsDraftMode(true);
        setEditingPurchaseId(purchase.docId);
        setQuotePreviewPurchase(null);
        setSelectedPurchase(null);
        setMessage(`Pedido ${purchase.docId} cargado en pantalla. Puedes agregar, quitar o modificar cantidades y precios como si fuera nuevo.`);
    };

    const handleCancelEditing = () => {
        setItems([]);
        setEditingPurchaseId(null);
        setIsDraftMode(false);
        setPayment('0');
        setMessage('Edición de pedido cancelada.');
    };

    const handleDeleteDraft = async (docId: string) => {
        if (!selectedSupplier) return;
        try {
            setIsUpdatingDraft(true);
            await purchaseRepository.deleteDraft(docId);
            const updatedHistory = await purchaseRepository.getBySupplier(selectedSupplier.id);
            setHistory(updatedHistory);
            setQuotePreviewPurchase(null);
            setSelectedPurchase(null);
            if (editingPurchaseId === docId) {
                setEditingPurchaseId(null);
                setItems([]);
            }
            setMessage(`Pedido ${docId} eliminado.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo eliminar el pedido.');
        } finally {
            setIsUpdatingDraft(false);
        }
    };

    const handleMainAction = async () => {
        if (!selectedSupplier || !items.length || isConfirmingPurchase) return;
        const createdAt = new Date().getTime();
        const docId = editingPurchaseId || `PUR-${createdAt}`;
        const purchase: Purchase = {
            docId,
            supplierId: selectedSupplier.id,
            status: isDraftMode ? 'DRAFT' : 'RECEIVED',
            items: items.map((item) => ({
                productId: item.productId,
                branch: item.branch,
                article: item.article,
                quantity: item.quantity,
                saleWeight: item.saleWeight,
                bulks: item.bulks,
                unitsPerBulk: item.unitsPerBulk,
                purchaseType: item.purchaseType,
                unitCost: item.unitCost,
                bulkCost: item.bulkCost,
                subtotal: item.subtotal
            })),
            total,
            payed: isDraftMode ? 0 : paid,
            debt: isDraftMode ? total : debt,
            payStatus: isDraftMode ? 'PENDING' : (debt > 0 ? 'PENDING' : 'PAID'),
            paymentMethod: (!isDraftMode && paid > 0) ? [{ type: paymentType, amount: paid }] : null,
            createdAt,
        };

        try {
            setIsConfirmingPurchase(true);
            if (isDraftMode) {
                if (editingPurchaseId) {
                    await purchaseRepository.updateDraft({ purchase });
                    setMessage(`Pedido ${docId} actualizado.`);
                } else {
                    await purchaseRepository.saveDraft({ purchase });
                    setMessage(`Pedido ${docId} guardado como borrador (no sumó stock ni deuda).`);
                }
                setItems([]);
                setPayment('0');
                setEditingPurchaseId(null);
                setShowReview(false);
            } else {
                if (editingPurchaseId) {
                    await purchaseRepository.receiveOrder({ purchase, supplier: selectedSupplier, products });
                    setMessage(`Pedido ${docId} confirmado e ingresado al stock.`);
                } else {
                    await purchaseRepository.confirm({ purchase, supplier: selectedSupplier, products });
                    setMessage(`Compra ${docId} confirmada e ingresada al stock.`);
                }
                setItems([]);
                setPayment('0');
                setEditingPurchaseId(null);
                setShowReview(false);
            }
            await loadData();
            setHistory(await purchaseRepository.getBySupplier(selectedSupplier.id));
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo procesar la operación.');
        } finally {
            setIsConfirmingPurchase(false);
        }
    };

    const openCurrentDraftPreview = () => {
        if (!selectedSupplier || !items.length) return;
        const tempPurchase: Purchase = {
            docId: `PEDIDO-${Date.now()}`,
            supplierId: selectedSupplier.id,
            status: 'DRAFT',
            items: items.map((item) => ({
                productId: item.productId,
                branch: item.branch,
                article: item.article,
                quantity: item.quantity,
                saleWeight: item.saleWeight,
                bulks: item.bulks,
                unitsPerBulk: item.unitsPerBulk,
                purchaseType: item.purchaseType,
                unitCost: item.unitCost,
                bulkCost: item.bulkCost,
                subtotal: item.subtotal
            })),
            total,
            payed: 0,
            debt: total,
            payStatus: 'PENDING',
            paymentMethod: null,
            createdAt: Date.now(),
        };
        setQuotePreviewPurchase(tempPurchase);
    };

    if (isInitialLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: '#0F1115' }}><span>CARGANDO COMPRAS...</span></div>;
    }

    return (
        <div style={{ minHeight: '100vh', padding: '36px 28px', color: 'white', background: '#0F1115' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Compras y Pedidos</h1>
                    <p style={{ opacity: .55, margin: '6px 0 0', fontSize: '0.9rem' }}>Gestión de pedidos a proveedores, cotizaciones, ingreso de mercadería y saldos</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ ...ghostButtonStyle, color: '#54C4F0' }} onClick={openProductModal}>+ Artículo</button>
                    <button style={{ ...ghostButtonStyle, color: '#54C4F0' }} onClick={() => setShowSupplierForm((value) => !value)}>+ Proveedor</button>
                </div>
            </header>
            {message && <div style={{ ...panelStyle, color: '#80E0B0', marginBottom: 16, borderLeft: '3px solid #80E0B0' }}>✓ {message}</div>}

            {editingPurchaseId && (
                <div style={{
                    ...panelStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    background: 'rgba(255,171,64,.08)',
                    border: '1px solid rgba(255,171,64,.4)',
                    color: 'white',
                    padding: '14px 20px',
                }}>
                    <div>
                        <strong style={{ color: '#FFAB40', fontSize: '1rem' }}>✏️ Editando Pedido: {editingPurchaseId}</strong>
                        <p style={{ margin: '4px 0 0', opacity: .7, fontSize: '0.85rem' }}>
                            Modifica productos, bultos, cantidades o precios como si cargaras una compra nueva. Al finalizar, haz clic en guardar.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCancelEditing}
                        style={{ ...ghostButtonStyle, borderColor: 'rgba(255,171,64,.5)', color: '#FFAB40' }}
                    >
                        ✕ Cancelar Edición
                    </button>
                </div>
            )}

            {showSupplierForm &&
                <form onSubmit={saveSupplier} style={{ ...panelStyle, display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Nombre" value={supplierName} onChange={(event) => setSupplierName(event.target.value)} disabled={isSavingSupplier} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Contacto" value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} disabled={isSavingSupplier} />
                    <button style={{ ...primaryButtonStyle, opacity: isSavingSupplier ? .6 : 1, cursor: isSavingSupplier ? 'not-allowed' : 'pointer' }} disabled={isSavingSupplier}>{isSavingSupplier ? 'Guardando...' : 'Guardar'}</button>
                </form>}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.4fr) minmax(280px, .8fr)', gap: 8 }}>
                <section style={panelStyle}>
                    <div style={cardHeaderStyle}>
                        <span style={{ ...sectionLabelStyle }}>Proveedor y Carga</span>
                    </div>
                    <select
                        style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
                        value={selectedSupplierId} onChange={(event) => setSelectedSupplierId(event.target.value)}>

                        <option value="">Seleccionar proveedor</option>
                        {suppliers.map((supplier) =>
                            <option key={supplier.id} value={supplier.id}>{supplier.name} · deuda {formatCurrency(supplier.currentBalance)}</option>)}
                    </select>

                    <ScannerInput onScan={addProduct} externalValue={searchTerm} onChange={setSearchTerm} suggestions={suggestions} />

                    <div style={{ marginTop: 24 }}>
                        {[...items].reverse().map((item) =>
                            <article
                                key={item.productId}
                                style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 12, background: '#16191F' }}>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                    <div>
                                        {item.branch && <strong style={{ fontSize: '0.8rem', opacity: .6, textTransform: 'uppercase' }}>{item.branch}</strong>}
                                        <strong style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'start' }}>{item.article}</strong>
                                        <small style={{ display: 'block', opacity: .5, marginTop: 2 }}>{item.saleWeight ? `${item.quantity} kg` : `${item.quantity} unidades`} · costo anterior {formatCurrency(item.productCost)}</small>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {item.subtotal !== item.rawSubtotal && <small style={{ display: 'block', opacity: .5, textDecoration: 'line-through' }}>{formatCurrency(item.rawSubtotal)}</small>}
                                        <strong style={{ ...monoStyle, fontSize: '1rem' }}>{formatCurrency(item.subtotal)}</strong>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <button type="button" style={{ ...ghostButtonStyle, color: item.purchaseType === 'UNIT' ? '#54C4F0' : 'white', borderColor: item.purchaseType === 'UNIT' ? 'rgba(84,196,240,.5)' : 'rgba(255,255,255,.14)' }} onClick={() => chooseBulk(item, false)}>Por unidad</button>
                                    <button type="button" style={{ ...ghostButtonStyle, color: item.purchaseType === 'BULK' ? '#54C4F0' : 'white', borderColor: item.purchaseType === 'BULK' ? 'rgba(84,196,240,.5)' : 'rgba(255,255,255,.14)' }} onClick={() => chooseBulk(item, true)}>Por bulto</button>
                                </div>

                                {item.purchaseType === 'BULK' ? (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                                            <label style={{ display: 'grid', gap: 4 }}>
                                                <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Cant. por bulto</small>
                                                <input
                                                    style={{ ...inputStyle, width: '100%' }}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.unitsPerBulk ?? ''}
                                                    onChange={(event) => {
                                                        const units = Math.max(1, Number(event.target.value) || 1);
                                                        updateItem(item.productId, {
                                                            unitsPerBulk: units,
                                                            quantity: item.bulks * units,
                                                            rawUnitCost: item.bulkCost ? Number((item.bulkCost / units).toFixed(4)) : item.rawUnitCost
                                                        });
                                                    }}
                                                />
                                            </label>

                                            <label style={{ display: 'grid', gap: 4 }}>
                                                <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Precio por bulto</small>
                                                <input
                                                    style={{ ...inputStyle, width: '100%' }}
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.bulkCost ?? ''}
                                                    onChange={(event) => {
                                                        const bulkCost = Number(event.target.value);
                                                        const units = item.unitsPerBulk || 1;
                                                        updateItem(item.productId, {
                                                            bulkCost,
                                                            rawUnitCost: Number((bulkCost / units).toFixed(4))
                                                        });
                                                    }}
                                                />
                                            </label>

                                            <label style={{ display: 'grid', gap: 4 }}>
                                                <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Bultos</small>
                                                <input
                                                    style={{ ...inputStyle, width: '100%' }}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={item.bulks}
                                                    onChange={(event) => {
                                                        const bulks = Number(event.target.value);
                                                        const units = item.unitsPerBulk || 1;
                                                        updateItem(item.productId, {
                                                            bulks,
                                                            quantity: bulks * units
                                                        });
                                                    }}
                                                />
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, background: 'rgba(84,196,240,.08)', border: '1px solid rgba(84,196,240,.2)', borderRadius: 6, padding: '8px 12px' }}>
                                            <div>
                                                <small style={{ opacity: .55, display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Cantidad total</small>
                                                <strong style={{ ...monoStyle, fontSize: '0.95rem' }}>{item.quantity} {item.saleWeight ? 'kg' : 'uds'}</strong>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <small style={{ opacity: .55, display: 'block', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Precio unitario</small>
                                                <strong style={{ ...monoStyle, fontSize: '0.95rem', color: '#54C4F0' }}>{formatCurrency(item.unitCost)}</strong>
                                            </div>
                                        </div>
                                        <small style={{ display: 'block', opacity: .5, marginTop: 8 }}>
                                            {item.previousUnitsPerBulk ? `Cant. por bulto anterior: ${item.previousUnitsPerBulk} · ` : ''}costo anterior {formatCurrency(item.productCost)}
                                        </small>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
                                            <label style={{ display: 'grid', gap: 4 }}>
                                                <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>{item.saleWeight ? 'Cantidad (kg)' : 'Cantidad'}</small>
                                                <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" step={item.saleWeight ? '0.001' : '1'} value={item.quantity} onChange={(event) => updateItem(item.productId, { quantity: Number(event.target.value) })} />
                                            </label>
                                            <label style={{ display: 'grid', gap: 4 }}>
                                                <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Costo unitario</small>
                                                <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" step="0.01" value={item.rawUnitCost} onChange={(event) => updateItem(item.productId, { rawUnitCost: Number(event.target.value) })} />
                                                {item.unitCost !== item.rawUnitCost && <small style={{ opacity: .5 }}>con descuento: {formatCurrency(item.unitCost)}</small>}
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, background: 'rgba(84,196,240,.08)', border: '1px solid rgba(84,196,240,.2)', borderRadius: 6, padding: '8px 12px' }}>
                                            <small style={{ opacity: .55, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Subtotal</small>
                                            <strong style={{ ...monoStyle, fontSize: '0.95rem', color: '#54C4F0' }}>{formatCurrency(item.subtotal)}</strong>
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                                    <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Descuento</small>
                                    <button type="button" style={discountToggleStyle(item.discountType === 'PERCENT')} onClick={() => updateItemDiscount(item.productId, { discountType: 'PERCENT' })}>%</button>
                                    <button type="button" style={discountToggleStyle(item.discountType === 'AMOUNT')} onClick={() => updateItemDiscount(item.productId, { discountType: 'AMOUNT' })}>$</button>
                                    <input style={{ ...inputStyle, flex: 1, width: '100%' }} type="number" min="0" step={item.discountType === 'PERCENT' ? '1' : '0.01'} value={item.discountValue} onChange={(event) => updateItemDiscount(item.productId, { discountValue: Number(event.target.value) })} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.productId !== item.productId))} style={dangerButtonStyle}>Quitar</button>
                                </div>
                            </article>)}
                        {!items.length && <p style={{ opacity: .45, textAlign: 'center', padding: 35 }}>Escanea o busca un producto para comenzar.</p>}
                    </div>
                </section>
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <section style={{ ...panelStyle, borderColor: isDraftMode ? 'rgba(255,171,64,.4)' : 'rgba(84,196,240,.25)' }}>
                        <div style={cardHeaderStyle}>
                            <span style={sectionLabelStyle}>Resumen y Tipo</span>
                        </div>

                        {/* SWITCH: PEDIDO BORRADOR VS INGRESO DIRECTO */}
                        <div style={{ background: '#12151b', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.08)', marginBottom: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDraftMode ? '#FFAB40' : '#54C4F0' }}>
                                    {isDraftMode ? '📝 Pedido' : '📥 Ingreso'}
                                </span>
                                <div
                                    style={{
                                        position: 'relative',
                                        width: 42,
                                        height: 24,
                                        background: isDraftMode ? '#FFAB40' : 'rgba(84,196,240,0.3)',
                                        borderRadius: 12,
                                        transition: 'background 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isDraftMode}
                                        onChange={(e) => setIsDraftMode(e.target.checked)}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: 3,
                                            left: isDraftMode ? 21 : 3,
                                            width: 18,
                                            height: 18,
                                            borderRadius: '50%',
                                            background: '#FFFFFF',
                                            transition: 'left 0.2s ease',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                                        }}
                                    />
                                </div>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ opacity: .65 }}>Subtotal</span>
                            <strong style={monoStyle}>{formatCurrency(itemsSubtotal)}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                            <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Dto total</small>
                            <button type="button" style={discountToggleStyle(totalDiscountType === 'PERCENT')} onClick={() => setTotalDiscountType('PERCENT')}>%</button>
                            <button type="button" style={discountToggleStyle(totalDiscountType === 'AMOUNT')} onClick={() => setTotalDiscountType('AMOUNT')}>$</button>
                            <input style={{ ...inputStyle, flex: 1, width: '100%' }} type="number" min="0" step={totalDiscountType === 'PERCENT' ? '1' : '0.01'} value={totalDiscountValue} onChange={(event) => setTotalDiscountValue(event.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
                            <span style={{ opacity: .65 }}>Total Estimado</span>
                            <strong style={{ ...monoStyle, fontSize: 26, color: isDraftMode ? '#FFAB40' : '#54C4F0' }}>{formatCurrency(total)}</strong>
                        </div>

                        {!isDraftMode && (
                            <>
                                <label style={{ ...sectionLabelStyle, marginTop: 20 }}>Pago realizado</label>
                                <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" max={total} step="0.01" value={payment} onChange={(event) => setPayment(event.target.value)} />
                                <select style={{ ...inputStyle, width: '100%', marginTop: 8 }} value={paymentType || 'CASH'} onChange={(event) => setPaymentType(event.target.value as PaymentMethod['type'])}>
                                    <option value="CASH">Efectivo</option>
                                    <option value="TRANSFER">Transferencia</option>
                                    <option value="CARD">Tarjeta</option>
                                    <option value="QR">QR</option>
                                </select>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
                                    <span style={{ opacity: .65 }}>Saldo que irá a deuda</span>
                                    <strong style={{ ...monoStyle, color: debt > 0 ? '#FF9A9A' : '#80E0B0' }}>{formatCurrency(debt)}</strong>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={openCurrentDraftPreview}
                                    style={secondaryButtonStyle}
                                >
                                    📋 Vista Previa / Compartir con Proveedor
                                </button>
                            )}

                            <button
                                disabled={!selectedSupplier || !items.length || isConfirmingPurchase}
                                onClick={() => {
                                    if (isDraftMode) {
                                        void handleMainAction();
                                    } else {
                                        setShowReview(true);
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    ...primaryButtonStyle,
                                    background: isDraftMode ? '#FFAB40' : '#54C4F0',
                                    opacity: (!selectedSupplier || !items.length || isConfirmingPurchase) ? .4 : 1,
                                    cursor: (!selectedSupplier || !items.length || isConfirmingPurchase) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {isConfirmingPurchase
                                    ? 'Procesando...'
                                    : editingPurchaseId
                                        ? (isDraftMode ? '💾 Guardar Cambios en Pedido' : '📥 Confirmar e Ingresar a Stock')
                                        : (isDraftMode ? 'Guardar Pedido / Borrador' : 'Revisar y confirmar ingreso')}
                            </button>
                        </div>
                    </section>

                    <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
                        <div style={cardHeaderStyle}>
                            <div>
                                <span style={sectionLabelStyle}>Historial y Pedidos</span>
                                <small style={{ opacity: .5, fontSize: '0.72rem' }}>
                                    {history.length} {history.length === 1 ? 'registro' : 'registros'}
                                </small>
                            </div>
                            {isHistoryLoading && <small style={{ opacity: .5 }}>Cargando...</small>}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                            <span style={{ opacity: .65, fontSize: '0.85rem' }}>Deuda actual con proveedor</span>
                            <strong style={{ ...monoStyle, color: '#FF9A9A', fontSize: '1.1rem' }}>{formatCurrency(selectedSupplier?.currentBalance || 0)}</strong>
                        </div>

                        {/* Listado con scroll vertical dedicado y tarjetas limpias */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            maxHeight: '440px',
                            overflowY: 'auto',
                            paddingRight: 4,
                        }}>
                            {!isHistoryLoading && history.map((purchase) => {
                                const isDraft = purchase.status === 'DRAFT';
                                const isBeingEdited = editingPurchaseId === purchase.docId;
                                const itemCount = purchase.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

                                return (
                                    <div
                                        key={purchase.docId}
                                        style={{
                                            background: isBeingEdited ? 'rgba(255,171,64,.08)' : '#16191F',
                                            border: `1px solid ${isBeingEdited ? 'rgba(255,171,64,.4)' : 'rgba(255,255,255,.07)'}`,
                                            borderRadius: 8,
                                            padding: '12px 14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <strong style={{ fontSize: '0.9rem' }}>
                                                        {new Date(purchase.createdAt).toLocaleDateString('es-AR')}
                                                    </strong>
                                                    <span style={{ opacity: .4, fontSize: '0.75rem' }}>• {purchase.items.length} art. ({itemCount} {purchase.items.some(i => i.saleWeight) ? 'kg/u' : 'uds'})</span>
                                                </div>
                                                <small style={{ display: 'block', opacity: .45, ...monoStyle, fontSize: '0.75rem', marginTop: 2 }}>
                                                    {purchase.docId}
                                                </small>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <strong style={{ ...monoStyle, fontSize: '0.95rem', color: isDraft ? '#FFAB40' : 'white' }}>
                                                    {formatCurrency(purchase.total)}
                                                </strong>
                                                <div style={{ marginTop: 3 }}>
                                                    {isDraft ? (
                                                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 999, fontSize: '0.62rem', fontWeight: 700, background: 'rgba(255,171,64,.15)', color: '#FFAB40', border: '1px solid rgba(255,171,64,.3)' }}>
                                                            {isBeingEdited ? '✏️ Editando' : '📝 Pedido Borrador'}
                                                        </span>
                                                    ) : (
                                                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 999, fontSize: '0.62rem', fontWeight: 700, background: purchase.payStatus === 'PENDING' ? 'rgba(255,126,126,.15)' : 'rgba(128,224,176,.15)', color: purchase.payStatus === 'PENDING' ? '#FF7E7E' : '#80E0B0' }}>
                                                            {purchase.payStatus === 'PENDING' ? `Deuda ${formatCurrency(purchase.debt)}` : '✓ Pagada'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                                            {isDraft ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuotePreviewPurchase(purchase)}
                                                        style={{ ...ghostButtonStyle, padding: '4px 8px', fontSize: '0.72rem', color: '#54C4F0' }}
                                                    >
                                                        👁️ Ver Pedido
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditInScreen(purchase)}
                                                        style={{ ...secondaryButtonStyle, padding: '4px 8px', fontSize: '0.72rem' }}
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedPurchase(purchase)}
                                                        style={{ ...primaryButtonStyle, padding: '4px 8px', fontSize: '0.72rem' }}
                                                    >
                                                        📥 Recepcionar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setQuotePreviewPurchase(purchase)}
                                                        style={{ ...ghostButtonStyle, padding: '4px 8px', fontSize: '0.72rem', opacity: .8 }}
                                                    >
                                                        👁️ Ver Detalle
                                                    </button>
                                                    {purchase.payStatus === 'PENDING' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedPurchase(purchase)}
                                                            style={{ ...secondaryButtonStyle, padding: '4px 8px', fontSize: '0.72rem' }}
                                                        >
                                                            💳 Abonar
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {!isHistoryLoading && !history.length && (
                                <p style={{ opacity: .45, textAlign: 'center', padding: '30px 0', fontSize: '0.85rem' }}>
                                    Sin compras ni pedidos registrados para este proveedor.
                                </p>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Modal de Detalle / Recepción / Pago */}
            {selectedPurchase && (
                <PurchaseDetailModal
                    purchase={selectedPurchase}
                    onClose={() => setSelectedPurchase(null)}
                    onConfirm={handlePurchasePayment}
                    onConfirmReceive={handleReceiveOrder}
                    onEditInScreen={handleEditInScreen}
                    isProcessing={isProcessingPayment}
                />
            )}

            {/* Modal de Cotización / Compartir Pedido con Proveedor */}
            {quotePreviewPurchase && (
                <PurchaseQuoteModal
                    purchase={quotePreviewPurchase}
                    supplier={selectedSupplier}
                    onClose={() => setQuotePreviewPurchase(null)}
                    onEditInScreen={quotePreviewPurchase.status === 'DRAFT' ? handleEditInScreen : undefined}
                    onDeleteDraft={quotePreviewPurchase.status === 'DRAFT' && history.some((h) => h.docId === quotePreviewPurchase.docId) ? handleDeleteDraft : undefined}
                    onOpenReceive={quotePreviewPurchase.status === 'DRAFT' ? (p) => {
                        setQuotePreviewPurchase(null);
                        setSelectedPurchase(p);
                    } : undefined}
                    isSaving={isUpdatingDraft}
                />
            )}

            {/* Modal de Creación de Producto */}
            {isProductModalOpen && editingProduct && <StockModal
                isEditingMode={false}
                product={editingProduct}
                allProducts={products}
                setEditingProduct={setEditingProduct}
                handleSave={handleProductSave}
                handleCostChange={(cost) => setEditingProduct((current) => current ? updateProductCost(current, cost) : null)}
                handleGainsChange={(gains) => setEditingProduct((current) => current ? updateProductGains(current, gains) : null)}
                handlePriceChange={(price) => setEditingProduct((current) => current ? updateProductPrice(current, price) : null)}
                handleGroupAssignment={handleProductGroupAssignment}
                setIsModalOpen={setIsProductModalOpen}
                onClose={closeProductModal}
                isSaving={isSavingProduct}
            />}

            {showReview && reviewModal({ changedCosts, setShowReview, isConfirmingPurchase, confirmPurchase: handleMainAction })}

        </div>);
}


function reviewModal(
    { changedCosts, setShowReview, isConfirmingPurchase, confirmPurchase }:
        {
            changedCosts: Array<{ productId: string; article: string; productCost: number; unitCost: number }>;
            setShowReview: (show: boolean) => void;
            isConfirmingPurchase: boolean;
            confirmPurchase: () => Promise<void>
        }
) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
            <div style={{ ...panelStyle, maxWidth: 520, width: 'calc(100% - 40px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                <div style={cardHeaderStyle}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Revisión sugerida</h2>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: 8 }}>
                    {changedCosts.length ? (
                        <div>
                            <p style={{ opacity: .65, margin: 0 }}>El costo unitario cambió en {changedCosts.length} producto(s). El precio de venta se conserva para que lo ajustes manualmente desde Stock.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                                {changedCosts.map((item) => (
                                    <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16191F', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, padding: '8px 12px' }}>
                                        <span style={{ fontSize: '0.85rem' }}>{item.article}</span>
                                        <span style={{ ...monoStyle, fontSize: '0.85rem' }}>
                                            <span style={{ color: '#FF9A9A' }}>{formatCurrency(item.productCost)}</span>
                                            <span style={{ opacity: .5 }}> → </span>
                                            <span style={{ color: '#FFAB40' }}>{formatCurrency(item.unitCost)}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <p style={{ opacity: .65, margin: 0 }}>No hay cambios de costo para revisar.</p>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, flexShrink: 0 }}>
                    <button
                        style={ghostButtonStyle}
                        onClick={() => setShowReview(false)}
                        disabled={isConfirmingPurchase}
                    >
                        Volver
                    </button>
                    <button
                        style={{ ...primaryButtonStyle, opacity: isConfirmingPurchase ? .6 : 1, cursor: isConfirmingPurchase ? 'not-allowed' : 'pointer' }}
                        onClick={() => void confirmPurchase()}
                        disabled={isConfirmingPurchase}
                    >
                        {isConfirmingPurchase ? 'Confirmando...' : 'Confirmar ingreso'}
                    </button>
                </div>
            </div>
        </div>
    );
}
