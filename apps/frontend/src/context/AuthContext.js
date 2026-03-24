import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshUser = async () => {
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }
        try {
            const profile = await apiClient.get('/api/auth/me', token);
            setUser(profile);
        }
        catch {
            setToken(null);
            setUser(null);
            localStorage.removeItem('auth_token');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        void refreshUser();
    }, [token]);
    const login = async (email, password) => {
        const tokenResponse = await apiClient.post('/api/auth/login', {
            email,
            password,
        });
        localStorage.setItem('auth_token', tokenResponse.access_token);
        setToken(tokenResponse.access_token);
    };
    const register = async (email, fullName, password) => {
        await apiClient.post('/api/auth/register', {
            email,
            full_name: fullName,
            password,
        });
        await login(email, password);
    };
    const logout = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    };
    const value = useMemo(() => ({ token, user, isLoading, login, register, logout, refreshUser }), [token, user, isLoading]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
}
