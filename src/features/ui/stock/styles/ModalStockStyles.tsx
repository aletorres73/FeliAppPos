export const modalStyles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 17, 21, 0.85)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 200, backdropFilter: 'blur(4px)',
    },
    content: {
        backgroundColor: '#161920',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '540px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        textAlign: 'left'
    },
    title: { margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 600, color: 'white', letterSpacing: '-0.3px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    row: {
        display: 'flex',
        gap: '16px',
        width: '100%', // Asegura que la fila use todo el ancho de la modal
        boxSizing: 'border-box'
    },
    label: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px' },
    input: {
        backgroundColor: '#1A1D23',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '12px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '0.9rem',
        outline: 'none',

        // --- AQUÍ ESTÁ EL FIX PARA EL DESBORDAMIENTO ---
        width: '100%',
        boxSizing: 'border-box',
        minWidth: '0', // Permite que el input se encoja correctamente en flexbox
    },
    checkboxRow: {
        display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0', padding: '14px',
        backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)'
    },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' },
    checkbox: { width: '16px', height: '16px', accentColor: '#54C4F0', cursor: 'pointer' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px' },
    cancelButton: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', padding: '12px 20px' },
    submitButton: { backgroundColor: '#54C4F0', color: '#0F1115', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }
};