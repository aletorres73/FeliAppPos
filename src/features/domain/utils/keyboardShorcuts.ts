import { useEffect, useRef } from 'react';

type ShortcutActions = Record<string, () => void>;

export const useKeyboardShortcuts = (shortcuts: ShortcutActions) => {
    const shortcutsRef = useRef(shortcuts);
    
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // 1. Verificamos si la tecla presionada está en nuestro diccionario de atajos
            const action = shortcutsRef.current[e.key];
            if (!action) return; // Si no es un atajo, dejamos que el navegador siga su curso normal

            // 2. Si está escribiendo en el Textarea de "Comentarios", 
            // solo permitimos que funcionen Escape y Enter, bloqueando el resto (como F1, F2)
            if (e.target instanceof HTMLTextAreaElement) {
                if (e.key !== 'Escape' && e.key !== 'Enter') return;
            }

            // NOTA: Eliminamos el bloqueo de HTMLInputElement para que F1, F2 y F3 
            // funcionen perfectamente mientras el foco está en los inputs de precios.

            e.preventDefault();
            action();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);
};