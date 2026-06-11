// --- Estilos Minimalistas y Justificados ---
export const stockContainer: React.CSSProperties = {
  padding: '5em', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white', textAlign: 'left'
};

export const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px'
};

export const mainTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem', fontWeight: 600, margin: 0, letterSpacing: '-0.5px'
};

export const subtitleStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.4)', margin: '5px 0 0 0', fontSize: '0.85rem', textAlign: 'left'
};

export const searchInputStyle: React.CSSProperties = {
  width: '100%', maxWidth: '400px', backgroundColor: '#1A1D23', border: '1px solid rgba(255,255,255,0.1)',
  padding: '12px 16px', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', textAlign: 'left'
};

export const gridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '48px'
};

export const productCard: React.CSSProperties = {
  backgroundColor: '#1A1D23', borderRadius: '12px', padding: '24px',
  border: '1px solid rgba(255,255,255,0.03)',
  display: 'flex', flexDirection: 'column', gap: '20px',
  textAlign: 'left'
};

export const articleName: React.CSSProperties = {
  display: 'block', fontSize: '1rem', fontWeight: 200, color: 'white', textTransform: 'uppercase', marginBottom: '2px'
};

export const branchLabel: React.CSSProperties = {
  fontSize: '0.75rem', color: '#54C4F0', fontWeight: 500, letterSpacing: '0.5px'
};

export const cardBody: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left'
};

export const dataGroup: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'
};

export const labelStyle: React.CSSProperties = {
  fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.8px'
};

export const valueStyle: React.CSSProperties = {
  fontSize: '1.1rem', fontWeight: 600, textAlign: 'left'
};

export const soldValueStyle: React.CSSProperties = {
  fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500
};

export const cardFooter: React.CSSProperties = {
  display: 'flex', justifyContent: 'flex-start', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.05)',
  paddingTop: '16px', marginTop: 'auto'
};

export const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', padding: '10px 20px',
  borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', letterSpacing: '0.5px'
};

export const editAction: React.CSSProperties = {
  background: 'none', border: 'none', color: '#54C4F0', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.7rem', letterSpacing: '1px', padding: 0
};

export const deleteAction: React.CSSProperties = {
  background: 'none', border: 'none', color: '#FF5252', cursor: 'pointer',
  fontWeight: 700, fontSize: '0.7rem', letterSpacing: '1px', padding: 0, opacity: 0.8
};

export const productBadge = (active: boolean): React.CSSProperties => ({
  fontSize: '0.6rem', padding: '4px 8px', borderRadius: '4px',
  backgroundColor: active ? 'rgba(84,196,240,0.1)' : 'rgba(255,255,255,0.05)',
  color: active ? '#54C4F0' : 'rgba(255,255,255,0.3)', fontWeight: 800, border: active ? '1px solid #54C4F0' : '1px solid transparent'
});

export const loadingCenter: React.CSSProperties = {
  height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
  paddingLeft: '40px', backgroundColor: '#0F1115', color: '#54C4F0', letterSpacing: '2px'
};
export const searchContainer: React.CSSProperties = { marginBottom: '40px', textAlign: 'left' };
export const cardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
export const loadingLeft: React.CSSProperties = { height: '100vh', display: 'flex', alignItems: 'center', paddingLeft: '40px' };

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

export const listWrapperStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box'
};

export const tableHeaderStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '10px 20px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
};

export const cardContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#14171C',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    width: '100%',
    overflow: 'hidden'
};

// Generador de estilos de fila para sincronizar anchos exactos
export const rowStyle = (isParent: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: isParent ? '14px 20px' : '10px 20px',
    backgroundColor: isParent ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
    borderBottom: isParent && !isParent ? '1px solid rgba(255,255,255,0.02)' : 'none',
    transition: 'background-color 0.2s',
});

export const variationsListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    backgroundColor: '#111418'
};

export const cellValueStyle: React.CSSProperties = {
    fontSize: '0.95rem',
    color: '#FFF',
    fontWeight: '500'
};

export const subCellValueStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.6)'
};

export const variationNameStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.85rem',
    fontWeight: '500'
};

export const miniActionButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '4px'
};

export const destroyGroupButtonStyle: React.CSSProperties = {
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    color: '#FEB2B2',
    border: '1px solid rgba(229, 62, 62, 0.2)',
    padding: '6px 12px',
    fontSize: '0.7rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s'
};

export const disabledDeleteActionStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid transparent',
    cursor: 'not-allowed',
    opacity: 0.5
};

export const bulkActionBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C2028',
    border: '1px dashed #54C4F0',
    borderRadius: '6px',
    padding: '12px 20px',
    color: '#FFF',
    fontSize: '0.9rem',
};

export const bulkSelectStyle: React.CSSProperties = {
    backgroundColor: '#14171C',
    color: '#FFF',
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    outline: 'none'
};

export const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#54C4F0' // Da un color celeste al check en navegadores modernos
};