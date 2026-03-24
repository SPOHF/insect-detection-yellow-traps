import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function ProtectedRoute({ children }) {
    const { token, isLoading } = useAuth();
    if (isLoading) {
        return _jsx("div", { className: "page", children: _jsx("div", { className: "card", children: "Loading..." }) });
    }
    if (!token) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return children;
}
