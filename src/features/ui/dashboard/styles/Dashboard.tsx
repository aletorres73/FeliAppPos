export const kpiGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
};

export const rankingGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
};

// Mejora para las cards de KPI para que se vean como "presionables" o contenedores premium
export const cardStyle: React.CSSProperties = {
    backgroundColor: '#1A1D23',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

export const kpiLabel: React.CSSProperties = {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px',
    display: 'block'
};

export const accentText: React.CSSProperties = {
    color: '#54C4F0',
    fontSize: '1.8rem',
    fontWeight: 700,
    display: 'block'
};

export const rankingTitle: React.CSSProperties = {
    fontSize: '1.1rem',
    marginBottom: '20px',
    color: '#54C4F0',
    fontWeight: 600
};

export const listItem: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)'
};

export const itemBadge: React.CSSProperties = {
    backgroundColor: 'rgba(84, 196, 240, 0.1)',
    color: '#54C4F0',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600
};

export const itemArticle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.82)',
    marginRight: '6px'
};

export const itemBranch: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.4)',
    marginRight: '6px'
};

export const backButtonStyle: React.CSSProperties = {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: '0.2s all'
};

export const fullScreenCenter: React.CSSProperties = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1115',
    color: 'white',
    gap: '20px'
};

export const filterContainer: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    padding: '2px',
    borderRadius: '12px',
};

export const filterBadge: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
};

export const navButtonStyle: React.CSSProperties = {
    backgroundColor: '#1A1D23',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem'
};

export const navFilterStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    padding: '6px',
    borderRadius: '100px',
    width: 'fit-content'
};
