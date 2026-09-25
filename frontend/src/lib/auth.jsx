import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

/* =====================================================================
 *  Sesion del usuario. La fuente de verdad es la cookie de sesion de PHP:
 *  al cargar se pregunta a /api/auth/me quien es el usuario, y el rol que
 *  se guarda aqui solo sirve para mostrar u ocultar botones. Los permisos
 *  reales los sigue comprobando el servidor en cada endpoint.
 * ===================================================================== */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // undefined = todavia no se sabe; null = sin sesion.
    const [user, setUser] = useState(undefined);

    useEffect(() => {
        api('/api/auth/me').then((res) => setUser(res.ok ? res.data : null));

        const expirada = () => setUser(null);
        window.addEventListener('sesion-expirada', expirada);
        return () => window.removeEventListener('sesion-expirada', expirada);
    }, []);

    const login = useCallback(async (correo, password) => {
        const res = await api('/api/auth/login', { method: 'POST', body: { correo, password } });
        if (res.ok) setUser(res.data);
        return res;
    }, []);

    const logout = useCallback(async () => {
        await api('/api/auth/logout', { method: 'POST' });
        setUser(null);
    }, []);

    const valor = {
        user,
        cargando: user === undefined,
        esAdmin: user?.rol === 'admin',
        login,
        logout,
        setUser,
    };

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
