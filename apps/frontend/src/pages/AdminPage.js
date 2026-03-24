import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
export default function AdminPage() {
    const { token } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const load = async () => {
            if (!token)
                return;
            try {
                const response = await apiClient.get('/api/admin/overview', token);
                setData(response);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load admin data');
            }
        };
        void load();
    }, [token]);
    if (error) {
        return _jsx("div", { className: "card error", children: error });
    }
    if (!data) {
        return _jsx("div", { className: "card", children: "Loading admin data..." });
    }
    return (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Admin Overview" }), _jsxs("p", { children: ["Users: ", data.totals.users, " | Uploads: ", data.totals.uploads, " | Detections: ", data.totals.detections] }), _jsx("h3", { children: "Users" }), _jsx("ul", { className: "list", children: data.users.map((user) => (_jsxs("li", { children: ["#", user.id, " ", user.email, " (", user.role, ")"] }, user.id))) }), _jsx("h3", { children: "Recent Uploads" }), _jsx("ul", { className: "list", children: data.uploads.map((upload) => (_jsxs("li", { children: ["#", upload.id, " user=", upload.user_id, " field=", upload.field_id, " trap=", upload.trap_code, " trapId=", upload.trap_id ?? '-', " detections=", upload.detection_count] }, upload.id))) })] }));
}
