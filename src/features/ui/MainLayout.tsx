import { Outlet, useNavigate, useLocation } from "react-router-dom";
import feliLogo from "../../../src/assets/logo-feli.webp";
import { CashFlowButton, SaleDashboardButton } from "../../features/ui/navigation/navigationButtons";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber qué pantalla está activa

  // Helper para verificar la ruta activa y aplicar estilos de foco
  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={styles.dashboardLayout}>
      
      {/* SIDEBAR GLOBAL PERMANENTE */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogoWrapper}>
          <img src={feliLogo} alt="Logo" style={styles.sidebarLogo} />
          <span style={styles.sidebarBrandText}>Feli App</span>
        </div>

        <nav style={styles.sidebarNav}>
          {/* Ítem: Nueva Venta */}
          <button 
            onClick={() => navigate('/')}
            style={{ 
              ...styles.sidebarButton, 
              ...(isActive('/') ? styles.sidebarButtonActive : {}) 
            }}
          >
            🛒 Nueva Venta
          </button>
          
          <hr style={styles.divider} />
          
          {/* Sección de Reportes y Caja agrupados */}
          <div style={styles.sectionHeader}>REPORTES Y CAJA</div>
          <div style={styles.groupedButtons}>
            <CashFlowButton onClick={() => navigate('/cashflow')} />
            <SaleDashboardButton onClick={() => navigate('/reports')} />
          </div>
        </nav>
      </aside>

      {/* CONTENEDOR DINÁMICO DE LAS PANTALLAS */}
      <main style={styles.mainContent}>
        <Outlet /> 
      </main>

    </div>
  );
}

// --- Estilos Centralizados del Layout ---
const styles: Record<string, React.CSSProperties> = {
  dashboardLayout: {
    display: "flex",
    minHeight: "100vh",
    backgroundColor: "#0F1115",
    color: "white",
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#161920",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    position: "sticky",
    top: 0,
    height: "100vh",
    boxSizing: "border-box",
    zIndex: 100,
  },
  sidebarLogoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  sidebarLogo: {
    width: "40px",
    height: "40px",
    objectFit: "contain",
    borderRadius: "8px",
  },
  sidebarBrandText: {
    fontSize: "1.15rem",
    fontWeight: 600,
    color: "#54C4F0",
  },
  sidebarNav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  sidebarButton: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    textAlign: "left",
    fontSize: "0.95rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  sidebarButtonActive: {
    background: "rgba(84, 196, 240, 0.1)",
    color: "#54C4F0",
    fontWeight: 600,
  },
  divider: {
    border: "none",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    margin: "8px 0",
  },
  sectionHeader: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.05em",
    marginBottom: "8px",
    paddingLeft: "16px",
  },
  groupedButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "0 8px",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto",
  }
};