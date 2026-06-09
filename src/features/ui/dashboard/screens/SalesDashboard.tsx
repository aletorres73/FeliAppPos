import { useState, useMemo } from 'react';
import { useSalesReports } from '../hooks/useSalesReports';
import { formatCurrency } from "../../../domain/utils/formats";
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import {
    fullScreenCenter, backButtonStyle,
    kpiGrid, kpiLabel, cardStyle, accentText
} from '../styles/Dashboard';

import { RangeSelector } from '../components/Common';

const tableHeaderStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '2px solid #2A2D35',
    color: '#8A9099',
    fontSize: '0.9rem',
    cursor: 'pointer',
    userSelect: 'none'
};

const tableRowStyle: React.CSSProperties = {
    borderBottom: '1px solid #1F2229',
};

const tableCellStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '0.95rem',
    color: '#E2E8F0',
    textAlign: 'left'
};

// Estilo para la barra de búsqueda
const searchInputStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '300px',
    padding: '10px 16px',
    borderRadius: '6px',
    border: '1px solid #2A2D35',
    backgroundColor: '#161920',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
};

type SortCriteria = 'units' | 'revenue';

export default function SalesDashboard() {
    const {
        stats, isLoading, range, setRange,
        referenceDate, handleNext, handlePrev, resetToToday
    } = useSalesReports();

    const navigate = useNavigate();
    
    const [sortBy, setSortBy] = useState<SortCriteria>('units');
    // Estado para capturar la búsqueda del usuario
    const [searchTerm, setSearchTerm] = useState<string>('');

    const HandleSetRange = (newRange: typeof range) => {
        setRange(newRange);
        resetToToday();
    }

    const getPeriodLabel = () => {
        if (range === 'today') return format(referenceDate, "EEEE d 'de' MMMM", { locale: es });
        if (range === 'week') return `Semana del ${format(startOfWeek(referenceDate, { weekStartsOn: 1 }), "d 'de' MMM")}`;
        if (range === 'month') return format(referenceDate, "MMMM yyyy", { locale: es }).toUpperCase();
        return "";
    };

    // Filtramos y luego ordenamos la lista basándonos en la búsqueda y los criterios
    const filteredAndOrderedProducts = useMemo(() => {
        if (!stats?.products) return [];

        // 1. Filtrar por término de búsqueda (coincidencia en Artículo o Marca)
        const filtered = stats.products.filter(product => {
            const articleMatch = product.article?.toLowerCase().includes(searchTerm.toLowerCase());
            const brandMatch = product.branch?.toLowerCase().includes(searchTerm.toLowerCase());
            return articleMatch || brandMatch;
        });

        // 2. Ordenar la lista resultante
        return filtered.sort((a, b) => {
            if (sortBy === 'revenue') {
                return b.total - a.total; 
            }
            return b.quantity - a.quantity; 
        });
    }, [stats?.products, sortBy, searchTerm]);

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
                <RangeSelector
                    onClick={HandleSetRange}
                    range={range}
                    resetToToday={resetToToday}
                    handlePrev={handlePrev}
                    handleNext={handleNext}
                />

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

                {/* State: Success */}
                {!isLoading && stats && (
                    <>
                        {/* KPIs Financieros */}
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
                                <span style={{ ...kpiLabel }}>Transferencias</span>
                                <span style={{ ...accentText, color: '#9C27B0' }}>{formatCurrency(stats.periodTransfer)}</span>
                            </div>
                            <div style={cardStyle}>
                                <span style={kpiLabel}>Deuda Pendiente</span>
                                <span style={{ ...accentText, color: '#FF5252' }}>{formatCurrency(stats.pendingCollect)}</span>
                            </div>
                        </div>

                        {/* Contenedor Principal de la Tabla */}
                        <div style={{ ...cardStyle, marginTop: '24px', padding: '24px', overflowX: 'auto' }}>
                            
                            {/* Header de la Tabla + Buscador */}
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                flexWrap: 'wrap',
                                gap: '16px',
                                marginBottom: '20px' 
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 550 }}>📦 Rendimiento por Producto</h3>
                                </div>
                                
                                {/* Input de Búsqueda */}
                                <input 
                                    type="text"
                                    placeholder="🔍 Buscar producto o marca..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={searchInputStyle}
                                    onFocus={(e) => e.target.style.borderColor = '#54C4F0'}
                                    onBlur={(e) => e.target.style.borderColor = '#2A2D35'}
                                />
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {/* Encabezado del Ranking */}
                                        <th style={{ ...tableHeaderStyle, width: '50px', cursor: 'default' }}>#</th>
                                        <th style={tableHeaderStyle}>Artículo</th>
                                        <th style={tableHeaderStyle}>Marca</th>
                                        <th 
                                            style={{ ...tableHeaderStyle, color: sortBy === 'units' ? '#54C4F0' : '#8A9099' }}
                                            onClick={() => setSortBy('units')}
                                        >
                                            Volumen Vendido {sortBy === 'units' ? '▼' : '↕'}
                                        </th>
                                        <th 
                                            style={{ ...tableHeaderStyle, color: sortBy === 'revenue' ? '#54C4F0' : '#8A9099' }}
                                            onClick={() => setSortBy('revenue')}
                                        >
                                            Facturación {sortBy === 'revenue' ? '▼' : '↕'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndOrderedProducts.map((product, idx) => {
                                        const isWeight = product.quantity % 1 !== 0;
                                        const unitLabel = isWeight ? 'kg' : 'ud.';
                                        const formattedQuantity = isWeight ? product.quantity.toFixed(3) : product.quantity.toFixed(0);

                                        return (
                                            <tr key={`prod-${idx}`} style={tableRowStyle}>
                                                {/* Número del Ranking */}
                                                <td style={{ ...tableCellStyle, color: '#54C4F0', fontWeight: 600, width: '50px' }}>
                                                    {idx + 1}
                                                </td>
                                                <td style={{ ...tableCellStyle, fontWeight: 500 }}>{product.article}</td>
                                                <td style={{ ...tableCellStyle, color: '#A0AEC0', fontSize: '0.85rem' }}>
                                                    {product.branch || 'Sin marca'}
                                                </td>
                                                <td style={tableCellStyle}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: isWeight ? 'rgba(255, 171, 64, 0.1)' : 'rgba(84, 196, 240, 0.1)',
                                                        color: isWeight ? '#FFAB40' : '#54C4F0',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        display: 'inline-block'
                                                    }}>
                                                        {formattedQuantity} {unitLabel}
                                                    </span>
                                                </td>
                                                <td style={{ ...tableCellStyle, fontWeight: 600, color: '#4CAF50' }}>
                                                    {formatCurrency(product.total)}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Caso de Búsqueda Vacía */}
                                    {filteredAndOrderedProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ ...tableCellStyle, textAlign: 'center', padding: '32px', color: '#8A9099' }}>
                                                No se encontraron productos que coincidan con "{searchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}