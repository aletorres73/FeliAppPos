import { modalStyles } from "../../stock/styles/ModalStockStyles";

interface PaymentSelectorProps {
    cash: number;
    transfer: number;
    setCash: (value: number) => void;
    setTransfer: (value: number) => void;
}

export function PaymentModeSelector({ cash, transfer, setCash, setTransfer }: PaymentSelectorProps) {
    return (
        <>
            <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Efectivo (Nuevo pago):</label>
                <input
                    style={modalStyles.input}
                    autoFocus
                    type="number"
                    value={cash > 0 ? cash : ''}
                    onChange={(e) => setCash(Number(e.target.value) || 0)}
                />
            </div>
            <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>Transferencia (Nuevo pago):</label>
                <input
                    style={modalStyles.input}
                    type="number"
                    value={transfer > 0 ? transfer : ''}
                    onChange={(e) => setTransfer(Number(e.target.value) || 0)}
                />
            </div>
        </>
    );
}
