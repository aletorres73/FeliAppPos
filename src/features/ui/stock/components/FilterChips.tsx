import { primaryButtonStyle } from "../styles/StockScreenStyles";

interface FilterChipProps {
    current: string,
    onChange: (filter: string) => void,
    priceReviewCount?: number
}

export const FilterChips = ({ current, onChange, priceReviewCount = 0 }: FilterChipProps) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all','expiration','grouped', 'promotions', 'combos', 'slowMovers', 'priceReview'].map((filter) => (
            <button
                key={filter}
                onClick={() => onChange(filter)}
                style={{
                    ...primaryButtonStyle,
                    backgroundColor: current === filter ? '#54C4F0' : '#1C2028',
                    color: current === filter ? '#000' : '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
            >
                {filter === 'priceReview' && priceReviewCount > 0 && (
                    <span role="img" aria-label="alert" style={{ fontSize: '0.9em', lineHeight: 1 }}>⚠️</span>
                )}
                {filterName(filter)}
            </button>
        ))}
    </div>
);

function filterName(filter: string): string {
    switch (filter) {
        case 'all':
            return 'Todos';
        case 'combos':
            return 'Combos';
        case 'promotions':
            return 'Promociones';
        case 'grouped':
            return 'Grupos'
        case 'expiration':
            return 'Vencimientos'
        case 'slowMovers':
            return 'Baja Rotación';
        case 'priceReview':
            return 'Precios por revisar';
        default:
            return filter
    }
}