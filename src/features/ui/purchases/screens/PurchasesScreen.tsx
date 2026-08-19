import { useEffect, useMemo, useState } from 'react';
import { getProducts } from '../../../data/repositories/ProductRepository';
import { purchaseRepository } from '../../../data/repositories/PurchaseRepository';
import { supplierRepository } from '../../../data/repositories/SupplierRepository';
import type { Product } from '../../../domain/types/productTypes';
import type { Purchase, PurchaseDraftItem } from '../../../domain/types/purchaseTypes';
import type { PaymentMethod } from '../../../domain/types/orderTypes';
import type { Supplier } from '../../../domain/types/supplierTypes';
import { ScannerInput } from '../../orders/components/ScannerImput';
import { PurchaseDetailModal } from '../components/PurchaseDetailModal';
import { formatCurrency } from '../../../domain/utils/formats';

const inputStyle: React.CSSProperties = { background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)', borderRadius: 6, padding: '10px 12px' };
const panelStyle: React.CSSProperties = { background: '#1A1D23', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 20 };

export default function PurchasesScreen() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [items, setItems] = useState<PurchaseDraftItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [payment, setPayment] = useState('0');
    const [paymentType, setPaymentType] = useState<PaymentMethod['type']>('CASH');
    const [showReview, setShowReview] = useState(false);
    const [showSupplierForm, setShowSupplierForm] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [supplierContact, setSupplierContact] = useState('');
    const [history, setHistory] = useState<Purchase[]>([]);
    const [message, setMessage] = useState('');
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId);
    const suggestions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return [];
        return products.filter((product) =>
            product.article.toLowerCase().includes(term) ||
            product.branch?.toLowerCase().includes(term) ||
            product.id.toLowerCase().includes(term)).slice(0, 8);
    }, [products, searchTerm]);
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
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
            if (existing) return current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitCost } : item);
            return [...current, { productId: product.id, article: product.article, quantity: 1, saleWeight: product.saleWeight, bulks: 0, unitsPerBulk: product.unitsPerBulk || null, purchaseType: 'UNIT', unitCost: product.cost || 0, bulkCost: null, subtotal: product.saleWeight ? (product.cost || 0) * 10 : (product.cost || 0), productCost: product.cost || 0 }];
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
            return { ...next, quantity, unitCost, subtotal: Number((quantity * unitCost * subtotalMultiplier).toFixed(2)) };
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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div><h1 style={{ margin: 0 }}>Compras y reposición</h1><p style={{ opacity: .55 }}>Ingreso de mercadería, proveedores y cuentas pendientes</p></div>
            <button style={{ ...inputStyle, cursor: 'pointer', color: '#54C4F0' }} onClick={() => setShowSupplierForm((value) => !value)}>+ Proveedor</button>
        </header>
        {message && <div style={{ ...panelStyle, color: '#80E0B0', marginBottom: 16 }}>{message}</div>}
        {showSupplierForm && <form onSubmit={saveSupplier} style={{ ...panelStyle, display: 'flex', gap: 10, marginBottom: 16 }}><input style={inputStyle} placeholder="Nombre" value={supplierName} onChange={(event) => setSupplierName(event.target.value)} /><input style={inputStyle} placeholder="Contacto" value={supplierContact} onChange={(event) => setSupplierContact(event.target.value)} /><button style={{ ...inputStyle, cursor: 'pointer' }}>Guardar</button></form>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, .8fr)', gap: 20 }}>
            <section style={panelStyle}>
                <label style={{ display: 'block', marginBottom: 8, opacity: .65 }}>PROVEEDOR</label>
                <select style={{ ...inputStyle, width: '100%', marginBottom: 20 }} value={selectedSupplierId} onChange={(event) => setSelectedSupplierId(event.target.value)}><option value="">Seleccionar proveedor</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name} · deuda {formatCurrency(supplier.currentBalance)}</option>)}</select>
                <ScannerInput onScan={addProduct} externalValue={searchTerm} onChange={setSearchTerm} suggestions={suggestions} />
                <div style={{ marginTop: 24 }}>
                    {items.map((item) => <article key={item.productId} style={{ borderBottom: '1px solid rgba(255,255,255,.08)', padding: '14px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.article}</strong><strong>{formatCurrency(item.subtotal)}</strong></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'center' }}>
                            <button type="button" style={{ ...inputStyle, color: item.purchaseType === 'UNIT' ? '#54C4F0' : 'white', cursor: 'pointer' }} onClick={() => chooseBulk(item, false)}>Por unidad</button>
                            <button type="button" style={{ ...inputStyle, color: item.purchaseType === 'BULK' ? '#54C4F0' : 'white', cursor: 'pointer' }} onClick={() => chooseBulk(item, true)}>Por bulto</button>
                            {item.purchaseType === 'BULK' && <input style={{ ...inputStyle, width: 100 }} type="number" min="1" placeholder="Bultos" value={item.bulks} onChange={(event) => { const bulks = Number(event.target.value); const units = item.unitsPerBulk || 1; updateItem(item.productId, { bulks, quantity: bulks * units, bulkCost: item.bulkCost || 0, unitCost: item.bulkCost ? item.bulkCost / units : item.unitCost }); }} />}
                            {item.purchaseType === 'BULK' && <input style={{ ...inputStyle, width: 125 }} type="number" min="0" step="0.01" placeholder="Precio bulto" value={item.bulkCost ?? ''} onChange={(event) => { const bulkCost = Number(event.target.value); updateItem(item.productId, { bulkCost, unitCost: bulkCost / (item.unitsPerBulk || 1) }); }} />}
                            {item.purchaseType === 'UNIT' && <input style={{ ...inputStyle, width: 100 }} type="number" min="0" step={item.saleWeight ? '0.001' : '1'} placeholder={item.saleWeight ? 'Kg' : 'Cantidad'} value={item.quantity} onChange={(event) => updateItem(item.productId, { quantity: Number(event.target.value) })} />}
                            {item.purchaseType === 'UNIT' && <input style={{ ...inputStyle, width: 125 }} type="number" min="0" step="0.01" placeholder="Costo unitario" value={item.unitCost} onChange={(event) => updateItem(item.productId, { unitCost: Number(event.target.value) })} />}
                            <span style={{ opacity: .55 }}>{item.saleWeight ? `${item.quantity} kg` : `${item.quantity} unidades`} · costo anterior {formatCurrency(item.productCost)}</span>
                            <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.productId !== item.productId))} style={{ ...inputStyle, color: '#FF7E7E', cursor: 'pointer' }}>Quitar</button>
                        </div>
                    </article>)}
                    {!items.length && <p style={{ opacity: .45, textAlign: 'center', padding: 35 }}>Escanea o busca un producto para comenzar.</p>}
                </div>
            </section>
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <section style={panelStyle}>
                    <h2 style={{ marginTop: 0 }}>Resumen</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22 }}>
                        <span>Total</span>
                        <strong>{formatCurrency(total)}</strong>
                    </div>
                    <label style={{ display: 'block', marginTop: 20, marginBottom: 6, opacity: .65 }}>PAGO REALIZADO</label>
                    <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} type="number" min="0" max={total} step="0.01" value={payment} onChange={(event) => setPayment(event.target.value)} />
                    <select style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginTop: 8 }} value={paymentType || 'CASH'} onChange={(event) => setPaymentType(event.target.value as PaymentMethod['type'])}>
                        <option value="CASH">Efectivo</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="QR">QR</option>
                    </select>
                    <p style={{ color: debt > 0 ? '#FF9A9A' : '#80E0B0' }}>Saldo a cuenta: {formatCurrency(debt)}</p>
                    <button disabled={!selectedSupplier || !items.length} onClick={() => setShowReview(true)} style={{ width: '100%', ...inputStyle, background: '#54C4F0', color: '#0F1115', fontWeight: 700, cursor: 'pointer' }}>Revisar y confirmar</button>
                </section>
                <section style={panelStyle}>
                    <h2 style={{ marginTop: 0 }}>Cuenta e historial</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span>Deuda actual</span>
                        <strong style={{ color: '#FF9A9A' }}>{formatCurrency(selectedSupplier?.currentBalance || 0)}</strong>
                    </div>
                    {history.slice(0, 6).map((purchase) =>
                        <button type="button" key={purchase.docId} onClick={() => purchase.payStatus === 'PENDING' && setSelectedPurchase(purchase)} style={{ width: '100%', textAlign: 'left', color: 'white', background: 'transparent', border: 0, borderBottom: '1px solid rgba(255,255,255,.08)', padding: '9px 0', cursor: purchase.payStatus === 'PENDING' ? 'pointer' : 'default' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{new Date(purchase.createdAt).toLocaleDateString('es-AR')}
                                    <small style={{ display: 'block', opacity: .5 }}>{purchase.docId}</small>
                                </span>
                                <span style={{ textAlign: 'right' }}><strong>{formatCurrency(purchase.total)}</strong><small style={{ display: 'block', color: purchase.payStatus === 'PENDING' ? '#FFAB40' : '#80E0B0' }}>{purchase.payStatus === 'PENDING' ? `Pendiente · ${formatCurrency(purchase.debt)}` : 'Pagada'}</small></span>
                            </div>
                            <small style={{ opacity: .55 }}>{purchase.items.map((item) => `${item.article}: ${formatCurrency(item.unitCost)}/u`).join(' · ')}</small>
                        </button>)}
                    {!history.length && <p style={{ opacity: .45 }}>Sin compras registradas.</p>}
                </section>
            </aside>
        </div>
        {selectedPurchase && <PurchaseDetailModal purchase={selectedPurchase} onClose={() => setSelectedPurchase(null)} onConfirm={handlePurchasePayment} isProcessing={isProcessingPayment} />}
        {showReview &&
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
                <div style={{ ...panelStyle, maxWidth: 520, width: 'calc(100% - 40px)' }}>
                    <h2>Revisión sugerida</h2>{changedCosts.length ?
                        <p>El costo unitario cambió en {changedCosts.length} producto(s). El precio de venta se conserva para que lo ajustes manualmente desde Stock.</p>
                        : <p>No hay cambios de costo para revisar.</p>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                        <button style={{ ...inputStyle, cursor: 'pointer' }} onClick={() => setShowReview(false)}>Volver</button>
                        <button style={{ ...inputStyle, background: '#54C4F0', color: '#0F1115', cursor: 'pointer', fontWeight: 700 }}
                            onClick={() => void confirmPurchase()}>Confirmar ingreso</button>
                    </div>
                </div>
            </div>}
    </div>;
}
