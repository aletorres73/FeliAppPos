import { useEffect, useRef, useState } from "react";
import type { Product } from "../../../domain/types/orderTypes";

type Props = {
  onScan: (code: string) => void;
  externalValue: string;
  onChange: (val: string) => void;
  suggestions: Product[];
};

export function ScannerInput({ onScan, externalValue, onChange, suggestions }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  // 1. NUEVO: Agregamos la referencia para la lista
  const listRef = useRef<HTMLDivElement>(null); 
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // 2. NUEVO: Efecto para hacer scroll al elemento seleccionado
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        // 'nearest' hace scroll solo lo necesario para que el elemento sea visible
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleFocus = (e: MouseEvent) => {
      const isModalOpen = document.querySelector('[role="dialog"]');
      const target = e.target as HTMLElement;
      const clickedInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (!isModalOpen && !clickedInput) {
        ref.current?.focus();
      }
    };

    ref.current?.focus();
    document.addEventListener("click", handleFocus);
    return () => document.removeEventListener("click", handleFocus);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      if (e.key === "Enter" && externalValue.trim()) {
        onScan(externalValue.trim());
        onChange("");
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onScan(suggestions[selectedIndex].id);
        } else if (externalValue.trim()) {
          onScan(externalValue.trim());
        }
        onChange("");
        setSelectedIndex(-1);
        break;
      case "Escape":
        setSelectedIndex(-1);
        onChange("");
        break;
    }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      margin: "20px 0",
      position: "relative",
      width: "100%",
    }}>
      <style>{`
        .scanner-field {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          padding: 12px 16px 12px 60px;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s ease;
          width: 100%;
          max-width: 600px;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }

        .scanner-field:focus {
          border-color: #54C4F0;
          box-shadow: 0 0 15px rgba(84, 196, 240, 0.1);
        }

        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 600px;
          background: #1A1D23;
          border: 1px solid rgba(84, 196, 240, 0.3);
          border-radius: 0 0 12px 12px;
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
          margin-top: 4px;
        }

        .suggestion-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s;
        }

        .suggestion-item.active {
          background: rgba(84, 196, 240, 0.15);
          border-left: 3px solid #54C4F0;
        }
      `}</style>

      <div style={{ position: "relative", width: "100%", maxWidth: "600px" }}>
        <span style={{ 
          position: "absolute", 
          left: 20, 
          top: "50%", 
          transform: "translateY(-50%)", 
          fontSize: "1.2rem",
          color: "#54C4F0",
          zIndex: 1 
        }}>
          🔍
        </span>

        <input
          ref={ref}
          className="scanner-field"
          placeholder="Escanear código o buscar por nombre..."
          value={externalValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {suggestions.length > 0 && (
          <div className="suggestions-list" ref={listRef}>
            {suggestions.map((p, index) => (
              <div
                key={p.id}
                className={`suggestion-item ${index === selectedIndex ? 'active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault(); 
                  onScan(p.id);
                  onChange("");
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "white" }}>{p.article}</div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{p.branch}</div>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#54C4F0", fontWeight: "bold", fontSize: "0.9rem" }}>
                    ${p.price.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
                    {p.saleWeight ? `${p.weight.toFixed(3)} kg` : `${p.stock} unid.`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}