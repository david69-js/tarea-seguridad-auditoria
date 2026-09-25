import { useEffect } from 'react';

/** Fija el título de la pestaña del navegador. */
export function useTitulo(titulo) {
    useEffect(() => {
        document.title = `${titulo} · POS Librería`;
    }, [titulo]);
}
