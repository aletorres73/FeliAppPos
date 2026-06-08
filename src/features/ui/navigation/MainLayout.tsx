import { useState } from "react"; // 1. Importamos useState
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import feliLogo from "../../../../src/assets/logo-feli.webp";
import { CashFlowButton, SaleDashboardButton, StockButton } from "./navigationButtons";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 2. Estado para controlar si la barra lateral está abierta
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{
      ...styles.dashboardLayout,
      ["--sidebar-width" as any]: isSidebarOpen ? "260px" : "0px"
    }}>

      {/* SIDEBAR GLOBAL PERMANENTE (Con estilos dinámicos) */}
      <aside
        style={{
          ...styles.sidebar,
          ...(!isSidebarOpen ? styles.sidebarClosed : {}) // Aplica estilos de cierre si isOpen es false
        }}
      >
        <div style={styles.sidebarLogoWrapper}>
          <div style={styles.logoAndText}>
            <img src={feliLogo} alt="Logo" style={styles.sidebarLogo} />
            <span style={styles.sidebarBrandText}>Feli App</span>
          </div>

          {/* Botón para ocultar la barra */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={styles.toggleCloseButton}
            title="Ocultar barra lateral"
          >
            ◀
          </button>
        </div>

        <nav style={styles.sidebarNav}>
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

          <div style={styles.sectionHeader}>REPORTES Y CAJA</div>
          <div style={styles.groupedButtons}>
            <CashFlowButton onClick={() => navigate('/cashflow')} />
            <SaleDashboardButton onClick={() => navigate('/reports')} />
          </div>

          <div style ={styles.sectionHeader}>INVENTARIO</div>
          <div style={styles.groupedButtons}>
            <StockButton onClick={() => navigate('/stock')} />
          </div>
        </nav>
      </aside>

      {/* CONTENEDOR DINÁMICO DE LAS PANTALLAS */}
      <main style={styles.mainContent}>

        {/* Botón para mostrar la barra (Solo visible si está oculta) */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={styles.toggleOpenButton}
            title="Mostrar barra lateral"
          >
            ☰
          </button>
        )}

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
    // Transición suave para el colapso
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  // Estilos que se inyectan cuando se oculta
  sidebarClosed: {
    width: "0px",
    padding: "24px 0px", // Mantiene el alto pero quita el ancho interno
    borderRight: "none",
    opacity: 0,
    pointerEvents: "none", // Evita que se pueda interactuar estando invisible
  },
  sidebarLogoWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "between",
    gap: "12px",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  logoAndText: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
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
    position: "relative", // Necesario para posicionar el botón de apertura
  },
  // Nuevos estilos para los botones de control
  toggleCloseButton: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "8px",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  toggleOpenButton: {
    position: "absolute",
    top: "20px",
    left: "20px",
    backgroundColor: "#161920",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#54C4F0",
    fontSize: "1.2rem",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    zIndex: 99,
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
    transition: "all 0.2s",
  }
};