import { useEffect, useRef, useState } from "react"

type Props = {
  onScan: (code: string) => void
}

export function ScannerInput({ onScan }: Props) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  // Mantenemos el auto-focus profesional
  useEffect(() => {
    ref.current?.focus()
    document.addEventListener("click", () => ref.current?.focus());
  }, [])

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      margin: "20px 0",
      position: "relative" 
    }}>
      <style>{`
        .scanner-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          padding: 12px 16px 12px 60px; /* Espacio para el icono */
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          max-width: 600px;
          letter-spacing: 2px;
          font-family: monospace;
        }

        .scanner-field:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: #54C4F0; /* El mismo azul que usamos en el total */
          box-shadow: 0 0 15px rgba(84, 196, 240, 0.1);
        }

        .scanner-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.4;
          font-size: 0.85rem;
          pointer-events: none;
        }
      `}</style>

      <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
        {/* Indicador visual de escáner */}
        <span className="scanner-icon">🔍</span> 
        
        <input
          ref={ref}
          className="scanner-field"
          placeholder="Escanear código..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (value.trim()) onScan(value.trim())
              setValue("")
            }
          }}
          // Evitamos que el navegador intente autocompletar
          autoComplete="off"
        />
      </div>
    </div>
  )
}