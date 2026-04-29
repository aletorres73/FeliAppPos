import { useSalesReports, type DateRange } from '../../../domain/hook/useSalesReports';
import { formatCurrency } from "../../../../utils/formats";
import { useNavigate } from 'react-router-dom';

import {
    fullScreenCenter, backButtonStyle, filterBadge, filterContainer,
    kpiGrid, kpiLabel, cardStyle, accentText, rankingGrid, rankingTitle,
    listItem, itemArticle, itemBadge, itemBranch

} from '../styles/Dashboard';

export default function SalesDashboard() {
    const { stats, isLoading, range, setRange } = useSalesReports();
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
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Reporte de ventas.</h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>Análisis de rendimiento de ventas</p>
                    </div>
                    <button onClick={() => navigate('/')} style={backButtonStyle}>
                        ← Volver a Ventas
                    </button>
                </header>

                <div style={filterContainer}>
                    {(['today', 'week', 'month'] as DateRange[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            style={{
                                ...filterBadge,
                                backgroundColor: range === r ? '#54C4F0' : 'rgba(255,255,255,0.05)',
                                color: range === r ? '#0F1115' : 'white',
                            }}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
                        </button>
                    ))}
                </div>

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

