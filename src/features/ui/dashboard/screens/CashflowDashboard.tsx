import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashflow } from '../../../domain/hook/useCashFlow';
import { formatCurrency } from "../../../../utils/formats";
import ExpenseForm from '../components/ExpenseForm';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import {
    cardStyle, kpiLabel, accentText,
    filterBadge, fullScreenCenter
} from '../styles/Dashboard';

export default function CashFlowDashboard() {
    const { stats, isLoading, range, setRange, refetch } = useCashflow();
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const navigate = useNavigate();

    if (isLoading) return (
        <div style={fullScreenCenter}>
            <div className="pulse-animation" style={loaderTextStyle}>
                CONSOLIDANDO FLUJO DE CAJA...
            </div>
        </div>
    );

    // Datos procesados para el orden visual
    const incomeData = [
        { name: 'Efectivo', value: stats?.availableCash || 0, color: '#4CAF50' },
        { name: 'Transferencia', value: stats?.availableBank || 0, color: '#54C4F0' }
    ];

    const expenseCategories = [
        { label: 'Proveedores', val: stats?.byCategory.supplierOut, color: '#FFAB40' },
        { label: 'Sueldos', val: stats?.byCategory.salaryOut, color: '#FF5252' },
        { label: 'Insumos', val: stats?.byCategory.suppliesOut, color: '#9C27B0' },
        { label: 'Servicios', val: stats?.byCategory.servicesOut, color: '#E91E63' },
        { label: 'Otros', val: stats?.byCategory.otherOut, color: '#FF4081' }
    ];

    return (
        <div style={containerStyle}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                {/* Header Estilo Mercado Pago */}
                <header style={headerStyle}>
                    <div>
                        <h2 style={mainTitleStyle}>Salud Financiera</h2>
                        <div style={statusBadge}>PERÍODO: {range.toUpperCase()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setShowExpenseModal(true)} style={primaryButtonStyle}>
                            + Registrar Gasto
                        </button>
                        <button onClick={() => navigate('/')} style={secondaryButtonStyle}>Volver</button>
                    </div>
                </header>

                {/* Filtros Integrados */}
                <nav style={navFilterStyle}>
                    {['today', 'week', 'month'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r as any)}
                            style={{
                                ...filterBadge,
                                backgroundColor: range === r ? '#54C4F0' : 'transparent',
                                color: range === r ? '#0F1115' : 'rgba(255,255,255,0.4)',
                                border: 'none',
                                borderRadius: '100px',
                                padding: '8px 24px'
                            }}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
                        </button>
                    ))}
                </nav>

                {/* Main KPI: La Cifra de Oro */}
                <div style={mainKpiCard}>
                    <span style={{ ...kpiLabel, marginBottom: '12px' }}>
                        DINERO DISPONIBLE (LIQUIDEZ REAL)
                    </span>
                    <h1 style={{ ...accentText, fontSize: '3.8rem', margin: '10px 0' }}>
                        {formatCurrency(stats?.netBalance || 0)}
                    </h1>
                    <p style={{ ...helperTextStyle, marginTop: '12px' }}>Efectivo y banco disponible tras cubrir todos los gastos registrados.</p>
                </div>

                {/* Grilla de Análisis Comparativo */}
                <div style={dashboardGrid}>

                    {/* Bloque de Ingresos: El Origen */}
                    <div style={sectionCard}>
                        <div style={cardHeader}>
                            <h3 style={sectionTitle}>Ingresos Totales</h3>
                            <span style={{ color: '#4CAF50', fontWeight: 700 }}>{formatCurrency(stats?.totalIncome || 0)}</span>
                        </div>
                        <div style={{ height: '180px', margin: '20px 0' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={incomeData} innerRadius={65} outerRadius={80} paddingAngle={8} dataKey="value">
                                        {incomeData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={legendGrid}>
                            {incomeData.map(item => (
                                <div key={item.name} style={legendItem}>
                                    <div style={{ ...dot, backgroundColor: item.color }}></div>
                                    <span style={legendLabel}>{item.name}</span>
                                    <span style={legendValue}>{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bloque de Egresos: El Destino */}
                    <div style={sectionCard}>
                        <div style={cardHeader}>
                            <h3 style={sectionTitle}>Egresos Totales</h3>
                            <span style={{ color: '#FF5252', fontWeight: 700 }}>{formatCurrency(stats?.totalExpense || 0)}</span>
                        </div>
                        <div style={categoryList}>
                            {expenseCategories.map(cat => (
                                <div key={cat.label} style={categoryRow}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{cat.label}</span>
                                    <div style={barContainer}>
                                        <div style={{
                                            width: `${((cat.val || 0) / (stats?.totalExpense || 1)) * 100}%`,
                                            height: '100%',
                                            backgroundColor: cat.color,
                                            borderRadius: '4px'
                                        }}></div>
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(cat.val || 0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer de Gestión de Riesgo */}
                <div style={riskCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={warningIcon}>!</div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#FFAB40' }}>CUENTAS POR COBRAR</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6 }}>Dinero fuera de caja en posesión de clientes.</p>
                        </div>
                    </div>
                    <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#FFAB40' }}>
                        {formatCurrency(stats?.pendingToCollect || 0)}
                    </span>
                </div>

            </div>

            {/* Modal Optimizado */}
            {showExpenseModal && (
                <div style={modalOverlay}>
                    <div style={modalContent}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Registrar Gasto</h3>
                            <button onClick={() => setShowExpenseModal(false)} style={closeBtn}>✕</button>
                        </header>
                        <ExpenseForm onComplete={() => { setShowExpenseModal(false); refetch(); }} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ESTILOS INLINE PARA MANTENER LA CONSISTENCIA DE FELI APP
const containerStyle: React.CSSProperties = { padding: '40px 20px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white', fontFamily: "'Inter', sans-serif" };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' };
const mainTitleStyle: React.CSSProperties = { fontSize: '1.8rem', fontWeight: 700, margin: 0 };
const statusBadge: React.CSSProperties = { fontSize: '0.7rem', color: '#54C4F0', letterSpacing: '1px', fontWeight: 800, marginTop: '5px' };
const navFilterStyle: React.CSSProperties = { display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: '#1A1D23', padding: '6px', borderRadius: '100px', width: 'fit-content' };
const mainKpiCard: React.CSSProperties = { ...cardStyle, textAlign: 'center', padding: '30px 20px', background: 'radial-gradient(circle at top right, #1E2228, #1A1D23)', border: '1px solid rgba(84, 196, 240, 0.1)', marginBottom: '30px', justifyContent: 'space-between', };
const dashboardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' };
const sectionCard: React.CSSProperties = { ...cardStyle, padding: '24px', display: 'flex', flexDirection: 'column' };
const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' };
const sectionTitle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: 600, opacity: 0.6, margin: 0 };
const legendGrid: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px' };
const legendItem: React.CSSProperties = { display: 'flex', alignItems: 'center', fontSize: '0.85rem' };
const dot: React.CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', marginRight: '10px' };
const legendLabel: React.CSSProperties = { flex: 1, opacity: 0.7 };
const legendValue: React.CSSProperties = { fontWeight: 600 };
const categoryList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' };
const categoryRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '100px 1fr 100px', alignItems: 'center', gap: '15px', fontSize: '0.85rem' };
const barContainer: React.CSSProperties = { height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' };
const riskCard: React.CSSProperties = { marginTop: '24px', padding: '24px 32px', backgroundColor: 'rgba(255,171,64,0.03)', borderRadius: '16px', border: '1px solid rgba(255,171,64,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const warningIcon: React.CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#FFAB40', color: '#0F1115', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 };
const primaryButtonStyle: React.CSSProperties = { backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', fontWeight: 700, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' };
const secondaryButtonStyle: React.CSSProperties = { backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', opacity: 0.6 };
const helperTextStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' };
const loaderTextStyle: React.CSSProperties = { fontSize: '1rem', color: '#54C4F0', letterSpacing: '2px', fontWeight: 300 };
const tooltipStyle: React.CSSProperties = { backgroundColor: '#1A1D23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.8rem' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' };
const modalContent: React.CSSProperties = { backgroundColor: '#1A1D23', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '450px', border: '1px solid rgba(255,255,255,0.05)' };
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1.2rem' };