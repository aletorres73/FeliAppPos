import { useSalesReports } from '../../../domain/hook/useSalesReports';
import { formatCurrency } from "../../../../utils/formats";
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import {type DateRange} from '../../../domain/types/salesTypes';

import {
    fullScreenCenter, backButtonStyle, filterBadge, filterContainer,
    kpiGrid, kpiLabel, cardStyle, accentText, rankingGrid, rankingTitle,
    listItem, itemArticle, itemBadge, itemBranch
} from '../styles/Dashboard';

import { iconStyle } from '../../navigation/navigationButtons';
import { ArrowPathIcon } from "@heroicons/react/24/solid";

interface Props {
    onClick: () => void;
}

function ResetButton({ onClick }: Props) {
    return (
        <button
            onClick={onClick}
            style={navButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#252a33'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1A1D23'}
        >
            <ArrowPathIcon style={iconStyle} /> 
        </button>
    )
}

export default function SalesDashboard() {
    const {
        stats, isLoading, range, setRange,
        referenceDate, handleNext, handlePrev, resetToToday
    } = useSalesReports();
    const navigate = useNavigate();

    // Helper para mostrar el nombre del periodo actual
    const getPeriodLabel = () => {
        if (range === 'today') return format(referenceDate, "EEEE d 'de' MMMM", { locale: es });
        if (range === 'week') return `Semana del ${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), "d 'de' MMM")}`;
        if (range === 'month') return format(referenceDate, "MMMM yyyy", { locale: es }).toUpperCase();
        return "";
    };

    return (
        <div style={{ padding: '40px 20px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

                {/* Header Superior */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Reporte de ventas</h2>
                        <p style={{ color: '#54C4F0', fontWeight: 600, margin: '4px 0 0 0' }}>{getPeriodLabel()}</p>
                    </div>
                    <button onClick={() => navigate('/')} style={backButtonStyle}>← Volver</button>
                </header>

                {/* Controles de Filtros y Navegación */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap' }}>

                    {/* Selector de Rango (Día/Semana/Mes) */}
                    <div style={filterContainer}>
                        {(['today', 'week', 'month'] as DateRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRange(r); resetToToday(); }}
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

                    {/* Navegación Temporal (Flechas) */}
                    <div style={filterContainer}>
                        <button onClick={handlePrev} style={navButtonStyle}>◀</button>
                        <ResetButton onClick={() => resetToToday()} />
                        <button onClick={handleNext} style={navButtonStyle}>▶</button>
                    </div>
                </div>

                {/* State: Loading */}
                {isLoading && (
                    <div style={fullScreenCenter}>
                        <div style={{ fontSize: '1.2rem', color: '#54C4F0' }}>
                            Cargando métricas de Feli App...
                        </div>
                    </div>
                )}

                {/* State: No Data */}
                {!isLoading && !stats && (
                    <div style={fullScreenCenter}>
                        <p>No hay datos para mostrar en este período.</p>
                        <button onClick={() => navigate('/')} style={backButtonStyle}>Volver al POS</button>
                    </div>
                )}

                {/* State: Success - Render de Métricas */}
                {!isLoading && stats && (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
}

const navButtonStyle: React.CSSProperties = {
    backgroundColor: '#1A1D23',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem'
};

// const todayButtonStyle: React.CSSProperties = {
//     backgroundColor: 'transparent',
//     border: '1px solid #54C4F0',
//     color: '#54C4F0',
//     padding: '8px 16px',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     fontSize: '0.8rem',
//     fontWeight: 600
// };