import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashflow } from '../../../domain/hook/useCashFlow';
import { formatCurrency } from "../../../../utils/formats";
import ExpenseForm from '../components/ExpenseForm';

import {
    backButtonStyle, kpiGrid, cardStyle, kpiLabel, accentText,
    filterContainer, filterBadge, fullScreenCenter
} from '../styles/Dashboard';

export default function CashFlowDashboard() {
    const { stats, isLoading, range, setRange, refetch } = useCashflow();
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const navigate = useNavigate();

    // Función que se ejecuta al guardar con éxito
    const handleExpenseSuccess = () => {
        setShowExpenseModal(false);
        refetch(); // Recarga los stats financieros para reflejar el nuevo egreso
    };  

    if (isLoading) return (
        <div style={fullScreenCenter}>
            <div className="pulse-animation" style={{ fontSize: '1.2rem', color: '#54C4F0' }}>
                Consolidando flujo de caja...
            </div>
        </div>
    );

    return (
        <div style={{ padding: '40px 20px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Salud Financiera</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Estado de liquidez y compromisos</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {/* BOTÓN PARA ABRIR EL MODAL */}
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            style={{ ...backButtonStyle, backgroundColor: '#54C4F0', color: '#0F1115', border: 'none' }}
                        >
                            + Registrar Gasto
                        </button>
                    </div>
                    <button onClick={() => navigate('/')} style={backButtonStyle}>← Volver al POS</button>
                </header>

                {/* Filtros de Período */}
                <div style={filterContainer}>
                    {['today', 'week', 'month'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r as any)}
                            style={{
                                ...filterBadge,
                                backgroundColor: range === r ? '#54C4F0' : 'rgba(255,255,255,0.05)',
                                color: range === r ? '#0F1115' : 'white'
                            }}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
                        </button>
                    ))}
                </div>

                {/* Grilla de KPIs Principales */}
                <div style={kpiGrid}>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Efectivo en Caja</span>
                        <span style={{ ...accentText, color: '#4CAF50' }}>
                            {formatCurrency(stats?.availableCash || 0)}
                        </span>
                    </div>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Saldo Bancario</span>
                        <span style={{ ...accentText, color: '#9C27B0' }}>
                            {formatCurrency(stats?.availableBank || 0)}
                        </span>
                    </div>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Egresos del Período</span>
                        <span style={{ ...accentText, color: '#FF5252' }}>
                            {formatCurrency(stats?.totalExpense || 0)}
                        </span>
                    </div>
                    <div style={{ ...cardStyle, border: '1px solid #54C4F0' }}>
                        <span style={kpiLabel}>Saldo Neto Real</span>
                        <span style={accentText}>
                            {formatCurrency(stats?.netBalance || 0)}
                        </span>
                    </div>
                </div>

                {/* Sección de Compromisos y Proyecciones */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '1.1rem', color: '#54C4F0' }}>Pendiente de Cobro</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {formatCurrency(stats?.pendingToCollect || 0)}
                        </p>
                        <small style={{ color: 'rgba(255,255,255,0.3)' }}>Cuentas corrientes activas</small>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '1.1rem', color: '#FFAB40' }}>Distribución de Egresos</h3>
                        <div style={{ marginTop: '10px' }}>
                            <div style={detailRow}>
                                <span>Proveedores:</span>
                                <span>{formatCurrency(stats?.byCategory.supplierOut || 0)}</span>
                            </div>
                            <div style={detailRow}>
                                <span>Sueldos:</span>
                                <span>{formatCurrency(stats?.byCategory.salaryOut || 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* MODAL DE EGRESOS */}
                    {showExpenseModal && (
                        <div style={modalOverlay}>
                            <div style={modalContent}>
                                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h3 style={{ margin: 0, color: '#54C4F0' }}>Nuevo Egreso</h3>
                                    <button
                                        onClick={() => setShowExpenseModal(false)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem' }}
                                    >
                                        ✕
                                    </button>
                                </header>

                                <ExpenseForm onComplete={handleExpenseSuccess} />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Estilos para el Modal
const modalOverlay: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
};

const modalContent: React.CSSProperties = {
    backgroundColor: '#1A1D23', padding: '30px', borderRadius: '16px',
    width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
};

const detailRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '0.9rem'
};