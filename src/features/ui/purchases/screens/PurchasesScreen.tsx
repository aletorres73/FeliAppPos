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

const inputStyle: React.CSSProperties = { background: '#12151b', color: 'white', border: '1px solid rgba(255,255,255,.14)', borderRadius: 6, padding: '10px 12px', boxSizing: 'border-box' };
const panelStyle: React.CSSProperties = { background: '#1A1D23', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: 20 };
const sectionLabelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, opacity: .65, fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 };
const cardHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.08)' };
const primaryButtonStyle: React.CSSProperties = { ...inputStyle, background: '#54C4F0', color: '#0F1115', fontWeight: 700, cursor: 'pointer', border: 'none' };
const ghostButtonStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer', background: 'transparent' };
const dangerButtonStyle: React.CSSProperties = { ...inputStyle, color: '#FF7E7E', cursor: 'pointer', background: 'transparent' };
const monoStyle: React.CSSProperties = { fontFamily: 'monospace' };

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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Compras y reposición</h1>
                <p style={{ opacity: .55, margin: '6px 0 0', fontSize: '0.9rem' }}>Ingreso de mercadería, proveedores y cuentas pendientes</p>
            </div>
            <button style={{ ...ghostButtonStyle, color: '#54C4F0' }} onClick={() => setShowSupplierForm((value) => !value)}>+ Proveedor</button>
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
                    {items.map((item) => <article key={item.productId} style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '14px 16px', marginBottom: 12, background: '#16191F' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div>
                                <strong style={{ fontSize: '0.95rem' }}>{item.article}</strong>
                                <small style={{ display: 'block', opacity: .5, marginTop: 2 }}>{item.saleWeight ? `${item.quantity} kg` : `${item.quantity} unidades`} · costo anterior {formatCurrency(item.productCost)}</small>
                            </div>
                            <strong style={{ ...monoStyle, fontSize: '1rem' }}>{formatCurrency(item.subtotal)}</strong>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
                            <button type="button" style={{ ...ghostButtonStyle, color: item.purchaseType === 'UNIT' ? '#54C4F0' : 'white', borderColor: item.purchaseType === 'UNIT' ? 'rgba(84,196,240,.5)' : 'rgba(255,255,255,.14)' }} onClick={() => chooseBulk(item, false)}>Por unidad</button>
                            <button type="button" style={{ ...ghostButtonStyle, color: item.purchaseType === 'BULK' ? '#54C4F0' : 'white', borderColor: item.purchaseType === 'BULK' ? 'rgba(84,196,240,.5)' : 'rgba(255,255,255,.14)' }} onClick={() => chooseBulk(item, true)}>Por bulto</button>
                            {item.purchaseType === 'BULK' && <input style={{ ...inputStyle, width: 100 }} type="number" min="1" placeholder="Bultos" value={item.bulks} onChange={(event) => { const bulks = Number(event.target.value); const units = item.unitsPerBulk || 1; updateItem(item.productId, { bulks, quantity: bulks * units, bulkCost: item.bulkCost || 0, unitCost: item.bulkCost ? item.bulkCost / units : item.unitCost }); }} />}
                            {item.purchaseType === 'BULK' && <input style={{ ...inputStyle, width: 125 }} type="number" min="0" step="0.01" placeholder="Precio bulto" value={item.bulkCost ?? ''} onChange={(event) => { const bulkCost = Number(event.target.value); updateItem(item.productId, { bulkCost, unitCost: bulkCost / (item.unitsPerBulk || 1) }); }} />}
                            {item.purchaseType === 'UNIT' && <input style={{ ...inputStyle, width: 100 }} type="number" min="0" step={item.saleWeight ? '0.001' : '1'} placeholder={item.saleWeight ? 'Kg' : 'Cantidad'} value={item.quantity} onChange={(event) => updateItem(item.productId, { quantity: Number(event.target.value) })} />}
                            {item.purchaseType === 'UNIT' && <input style={{ ...inputStyle, width: 125 }} type="number" min="0" step="0.01" placeholder="Costo unitario" value={item.unitCost} onChange={(event) => updateItem(item.productId, { unitCost: Number(event.target.value) })} />}
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
