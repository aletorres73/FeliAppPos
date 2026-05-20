import { filterBadge, filterContainer, navButtonStyle, navFilterStyle } from '../styles/Dashboard';
import { iconStyle } from '../../navigation/navigationButtons';
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import type { DateRange } from '../../../domain/types/salesTypes';


interface PropResetButton { onClick: () => void }
function ResetButton({ onClick }: PropResetButton) {
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

interface PropRangeSelector {
    onClick: (range: DateRange) => void;
    range: DateRange;
    resetToToday: () => void;
    handlePrev: () => void;
    handleNext: () => void;
}
export function RangeSelector(
    {
        onClick,
        range,
        resetToToday,
        handlePrev,
        handleNext }
        : PropRangeSelector
) {
    return (
        <>
            {/* Selector de Rango (Día/Semana/Mes) */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>

                <nav style={navFilterStyle}>
                    {(['today', 'week', 'month'] as DateRange[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => onClick(r)}
                            style={{
                                ...filterBadge,
                                backgroundColor: range === r ? '#54C4F0' : 'rgba(255,255,255,0.05)',
                                color: range === r ? '#0F1115' : 'white',
                                border: 'none',
                                borderRadius: '100px',
                                padding: '8px 24px'
                            }}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
                        </button>
                    ))}
                </nav>

                {/* Navegación Temporal (Flechas) */}
                <div style={filterContainer}>
                    <button onClick={handlePrev} style={navButtonStyle}>◀</button>
                    <ResetButton onClick={() => resetToToday()} />
                    <button onClick={handleNext} style={navButtonStyle}>▶</button>
                </div>
            </div>

        </>
    )
}

