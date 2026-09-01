import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationType } from '../../../domain/types/notificationsTypes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationsScreen() {
  const { notifications, isLoading, deleteOne, clearAll, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'PRICE_UPDATE':
        return { label: 'PRECIOS', color: '#54C4F0', bg: 'rgba(84, 196, 240, 0.1)' };
      case 'DEBT_ALERT':
        return { label: 'MOROSIDAD', color: '#FFAB40', bg: 'rgba(255, 171, 64, 0.1)' };
      case 'PURCHASE_DRAFT':
        return { label: 'COMPRAS', color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.1)' };
      case 'VOLUME_DISCOUNT':
        return { label: 'OFERTA VOLUMEN', color: '#C084FC', bg: 'rgba(192, 132, 252, 0.1)' };
      default:
        return { label: 'INFO', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)' };
    }
  };

  const handleNotificationClick = (item: any) => {
    markAsRead(item.id);
    if (item.actionRoute) {
      navigate(item.actionRoute);
    }
  };

  return (
    <div style={{ padding: '36px 28px', backgroundColor: '#0F1115', minHeight: '100vh', color: 'white' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header con botón de vaciado masivo */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Centro de Notificaciones</h1>
            <p style={{ opacity: 0.5, margin: '4px 0 0', fontSize: '0.85rem' }}>
              Acciones automáticas y sugerencias del backend
            </p>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas eliminar todas las notificaciones?')) {
                  clearAll();
                }
              }}
              style={{
                backgroundColor: 'rgba(255, 82, 82, 0.1)',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                color: '#FF5252',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              Vaciar Todo
            </button>
          )}
        </header>

        {/* Estado de carga */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
            Cargando notificaciones...
          </div>
        )}

        {/* Sin notificaciones */}
        {!isLoading && notifications.length === 0 && (
          <div style={{
            backgroundColor: '#161920',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🔔</span>
            <h3 style={{ margin: 0, fontWeight: 600 }}>No hay notificaciones pendientes</h3>
            <p style={{ opacity: 0.4, fontSize: '0.85rem', marginTop: '6px' }}>
              Los avisos del sistema y las automatizaciones aparecerán aquí.
            </p>
          </div>
        )}

        {/* Lista de Notificaciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => {
            const badge = getTypeBadge(n.type);
            return (
              <div
                key={n.id}
                style={{
                  backgroundColor: '#161920',
                  border: n.read ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(84, 196, 240, 0.3)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                      {format(new Date(n.createdAt), "dd/MM/yyyy HH:mm 'hs'", { locale: es })}
                    </span>
                    {!n.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#54C4F0' }} />
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>{n.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.4 }}>{n.message}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {n.actionRoute && (
                    <button
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        backgroundColor: '#54C4F0',
                        color: '#0F1115',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Revisar
                    </button>
                  )}

                  <button
                    onClick={() => deleteOne(n.id)}
                    title="Eliminar notificación"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      padding: '4px 8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#FF5252'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}