import React from 'react';
import { useSalesReports } from '../hook/useSalesReports';
import { formatCurrency } from "../../../utils/formats";
import { useNavigate } from 'react-router-dom';

export default function SalesDashboard() {
    const { stats, isLoading } = useSalesReports();
    const navigate = useNavigate();

    if (isLoading) return (
        <div style={fullScreenCenter}>
            <div className="pulse-animation" style={{ fontSize: '1.2rem', color: '#54C4F0' }}>
                Cargando métricas de Feli App...
            </div>
        </div>
    );

    if (!stats) return (
        <div style={fullScreenCenter}>
            <p>No hay datos para mostrar en este período.</p>
            <button onClick={() => navigate('/')} style={backButtonStyle}>Volver al POS</button>
        </div>
    );

    return (
        <div style={{ padding: '40px 20px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header del Dashboard */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Reporte Mensual</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>Análisis de rendimiento de ventas</p>
                    </div>
                    <button onClick={() => navigate('/')} style={backButtonStyle}>
                        ← Volver a Ventas
                    </button>
                </header>

                {/* 1. Fila de KPIs (4 columnas) */}
                <div style={kpiGrid}>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Total Facturado</span>
                        <span style={accentText}>{formatCurrency(stats.periodTotal)}</span>
                    </div>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Efectivo</span>
                        <span style={{ ...accentText, color: '#4CAF50' }}>{formatCurrency(stats.periodCash)}</span>
                    </div>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Transferencias</span>
                        <span style={{ ...accentText, color: '#9C27B0' }}>{formatCurrency(stats.periodTransfer)}</span>
                    </div>
                    <div style={cardStyle}>
                        <span style={kpiLabel}>Deuda Pendiente</span>
                        <span style={{ ...accentText, color: '#FF5252' }}>{formatCurrency(stats.pendingCollect)}</span>
                    </div>
                </div>

                {/* 2. Rankings de Productos */}
                <div style={rankingGrid}>
                    {/* Más Vendidos */}
                    <div style={cardStyle}>
                        <h3 style={rankingTitle}>🔥 Más Vendidos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {stats.topProducts.map((product, idx) => (
                                <div key={`top-${idx}`} style={listItem}>
                                    <span style={itemArticle}>{product.article}</span>
                                    <span style={itemBranch}>{product.branch}</span>
                                    <span style={itemBadge}>{product.quantity.toFixed(2)} ud.</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Menos Vendidos */}
                    <div style={cardStyle}>
                        <h3 style={{ ...rankingTitle, color: '#FFAB40' }}>🧊 Menos Vendidos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {stats.bottomProducts.map((product, idx) => (
                                <div key={`bottom-${idx}`} style={listItem}>
                                    <span style={itemArticle}>{product.article}</span>
                                    <span style={itemBranch}>{product.branch}</span>
                                    <span style={{ ...itemBadge, backgroundColor: 'rgba(255, 171, 64, 0.1)', color: '#FFAB40' }}>
                                        {product.quantity.toFixed(2)} ud.
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Estilos Consistentes ---

const kpiGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
};

const rankingGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
};

const cardStyle: React.CSSProperties = {
    backgroundColor: '#1A1D23',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};

const kpiLabel: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'block'
};

const accentText: React.CSSProperties = {
    color: '#54C4F0',
    fontSize: '1.8rem',
    fontWeight: 700,
    display: 'block'
};

const rankingTitle: React.CSSProperties = {
    fontSize: '1.1rem',
    marginBottom: '20px',
    color: '#54C4F0',
    fontWeight: 600
};

const listItem: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
};

const itemBadge: React.CSSProperties = {
    backgroundColor: 'rgba(84, 196, 240, 0.1)',
    color: '#54C4F0',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600
};

const itemArticle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.82)',
    marginRight: '6px'
};

const itemBranch: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.4)',
    marginRight: '6px'
};

const backButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: '0.2s all'
};

const fullScreenCenter: React.CSSProperties = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1115',
    color: 'white',
    gap: '20px'
};