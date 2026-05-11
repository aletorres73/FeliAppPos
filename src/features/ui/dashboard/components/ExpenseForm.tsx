import React from 'react';
import { useExpenseForm } from '../../../domain/hook/useExpenseForm';
import { cardStyle, kpiLabel, /* backButtonStyle */ } from '../../dashboard/styles/Dashboard';

const CATEGORIES: { value: string, label: string }[] = [
    { value: 'SUPPLIER', label: '📦 Proveedor' },
    { value: 'SUPPLIES', label: '🛒 Insumos' },
    { value: 'SALARY', label: '👥 Sueldos' },
    { value: 'SERVICES', label: '⚡ Servicios' },
    { value: 'OTHER', label: '✨ Otros' },
];

interface Props {
    onComplete: () => void; // Callback para notificar al padre que se guardó con éxito
}

export default function ExpenseForm({ onComplete }: Props) {
    const { formData, setFormData, saveExpense, isLoading } = useExpenseForm(onComplete);

    return (
        <div style={cardStyle}>
            <h3 style={{ color: '#54C4F0', marginBottom: '20px' }}>Registrar Egreso</h3>
            
            <div style={formGroup}>
                <label style={kpiLabel}>Categoría</label>
                <div style={categoryGrid}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFormData({...formData, category: cat.value as any})}
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
                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                    style={inputStyle}
                    placeholder="0.00"
                />
            </div>

            <div style={formGroup}>
                <label style={kpiLabel}>Método de Pago</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['CASH', 'TRANSFER'].map(m => (
                        <button
                            key={m}
                            onClick={() => setFormData({...formData, paymentMethod: m as any})}
                            style={{
                                ...methodBtn,
                                border: formData.paymentMethod === m ? '2px solid #54C4F0' : '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: formData.paymentMethod === m ? 'rgba(84, 196, 240, 0.1)' : 'transparent'
                            }}
                        >
                            {m === 'CASH' ? '💵 Efectivo' : '🏦 Transf.'}
                        </button>
                    ))}
                </div>
            </div>

            <div style={formGroup}>
                <label style={kpiLabel}>Nota / Concepto</label>
                <textarea 
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    style={textareaStyle}
                    placeholder="Ej: Pago de luz abril..."
                />
            </div>

            <button 
                disabled={isLoading}
                onClick={saveExpense}
                style={submitBtn}
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