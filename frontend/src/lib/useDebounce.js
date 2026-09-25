import { useEffect, useState } from 'react';

/** Devuelve `valor` solo cuando deja de cambiar durante `ms` milisegundos. */
export function useDebounce(valor, ms = 300) {
    const [actual, setActual] = useState(valor);
    useEffect(() => {
        const t = setTimeout(() => setActual(valor), ms);
        return () => clearTimeout(t);
    }, [valor, ms]);
    return actual;
}
