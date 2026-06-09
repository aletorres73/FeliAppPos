import React from 'react';
import { useExpenseForm } from '../hooks/useExpenseForm';
import { cardStyle, kpiLabel, /* backButtonStyle */ } from '../../dashboard/styles/Dashboard';
import type { PaymentType } from '../../../domain/types/orderTypes';

const CATEGORIES: { value: string, label: string }[] = [
    { value: 'SUPPLIER', label: '📦 Proveedor' },
    { value: 'SUPPLIES', label: '🛒 Insumos' },
    { value: 'SALARY', label: '👥 Sueldos' },
    { value: 'SERVICES', label: '⚡ Servicios' },
    { value: 'OTHER', label: '✨ Otros' },
];

interface Props {
    onComplete: () => void;
    onClose?: () => void;
}

export default function ExpenseForm({ onComplete, onClose }: Props) {
    const { formData, setFormData, saveExpense, isLoading } = useExpenseForm(onComplete);

    // HELPER: Convertir Timestamp a "YYYY-MM-DD" para el input nativo
    const formatDateForInput = (timestamp: number) => {
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSave = async () => {
        if (!formData.amount || formData.amount <= 0) {
            alert("Por favor, ingrese un monto válido.");
            return;
        }

        const finalizedPaymentMethod = formData.paymentMethod.map(p => ({
            ...p,
            amount: formData.amount 
        }));

        const paymentData = finalizedPaymentMethod.length > 0
            ? finalizedPaymentMethod
            : [{ type: 'CASH' as PaymentType, amount: formData.amount }];

        await saveExpense({
            ...formData,
            paymentMethod: paymentData
        });
    };

    return (
        <div style={{ ...cardStyle, width: '600px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <h2 style={{ color: '#54C4F0', fontSize: '1.3rem' }}>Registrar Nuevo Gasto</h2>
                {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>}
            </div>

            {/* SECCIÓN NUEVA: Fecha del Gasto */}
            <div style={formGroup}>
                <label style={kpiLabel}>Seleccionar Fecha</label>
                <input
                    type="date"
                    value={formatDateForInput(formData.createdAt)}
                    onChange={e => {
                        const selectedDate = e.target.value;
                        // Si el usuario borra la fecha, vuelve a Date.now().
                        // El 'T00:00:00' asegura que no haya saltos de día por la zona horaria local.
                        const newTimestamp = selectedDate 
                            ? new Date(`${selectedDate}T00:00:00`).getTime() 
                            : Date.now();
                        setFormData({ ...formData, createdAt: newTimestamp });
                    }}
                    style={{ ...inputStyle, colorScheme: 'dark' }} // colorScheme para el icono del calendario nativo
                />
            </div>

            <div style={formGroup}>
                <label style={kpiLabel}>Categoría</label>
                <div style={categoryGrid}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFormData({ ...formData, category: cat.value as any })}
                            style={{
                                ...categoryTab,
                                backgroundColor: formData.category === cat.value ? '#54C4F0' : 'rgba(255,255,255,0.05)',
                                color: formData.category === cat.value ? '#0F1115' : 'white'
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={formGroup}>
                <label style={kpiLabel}>Monto ($)</label>
                <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: Math.abs(Number(e.target.value)) })}
                    style={inputStyle}
                    placeholder="0.00"
                />
            </div>

            <div style={formGroup}>
                <label style={kpiLabel}>Método de Pago</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['CASH', 'TRANSFER'].map(m => {
                        const isActive = formData.paymentMethod.some(p => p.type === m);
                        return (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setFormData({
                                    ...formData,
                                    paymentMethod: [{ type: m as PaymentType, amount: 0 }]
                                })}
                                style={{
                                    ...methodBtn,
                                    border: isActive ? '2px solid #54C4F0' : '1px solid rgba(255,255,255,0.1)',
                                    backgroundColor: isActive ? 'rgba(84, 196, 240, 0.1)' : 'transparent',
                                    color: isActive ? '#54C4F0' : 'white'
                                }}
                            >
                                {m === 'CASH' ? '💵 Efectivo' : '🏦 Transf.'}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={formGroup}>
                <label style={kpiLabel}>Nota / Concepto</label>
                <textarea
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    style={textareaStyle}
                    placeholder="Ej: Pago de luz abril..."
                />
            </div>

            <button
                disabled={isLoading}
                onClick={handleSave}
                style={{
                    ...submitBtn,
                    opacity: isLoading ? 0.6 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
            >
                {isLoading ? 'Guardando...' : 'Confirmar Gasto'}
            </button>
        </div>
    );
}

// Estilos Inline (JS Objects)
const formGroup: React.CSSProperties = { marginBottom: '20px' };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px', backgroundColor: '#0F1115', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: 'white', fontSize: '1.2rem', outline: 'none', boxSizing: 'border-box'
};
const categoryGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' };
const categoryTab: React.CSSProperties = { padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: '0.2s', fontSize: '0.8rem', fontWeight: 'bold' };
const methodBtn: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', color: 'white', transition: '0.2s' };
const textareaStyle: React.CSSProperties = { ...inputStyle, fontSize: '0.9rem', minHeight: '60px', resize: 'none' };
const submitBtn: React.CSSProperties = {
    width: '100%', padding: '15px', backgroundColor: '#54C4F0', color: '#0F1115',
    border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
};