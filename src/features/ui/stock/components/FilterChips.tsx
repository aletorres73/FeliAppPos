import { primaryButtonStyle } from "../styles/StockScreenStyles";

interface FilterChipProps {
    current: string,
    onChange: (filter: string) => void
}

export const FilterChips = ({ current, onChange }: FilterChipProps) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['all','grouped', 'promotions', 'combos'].map((filter) => (
            <button
                key={filter}
                onClick={() => onChange(filter)}
                style={{
                    ...primaryButtonStyle,
                    backgroundColor: current === filter ? '#54C4F0' : '#1C2028',
                    color: current === filter ? '#000' : '#fff'
                }}
            >
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
        default:
            return filter
    }
}