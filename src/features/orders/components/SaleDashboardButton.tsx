import { ChartBarIcon } from "@heroicons/react/24/solid";

interface Props {
    onClick: () => void;
}

export function SaleDashboardButton({ onClick }: Props) {
    return (
        <button
            onClick={onClick}
            style={{
                backgroundColor: '#1A1D23',
                border: '1px solid #54C4F0',
                color: '#54C4F0',
                padding: '10px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '550',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease',
                maxHeight: '40px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#252a33'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1A1D23'}
        >
            <ChartBarIcon style={{ width: '20px', height: '20px', fontSize: '10px' }} />
            Ver Reportes

        </button>
    )
}