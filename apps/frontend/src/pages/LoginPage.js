import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function LoginPage() {
    const { token, login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    if (token) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const onSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (isRegisterMode) {
                await register(email, fullName, password);
            }
            else {
                await login(email, password);
            }
            navigate('/');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsx("div", { className: "page auth-page", children: _jsxs("div", { className: "card auth-card", children: [_jsx("h1", { children: "Spotted Wing Drosophila Monitoring Platform" }), _jsx("p", { children: "Sign in to manage fields, upload trap images, and analyze insect detections." }), _jsxs("form", { onSubmit: onSubmit, className: "form", children: [isRegisterMode ? (_jsxs("label", { children: ["Full Name", _jsx("input", { value: fullName, onChange: (e) => setFullName(e.target.value), required: true, minLength: 2 })] })) : null, _jsxs("label", { children: ["Email", _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { children: ["Password", _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, minLength: 8 })] }), error ? _jsx("div", { className: "error", children: error }) : null, _jsx("button", { type: "submit", disabled: busy, children: busy ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Log In' })] }), _jsx("button", { className: "link-btn", onClick: () => setIsRegisterMode((v) => !v), children: isRegisterMode ? 'Have an account? Log in' : 'No account? Register' })] }) }));
}
