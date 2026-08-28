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
import { formatCurrency } from '../../../domain/utils/formats';
import { StockModal } from '../../stock/components/StockModal';
import { createEmptyProduct, toNewProduct, updateProductCost, updateProductGains, updateProductPrice } from '../../stock/hooks/productForm';

const inputStyle: React.CSSProperties = { background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)', borderRadius: 6, padding: '10px 12px', boxSizing: 'border-box' };
const panelStyle: React.CSSProperties = { background: '#1A1D23', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 20 };
const sectionLabelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, opacity: .65, fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 };
const cardHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.08)' };
const primaryButtonStyle: React.CSSProperties = { ...inputStyle, background: '#54C4F0', color: '#0F1115', fontWeight: 700, cursor: 'pointer', border: 'none' };
const ghostButtonStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', background: 'transparent' };
const dangerButtonStyle: React.CSSProperties = { ...inputStyle, color: '#FF7E7E', cursor: 'pointer', background: 'transparent' };
const monoStyle: React.CSSProperties = { fontFamily: 'monospace' };
const discountToggleStyle = (active: boolean): React.CSSProperties => ({ ...inputStyle, padding: '6px 10px', cursor: 'pointer', background: active ? 'rgba(84,196,240,.18)' : 'transparent', color: active ? '#54C4F0' : 'white', borderColor: active ? 'rgba(84,196,240,.5)' : 'rgba(255,255,255,.14)' });

const computeDiscountedSubtotal = (rawSubtotal: number, discountType: DiscountType, discountValue: number) => {
    const value = Math.max(0, Number(discountValue) || 0);
    const discounted = discountType === 'PERCENT' ? rawSubtotal * (1 - Math.min(value, 100) / 100) : rawSubtotal - value;
    return Number(Math.max(0, discounted).toFixed(2));
};

export default function PurchasesScreen() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [items, setItems] = useState<PurchaseDraftItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

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
    const paid = Math.min(Math.max(Number(payment) || 0, 0), total);
    const debt = total - paid;
    const changedCosts = items.filter((item) => item.productCost !== item.unitCost);

    const loadData = async () => {
        const [supplierData, productData] = await Promise.all([supplierRepository.getAll(), getProducts()]);
        setSuppliers(supplierData);
        setProducts(productData);
        if (!selectedSupplierId && supplierData[0]) setSelectedSupplierId(supplierData[0].id);
    };

    useEffect(() => { void loadData(); }, []);
    useEffect(() => {
        if (!selectedSupplierId) { setHistory([]); return; }
        void purchaseRepository.getBySupplier(selectedSupplierId).then(setHistory);
    }, [selectedSupplierId]);

    const addProduct = (productId: string) => {
        const product = products.find((candidate) => candidate.id === productId);
        if (!product) return;
        setItems((current) => {
            const existing = current.find((item) => item.productId === product.id);
            if (existing) {
                return current.map((item) => {
                    if (item.productId !== product.id) return item;
                    const quantity = item.quantity + 1;
                    const rawSubtotal = Number((quantity * item.unitCost).toFixed(2));
                    return { ...item, quantity, rawSubtotal, subtotal: computeDiscountedSubtotal(rawSubtotal, item.discountType, item.discountValue) };
                });
            }
            const rawSubtotal = product.saleWeight ? (product.cost || 0) * 10 : (product.cost || 0);
            return [...current, { productId: product.id, article: product.article, quantity: 1, saleWeight: product.saleWeight, bulks: 0, unitsPerBulk: product.unitsPerBulk || null, previousUnitsPerBulk: product.unitsPerBulk || null, purchaseType: 'UNIT', unitCost: product.cost || 0, bulkCost: null, rawSubtotal, discountType: 'AMOUNT', discountValue: 0, subtotal: rawSubtotal, productCost: product.cost || 0 }];
        });
        setSearchTerm('');
    };

    const updateItem = (productId: string, patch: Partial<PurchaseDraftItem>) => {
        setItems((current) => current.map((item) => {
            if (item.productId !== productId) return item;
            const next = { ...item, ...patch };
            const quantity = Math.max(0, Number(next.quantity) || 0);
            const unitCost = Math.max(0, Number(next.unitCost) || 0);
            const subtotalMultiplier = next.saleWeight ? 10 : 1;
            const rawSubtotal = Number((quantity * unitCost * subtotalMultiplier).toFixed(2));
            return { ...next, quantity, unitCost, rawSubtotal, subtotal: computeDiscountedSubtotal(rawSubtotal, next.discountType, next.discountValue) };
        }));
    };

    const updateItemDiscount = (productId: string, patch: Partial<Pick<PurchaseDraftItem, 'discountType' | 'discountValue'>>) => {
        setItems((current) => current.map((item) => {
            if (item.productId !== productId) return item;
            const next = { ...item, ...patch };
            return { ...next, subtotal: computeDiscountedSubtotal(next.rawSubtotal, next.discountType, next.discountValue) };
        }));
    };

    const chooseBulk = (item: PurchaseDraftItem, isBulk: boolean) => {
        const units = item.unitsPerBulk || 1;
        if (!isBulk) {
            updateItem(item.productId, { purchaseType: 'UNIT', bulks: 0, bulkCost: null, quantity: 1, unitCost: item.productCost });
            return;
        }
        const bulkCost = item.bulkCost || item.productCost * units;
        updateItem(item.productId, { purchaseType: 'BULK', bulks: 1, bulkCost, quantity: units, unitCost: Number((bulkCost / units).toFixed(4)) });
    };

    const saveSupplier = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!supplierName.trim()) return;
        await supplierRepository.save({ name: supplierName.trim(), contact: supplierContact.trim(), currentBalance: 0 });
        setSupplierName(''); setSupplierContact(''); setShowSupplierForm(false); await loadData();
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
            await persistProduct(toNewProduct(editingProduct));
            const updatedProducts = await getProducts();
            setProducts(updatedProducts);
            closeProductModal();
            setMessage(`Artículo ${editingProduct.article} creado y disponible para buscar.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo crear el artículo.');
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

    const confirmPurchase = async () => {
        if (!selectedSupplier || !items.length) return;
        const createdAt = new Date().getTime();
        const docId = `PUR-${createdAt}`;
        const purchase: Purchase = {
            docId,
            supplierId: selectedSupplier.id,
            items: items.map((item) => ({ productId: item.productId, article: item.article, quantity: item.quantity, saleWeight: item.saleWeight, bulks: item.bulks, unitsPerBulk: item.unitsPerBulk, purchaseType: item.purchaseType, unitCost: item.unitCost, bulkCost: item.bulkCost, subtotal: item.subtotal })),
            total,
            payed: paid,
            debt,
            payStatus: debt > 0 ? 'PENDING' : 'PAID',
            paymentMethod: paid > 0 ? [{ type: paymentType, amount: paid }] : [],
            createdAt,
        };
        await purchaseRepository.confirm({ purchase, supplier: selectedSupplier, products });
        setItems([]); setPayment('0'); setShowReview(false); setMessage(`Compra ${docId} confirmada.`); await loadData();
        setHistory(await purchaseRepository.getBySupplier(selectedSupplier.id));
    };

    return <div style={{ minHeight: '100vh', padding: '36px 28px', color: 'white', background: '#0F1115' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Compras y reposición</h1>
                <p style={{ opacity: .55, margin: '6px 0 0', fontSize: '0.9rem' }}>Ingreso de mercadería, proveedores y cuentas pendientes</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...ghostButtonStyle, color: '#54C4F0' }} onClick={openProductModal}>+ Artículo</button>
                <button style={{ ...ghostButtonStyle, color: '#54C4F0' }} onClick={() => setShowSupplierForm((value) => !value)}>+ Proveedor</button>
            </div>
        </header>
        {message && <div style={{ ...panelStyle, color: '#80E0B0', marginBottom: 16, borderLeft: '3px solid #80E0B0' }}>✓ {message}</div>}
        {showSupplierForm && <form onSubmit={saveSupplier} style={{ ...panelStyle, display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}><input style={{ ...inputStyle, flex: 1 }} placeholder="Nombre" value={supplierName} onChange={(event) => setSupplierName(event.target.value)} /><input style={{ ...inputStyle, flex: 1 }} placeholder="Contacto" value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} /><button style={primaryButtonStyle}>Guardar</button></form>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, .8fr)', gap: 20 }}>
            <section style={panelStyle}>
                <div style={cardHeaderStyle}>
                    <span style={sectionLabelStyle}>Proveedor</span>
                </div>
                <select style={{ ...inputStyle, width: '100%', marginBottom: 20 }} value={selectedSupplierId} onChange={(event) => setSelectedSupplierId(event.target.value)}><option value="">Seleccionar proveedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} · deuda {formatCurrency(supplier.currentBalance)}</option>)}</select>
                <ScannerInput onScan={addProduct} externalValue={searchTerm} onChange={setSearchTerm} suggestions={suggestions} />
                <div style={{ marginTop: 24 }}>
                    {[...items].reverse().map((item) => <article key={item.productId} style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 12, background: '#16191F' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <strong style={{ fontSize: '0.95rem' }}>{item.article}</strong>
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
                                        <input style={inputStyle} type="number" min="1" step="1" value={item.unitsPerBulk ?? ''} onChange={(event) => { const units = Math.max(1, Number(event.target.value) || 1); updateItem(item.productId, { unitsPerBulk: units, quantity: item.bulks * units, unitCost: item.bulkCost ? Number((item.bulkCost / units).toFixed(4)) : item.unitCost }); }} />
                                    </label>
                                    <label style={{ display: 'grid', gap: 4 }}>
                                        <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Precio por bulto</small>
                                        <input style={inputStyle} type="number" min="0" step="0.01" value={item.bulkCost ?? ''} onChange={(event) => { const bulkCost = Number(event.target.value); updateItem(item.productId, { bulkCost, unitCost: bulkCost / (item.unitsPerBulk || 1) }); }} />
                                    </label>
                                    <label style={{ display: 'grid', gap: 4 }}>
                                        <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Bultos</small>
                                        <input style={inputStyle} type="number" min="1" step="1" value={item.bulks} onChange={(event) => { const bulks = Number(event.target.value); const units = item.unitsPerBulk || 1; updateItem(item.productId, { bulks, quantity: bulks * units, bulkCost: item.bulkCost || 0, unitCost: item.bulkCost ? item.bulkCost / units : item.unitCost }); }} />
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
                                        <input style={inputStyle} type="number" min="0" step={item.saleWeight ? '0.001' : '1'} value={item.quantity} onChange={(event) => updateItem(item.productId, { quantity: Number(event.target.value) })} />
                                    </label>
                                    <label style={{ display: 'grid', gap: 4 }}>
                                        <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Costo unitario</small>
                                        <input style={inputStyle} type="number" min="0" step="0.01" value={item.unitCost} onChange={(event) => updateItem(item.productId, { unitCost: Number(event.target.value) })} />
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
                            <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" step={item.discountType === 'PERCENT' ? '1' : '0.01'} value={item.discountValue} onChange={(event) => updateItemDiscount(item.productId, { discountValue: Number(event.target.value) })} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.productId !== item.productId))} style={dangerButtonStyle}>Quitar</button>
                        </div>
                    </article>)}
                    {!items.length && <p style={{ opacity: .45, textAlign: 'center', padding: 35 }}>Escanea o busca un producto para comenzar.</p>}
                </div>
            </section>
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={{ ...panelStyle, borderColor: 'rgba(84,196,240,.25)' }}>
                    <div style={cardHeaderStyle}>
                        <span style={sectionLabelStyle}>Resumen</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ opacity: .65 }}>Subtotal</span>
                        <strong style={monoStyle}>{formatCurrency(itemsSubtotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                        <small style={{ opacity: .55, fontSize: '0.6rem', letterSpacing: '.5px', textTransform: 'uppercase' }}>Descuento total</small>
                        <button type="button" style={discountToggleStyle(totalDiscountType === 'PERCENT')} onClick={() => setTotalDiscountType('PERCENT')}>%</button>
                        <button type="button" style={discountToggleStyle(totalDiscountType === 'AMOUNT')} onClick={() => setTotalDiscountType('AMOUNT')}>$</button>
                        <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" step={totalDiscountType === 'PERCENT' ? '1' : '0.01'} value={totalDiscountValue} onChange={(event) => setTotalDiscountValue(event.target.value)} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}>
                        <span style={{ opacity: .65 }}>Total</span>
                        <strong style={{ ...monoStyle, fontSize: 26, color: '#54C4F0' }}>{formatCurrency(total)}</strong>
                    </div>
                    <label style={{ ...sectionLabelStyle, marginTop: 20 }}>Pago realizado</label>
                    <input style={{ ...inputStyle, width: '100%' }} type="number" min="0" max={total} step="0.01" value={payment} onChange={(event) => setPayment(event.target.value)} />
                    <select style={{ ...inputStyle, width: '100%', marginTop: 8 }} value={paymentType || 'CASH'} onChange={(event) => setPaymentType(event.target.value as PaymentMethod['type'])}>
                        <option value="CASH">Efectivo</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="QR">QR</option>
                    </select>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
                        <span style={{ opacity: .65 }}>Saldo a cuenta</span>
                        <strong style={{ ...monoStyle, color: debt > 0 ? '#FF9A9A' : '#80E0B0' }}>{formatCurrency(debt)}</strong>
                    </div>
                    <button disabled={!selectedSupplier || !items.length} onClick={() => setShowReview(true)} style={{ width: '100%', ...primaryButtonStyle, opacity: (!selectedSupplier || !items.length) ? .4 : 1, cursor: (!selectedSupplier || !items.length) ? 'not-allowed' : 'pointer' }}>Revisar y confirmar</button>
                </section>
                <section style={panelStyle}>
                    <div style={cardHeaderStyle}>
                        <span style={sectionLabelStyle}>Cuenta e historial</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                        <span style={{ opacity: .65 }}>Deuda actual</span>
                        <strong style={{ ...monoStyle, color: '#FF9A9A', fontSize: '1.1rem' }}>{formatCurrency(selectedSupplier?.currentBalance || 0)}</strong>
                    </div>
                    {history.slice(0, 6).map((purchase) =>
                        <button type="button" key={purchase.docId} onClick={() => purchase.payStatus === 'PENDING' && setSelectedPurchase(purchase)} style={{ width: '100%', textAlign: 'left', color: 'white', background: 'transparent', border: 0, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '10px 0', cursor: purchase.payStatus === 'PENDING' ? 'pointer' : 'default' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.9rem' }}>{new Date(purchase.createdAt).toLocaleDateString('es-AR')}
                                    <small style={{ display: 'block', opacity: .5, ...monoStyle }}>{purchase.docId}</small>
                                </span>
                                <span style={{ textAlign: 'right' }}>
                                    <strong style={monoStyle}>{formatCurrency(purchase.total)}</strong>
                                    <small style={{ display: 'block', marginTop: 4 }}>
                                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, background: purchase.payStatus === 'PENDING' ? 'rgba(255,171,64,.15)' : 'rgba(128,224,176,.15)', color: purchase.payStatus === 'PENDING' ? '#FFAB40' : '#80E0B0' }}>
                                            {purchase.payStatus === 'PENDING' ? `Pendiente · ${formatCurrency(purchase.debt)}` : 'Pagada'}
                                        </span>
                                    </small>
                                </span>
                            </div>
                            <small style={{ opacity: .55, display: 'block', marginTop: 6 }}>{purchase.items.map((item) => `${item.article}: ${formatCurrency(item.unitCost)}/u`).join(' · ')}</small>
                        </button>)}
                    {!history.length && <p style={{ opacity: .45, textAlign: 'center', padding: '20px 0' }}>Sin compras registradas.</p>}
                </section>
            </aside>
        </div>
        {selectedPurchase && <PurchaseDetailModal purchase={selectedPurchase} onClose={() => setSelectedPurchase(null)} onConfirm={handlePurchasePayment} isProcessing={isProcessingPayment} />}
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
        />}
        {showReview &&
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
                <div style={{ ...panelStyle, maxWidth: 520, width: 'calc(100% - 40px)' }}>
                    <div style={cardHeaderStyle}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Revisión sugerida</h2>
                    </div>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                        <button style={ghostButtonStyle} onClick={() => setShowReview(false)}>Volver</button>
                        <button style={primaryButtonStyle} onClick={() => void confirmPurchase()}>Confirmar ingreso</button>
                    </div>
                </div>
            </div>}
    </div>;
}
