import { useEffect } from 'react';
import { EMPRESA } from './config';

/** Fija el título de la pestaña del navegador. */
export function useTitulo(titulo) {
    useEffect(() => {
        document.title = `${titulo} · ${EMPRESA}`;
    }, [titulo]);
}
