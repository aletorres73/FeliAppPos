import { useNavigate } from 'react-router-dom';

import {
    fullScreenCenter, backButtonStyle, filterBadge, filterContainer,
    kpiGrid, kpiLabel, cardStyle, accentText, rankingGrid, rankingTitle,
    listItem, itemArticle, itemBadge, itemBranch

} from '../styles/Dashboard';

import { useCashflow } from '../../../domain/hook/useCashFlow';

export default function CashFlowDashboard(){
    const { stats, isLoading, range, setRange } = useCashflow();
    const navigate = useNavigate();

    if (isLoading) return (
        <div style={fullScreenCenter}>
            <div className="pulse-animation" style={{ fontSize: '1.2rem', color: '#54C4F0' }}>
                Cargando métricas de Feli App...
            </div>
        </div>
    );

    return (
        <div style={fullScreenCenter}>
            <p>No hay datos para mostrar en este período.</p>
            <button onClick={() => navigate('/')} style={backButtonStyle}>Volver al POS</button>
        </div>
    );
}