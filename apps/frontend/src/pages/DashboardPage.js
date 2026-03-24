import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import FieldMapManager from '../components/FieldMapManager';
import { useAuth } from '../context/AuthContext';
function SimpleBarChart({ title, labels, values, xLabel, yLabel, color = '#0f5f8d', }) {
    const width = 720;
    const height = 280;
    const margin = { top: 16, right: 16, bottom: 52, left: 56 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const rawMin = values.length > 0 ? Math.min(...values) : 0;
    const rawMax = values.length > 0 ? Math.max(...values) : 1;
    const span = Math.max(rawMax - rawMin, 1e-6);
    const pad = span * 0.08;
    let domainMin = rawMin - pad;
    let domainMax = rawMax + pad;
    if (domainMin === domainMax) {
        domainMin -= 1;
        domainMax += 1;
    }
    const includesZero = domainMin <= 0 && domainMax >= 0;
    const yFor = (v) => margin.top + ((domainMax - v) / (domainMax - domainMin)) * innerHeight;
    const baselineY = includesZero ? yFor(0) : yFor(domainMin);
    const gap = 6;
    const barWidth = Math.max(6, innerWidth / Math.max(values.length, 1) - gap);
    const yTicks = 5;
    const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => domainMin + ((domainMax - domainMin) * i) / yTicks).reverse();
    const fmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { children: title }), _jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "line-chart", children: [tickValues.map((tick) => {
                        const y = yFor(tick);
                        return (_jsxs("g", { children: [_jsx("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, stroke: "#e2e8f0", strokeWidth: "1" }), _jsx("text", { x: margin.left - 8, y: y + 4, textAnchor: "end", fontSize: "11", fill: "#475569", children: fmt(tick) })] }, `tick-${tick}`));
                    }), _jsx("line", { x1: margin.left, y1: baselineY, x2: width - margin.right, y2: baselineY, stroke: "#64748b", strokeWidth: "1.2" }), _jsx("line", { x1: margin.left, y1: margin.top, x2: margin.left, y2: height - margin.bottom, stroke: "#64748b", strokeWidth: "1.2" }), values.map((value, idx) => {
                        const x = margin.left + idx * (barWidth + gap) + gap / 2;
                        const y = yFor(value);
                        const yNeg = baselineY;
                        const barY = Math.min(y, yNeg);
                        const barH = Math.max(2, Math.abs(y - yNeg));
                        return (_jsxs("g", { children: [_jsx("rect", { x: x, y: barY, width: barWidth, height: barH, fill: color, children: _jsx("title", { children: `${labels[idx]}: ${value.toFixed(2)}` }) }), _jsx("text", { x: x + barWidth / 2, y: height - margin.bottom + 14, textAnchor: "middle", fontSize: "10", fill: "#64748b", children: labels[idx] })] }, `${labels[idx]}-${idx}`));
                    }), _jsx("text", { x: margin.left + innerWidth / 2, y: height - 10, textAnchor: "middle", fontSize: "12", fill: "#334155", children: xLabel }), _jsx("text", { x: 14, y: margin.top + innerHeight / 2, textAnchor: "middle", transform: `rotate(-90, 14, ${margin.top + innerHeight / 2})`, fontSize: "12", fill: "#334155", children: yLabel })] })] }));
}
function SimpleLineChart({ title, labels, values, xLabel, yLabel, stroke = '#2563eb', }) {
    const width = 720;
    const height = 280;
    const margin = { top: 16, right: 16, bottom: 52, left: 56 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const rawMin = values.length > 0 ? Math.min(...values) : 0;
    const rawMax = values.length > 0 ? Math.max(...values) : 1;
    const span = Math.max(rawMax - rawMin, 1e-6);
    const pad = span * 0.08;
    let domainMin = rawMin - pad;
    let domainMax = rawMax + pad;
    if (domainMin === domainMax) {
        domainMin -= 1;
        domainMax += 1;
    }
    const xStep = values.length > 1 ? innerWidth / (values.length - 1) : 0;
    const xFor = (i) => margin.left + i * xStep;
    const yFor = (v) => margin.top + ((domainMax - v) / (domainMax - domainMin)) * innerHeight;
    const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
    const yTicks = 5;
    const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => domainMin + ((domainMax - domainMin) * i) / yTicks).reverse();
    const fmt = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
    return (_jsxs("div", { className: "card", children: [_jsx("h3", { children: title }), _jsxs("svg", { viewBox: `0 0 ${width} ${height}`, className: "line-chart", children: [tickValues.map((tick) => {
                        const y = yFor(tick);
                        return (_jsxs("g", { children: [_jsx("line", { x1: margin.left, y1: y, x2: width - margin.right, y2: y, stroke: "#e2e8f0", strokeWidth: "1" }), _jsx("text", { x: margin.left - 8, y: y + 4, textAnchor: "end", fontSize: "11", fill: "#475569", children: fmt(tick) })] }, `line-tick-${tick}`));
                    }), _jsx("line", { x1: margin.left, y1: height - margin.bottom, x2: width - margin.right, y2: height - margin.bottom, stroke: "#64748b", strokeWidth: "1.2" }), _jsx("line", { x1: margin.left, y1: margin.top, x2: margin.left, y2: height - margin.bottom, stroke: "#64748b", strokeWidth: "1.2" }), _jsx("polyline", { fill: "none", stroke: stroke, strokeWidth: "3", points: points }), values.map((v, i) => (_jsx("circle", { cx: xFor(i), cy: yFor(v), r: "3", fill: stroke, children: _jsx("title", { children: `${labels[i]}: ${v}` }) }, `pt-${i}`))), labels.map((label, i) => (_jsx("text", { x: xFor(i), y: height - margin.bottom + 14, textAnchor: "middle", fontSize: "10", fill: "#64748b", children: label }, `lbl-${label}-${i}`))), _jsx("text", { x: margin.left + innerWidth / 2, y: height - 10, textAnchor: "middle", fontSize: "12", fill: "#334155", children: xLabel }), _jsx("text", { x: 14, y: margin.top + innerHeight / 2, textAnchor: "middle", transform: `rotate(-90, 14, ${margin.top + innerHeight / 2})`, fontSize: "12", fill: "#334155", children: yLabel })] })] }));
}
const SECTION_CARDS = [
    { key: 'new-field', title: 'Create New Field', description: 'Search location, draw field boundary, and place traps.' },
    { key: 'upload', title: 'Upload Trap Images', description: 'Choose an existing field and trap, then upload images.' },
    { key: 'analytics', title: 'Monitoring Analytics', description: 'Review detections by date, field, and trap.' },
    { key: 'model', title: 'Insect Model Overview', description: 'Inspect model quality and live runtime performance metrics.' },
    { key: 'explore', title: 'Exploratory Analysis', description: 'Ask questions about your uploads and detection trends.' },
    { key: 'settings', title: 'Account Settings', description: 'View account profile and access scope.' },
];
export default function DashboardPage() {
    const { token, user, logout } = useAuth();
    const [section, setSection] = useState('home');
    const [uploads, setUploads] = useState([]);
    const [lastBatch, setLastBatch] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [modelStats, setModelStats] = useState(null);
    const [environmentOverview, setEnvironmentOverview] = useState(null);
    const [fieldOptions, setFieldOptions] = useState([]);
    const [error, setError] = useState('');
    const [selectedTrap, setSelectedTrap] = useState(null);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [preferredUploadFieldId, setPreferredUploadFieldId] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [files, setFiles] = useState(null);
    const [busy, setBusy] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatBusy, setChatBusy] = useState(false);
    const [chatFieldId, setChatFieldId] = useState('');
    const [chatRange, setChatRange] = useState('all');
    const [envBusy, setEnvBusy] = useState(false);
    const [envSyncFieldId, setEnvSyncFieldId] = useState('');
    const [timeseriesRange, setTimeseriesRange] = useState('all');
    const [timeseriesBusy, setTimeseriesBusy] = useState(false);
    const [timeseries, setTimeseries] = useState(null);
    const [chatMessages, setChatMessages] = useState([
        {
            role: 'assistant',
            text: 'Ask me anything about trap uploads, detections, fields, and trends in your current data scope.',
        },
    ]);
    const loadUploads = async () => {
        if (!token)
            return;
        const uploadRows = await apiClient.get('/api/analysis/uploads', token);
        setUploads(uploadRows);
    };
    const loadAnalytics = async () => {
        if (!token)
            return;
        const payload = await apiClient.get('/api/analytics/overview', token);
        setAnalytics(payload);
    };
    const loadModelStats = async () => {
        if (!token)
            return;
        const payload = await apiClient.get('/api/analysis/model-stats', token);
        setModelStats(payload);
    };
    const loadEnvironmentOverview = async () => {
        if (!token)
            return;
        const payload = await apiClient.get('/api/environment/overview', token);
        setEnvironmentOverview(payload);
        if (!envSyncFieldId && payload.fields.length > 0) {
            const preferred = payload.fields.find((row) => row.records > 0) ?? payload.fields[0];
            setEnvSyncFieldId(preferred.field_id);
        }
    };
    const loadFieldOptions = async () => {
        if (!token)
            return;
        const rows = await apiClient.get('/api/map/fields', token);
        setFieldOptions(rows);
        if (!chatFieldId && rows.length > 0) {
            setChatFieldId(rows[0].id);
        }
    };
    const loadFieldTimeseries = async (fieldId, range = timeseriesRange) => {
        if (!token || !fieldId)
            return;
        const query = range === 'all' ? 'all_data=true' : `weeks=${Number.parseInt(range, 10) || 10}`;
        const payload = await apiClient.get(`/api/environment/fields/${fieldId}/timeseries?${query}`, token);
        setTimeseries(payload);
    };
    useEffect(() => {
        if (!token)
            return;
        void loadUploads().catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load uploads');
        });
        void loadModelStats().catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load model stats');
        });
    }, [token]);
    useEffect(() => {
        if (section !== 'analytics' || !token)
            return;
        void Promise.all([loadAnalytics(), loadEnvironmentOverview(), loadFieldOptions()]).catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load analytics');
        });
    }, [section, token]);
    useEffect(() => {
        if (section !== 'explore' || !token)
            return;
        void loadFieldOptions().catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load fields');
        });
    }, [section, token]);
    useEffect(() => {
        if (section !== 'analytics' || !token || !envSyncFieldId)
            return;
        setTimeseriesBusy(true);
        void loadFieldTimeseries(envSyncFieldId)
            .catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load field timeseries');
        })
            .finally(() => setTimeseriesBusy(false));
    }, [section, token, envSyncFieldId, timeseriesRange]);
    useEffect(() => {
        if (section !== 'upload' || !token)
            return;
        const latestTrapUpload = uploads.find((item) => item.trap_id && item.field_id);
        if (!latestTrapUpload || !latestTrapUpload.trap_id)
            return;
        const nextFieldId = latestTrapUpload.field_id;
        setPreferredUploadFieldId(nextFieldId);
        setSelectedFieldId(nextFieldId);
        void (async () => {
            try {
                const detail = await apiClient.get(`/api/map/fields/${nextFieldId}`, token);
                const trap = detail.traps.find((item) => item.id === latestTrapUpload.trap_id) ?? null;
                setSelectedTrap(trap);
            }
            catch {
                setSelectedTrap(null);
            }
        })();
    }, [section, token, uploads]);
    const uploadBatch = async (event) => {
        event.preventDefault();
        if (!token || !files || files.length === 0) {
            setError('Select at least one image');
            return;
        }
        if (!selectedTrap || !selectedFieldId) {
            setError('Select a trap marker on the map first.');
            return;
        }
        setError('');
        setBusy(true);
        try {
            const formData = new FormData();
            formData.set('start_date', startDate);
            formData.set('end_date', endDate);
            formData.set('field_id', selectedFieldId);
            formData.set('trap_id', selectedTrap.id);
            formData.set('trap_code', selectedTrap.name);
            Array.from(files).forEach((file) => formData.append('images', file));
            const response = await apiClient.postForm('/api/analysis/upload-range', formData, token);
            setLastBatch(response);
            await loadUploads();
            if (section === 'analytics') {
                await loadAnalytics();
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
        finally {
            setBusy(false);
        }
    };
    const renderHome = () => (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Platform Home" }), _jsxs("div", { className: "home-welcome", children: [_jsxs("h3", { children: ["Welcome back, ", user?.full_name ?? 'Researcher'] }), _jsx("p", { children: "Pick a module below to continue mapping fields, uploading trap images, or reviewing model outcomes." })] }), _jsx("div", { className: "hub-grid", children: SECTION_CARDS.map((card) => (_jsxs("button", { className: "hub-card", type: "button", onClick: () => setSection(card.key), children: [_jsx("strong", { children: card.title }), _jsx("span", { children: card.description })] }, card.key))) })] }));
    const renderMapSection = (title, withUploadForm, createOnly = false) => (_jsxs(_Fragment, { children: [token ? (_jsx(FieldMapManager, { token: token, selectedTrapId: selectedTrap?.id ?? '', uploadOnly: withUploadForm, autoSelectFirstField: withUploadForm ? false : !createOnly, createOnly: createOnly, preferredFieldId: withUploadForm ? preferredUploadFieldId : null, onTrapSelect: (trap, fieldId) => {
                    setSelectedTrap(trap);
                    setSelectedFieldId(fieldId);
                } })) : null, withUploadForm ? (_jsxs("section", { className: "card", children: [_jsx("h2", { children: title }), _jsxs("p", { children: ["Active trap: ", _jsx("strong", { children: selectedTrap?.name ?? 'None selected' }), selectedTrap ? ` (${selectedTrap.id})` : ''] }), _jsxs("form", { onSubmit: uploadBatch, className: "form", children: [_jsxs("label", { children: ["Start Date", _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), required: true })] }), _jsxs("label", { children: ["End Date", _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), required: true })] }), _jsxs("label", { children: ["Images", _jsx("input", { type: "file", accept: "image/*", multiple: true, onChange: (e) => setFiles(e.target.files), required: true })] }), _jsx("button", { type: "submit", disabled: busy, children: busy ? 'Processing...' : 'Upload + Run Model' })] })] })) : null] }));
    const renderAnalytics = () => (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Analytics" }), (() => {
                const popRows = timeseries?.population_weekly ?? [];
                const weekLabels = popRows.map((row) => row.week_start.slice(5));
                const weekDetections = popRows.map((row) => row.total_population);
                let running = 0;
                const cumulative = weekDetections.map((value) => {
                    running += value;
                    return running;
                });
                const trapAvg = (analytics?.by_trap ?? []).slice(0, 10).map((row) => (row.uploads > 0 ? Number((row.detections / row.uploads).toFixed(2)) : 0));
                const periodLabel = timeseries?.all_data ? 'All-Time' : `${timeseries?.weeks ?? 10}-Week`;
                return (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["Scope: ", _jsx("strong", { children: analytics?.scope ?? '-' })] }), _jsx("p", { children: "Use the charts below to compare weekly population signals with weather and stress indicators." }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Environmental Data (Field Weather + Derived Metrics)" }), _jsxs("div", { className: "map-toolbar", children: [_jsxs("select", { value: envSyncFieldId, onChange: (event) => setEnvSyncFieldId(event.target.value), children: [_jsx("option", { value: "", children: "Select field" }), (environmentOverview?.fields ?? []).map((row) => (_jsx("option", { value: row.field_id, children: row.field_name }, row.field_id)))] }), _jsxs("select", { value: timeseriesRange, onChange: (event) => setTimeseriesRange(event.target.value), children: [_jsx("option", { value: "all", children: "All data" }), _jsx("option", { value: "4", children: "4 weeks" }), _jsx("option", { value: "10", children: "10 weeks" }), _jsx("option", { value: "26", children: "26 weeks" }), _jsx("option", { value: "52", children: "52 weeks" })] }), _jsx("button", { type: "button", disabled: !envSyncFieldId || envBusy, onClick: async () => {
                                                if (!token || !envSyncFieldId)
                                                    return;
                                                setEnvBusy(true);
                                                setError('');
                                                try {
                                                    await apiClient.post(`/api/environment/fields/${envSyncFieldId}/sync`, {}, token);
                                                    await loadEnvironmentOverview();
                                                }
                                                catch (err) {
                                                    setError(err instanceof Error ? err.message : 'Failed to sync environmental data');
                                                }
                                                finally {
                                                    setEnvBusy(false);
                                                }
                                            }, children: envBusy ? 'Syncing...' : 'Fetch / Update Environmental Data' }), _jsx("button", { type: "button", disabled: !envSyncFieldId || timeseriesBusy, onClick: async () => {
                                                if (!envSyncFieldId)
                                                    return;
                                                setTimeseriesBusy(true);
                                                try {
                                                    await loadFieldTimeseries(envSyncFieldId, timeseriesRange);
                                                }
                                                catch (err) {
                                                    setError(err instanceof Error ? err.message : 'Failed to refresh charts');
                                                }
                                                finally {
                                                    setTimeseriesBusy(false);
                                                }
                                            }, children: timeseriesBusy ? 'Loading Charts...' : 'Refresh Charts' })] }), (() => {
                                    const selected = (environmentOverview?.fields ?? []).find((row) => row.field_id === envSyncFieldId);
                                    if (!selected) {
                                        return _jsx("p", { children: "No environmental summary available for the selected field yet." });
                                    }
                                    return (_jsxs("div", { className: "grid-2", children: [_jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Field:" }), " ", selected.field_name] }), _jsxs("p", { children: [_jsx("strong", { children: "Records:" }), " ", selected.records] }), _jsxs("p", { children: [_jsx("strong", { children: "Coverage:" }), " ", selected.start_date ?? '-', " to ", selected.end_date ?? '-'] })] }), _jsxs("div", { children: [_jsxs("p", { children: [_jsx("strong", { children: "Latest day:" }), " ", selected.latest?.date ?? '-'] }), _jsxs("p", { children: [_jsx("strong", { children: "Temp:" }), " ", selected.latest?.temperature_mean_c ?? '-', " C | ", _jsx("strong", { children: "Rain:" }), ' ', selected.latest?.precipitation_mm ?? '-', " mm"] }), _jsxs("p", { children: [_jsx("strong", { children: "GDD:" }), " ", selected.latest?.gdd_base10_c ?? '-', " | ", _jsx("strong", { children: "Deficit:" }), ' ', selected.latest?.water_deficit_mm ?? '-', " mm"] })] })] }));
                                })()] }), timeseries ? (_jsxs(_Fragment, { children: [_jsx(SimpleBarChart, { title: `${periodLabel} Population (Avg per Upload) | ${timeseries.field_name}`, labels: timeseries.population_weekly.map((row) => row.week_start.slice(5)), values: timeseries.population_weekly.map((row) => row.avg_population), xLabel: "Week", yLabel: "Avg detections per upload", color: "#0f766e" }), _jsxs("div", { className: "grid-2", children: [_jsx(SimpleLineChart, { title: "Weather Trend: Weekly Average Temperature (\u00B0C)", labels: timeseries.weather_weekly.map((row) => row.week_start.slice(5)), values: timeseries.weather_weekly.map((row) => row.temp_avg), xLabel: "Week", yLabel: "Temperature (\u00B0C)", stroke: "#2563eb" }), _jsx(SimpleLineChart, { title: "Weather Trend: Weekly Rain Sum (mm)", labels: timeseries.weather_weekly.map((row) => row.week_start.slice(5)), values: timeseries.weather_weekly.map((row) => row.rain_sum), xLabel: "Week", yLabel: "Rainfall (mm)", stroke: "#0ea5e9" })] }), _jsxs("div", { className: "grid-2", children: [_jsx(SimpleLineChart, { title: "Plant Signal: Weekly GDD (base 10)", labels: timeseries.weather_weekly.map((row) => row.week_start.slice(5)), values: timeseries.weather_weekly.map((row) => row.gdd_avg), xLabel: "Week", yLabel: "GDD", stroke: "#f59e0b" }), _jsx(SimpleLineChart, { title: "Plant Signal: Weekly Water Deficit (mm)", labels: timeseries.weather_weekly.map((row) => row.week_start.slice(5)), values: timeseries.weather_weekly.map((row) => row.deficit_avg), xLabel: "Week", yLabel: "Water deficit (mm)", stroke: "#dc2626" })] }), _jsxs("div", { className: "grid-2", children: [_jsx(SimpleBarChart, { title: `${periodLabel} Upload Volume`, labels: timeseries.population_weekly.map((row) => row.week_start.slice(5)), values: timeseries.population_weekly.map((row) => row.uploads), xLabel: "Week", yLabel: "Uploads", color: "#334155" }), _jsx(SimpleLineChart, { title: "Weekly Heat Stress Index", labels: timeseries.weather_weekly.map((row) => row.week_start.slice(5)), values: timeseries.weather_weekly.map((row) => row.heat_stress_avg), xLabel: "Week", yLabel: "Heat stress (\u00B0C above threshold)", stroke: "#be123c" })] }), _jsxs("div", { className: "grid-2", children: [_jsx(SimpleBarChart, { title: `${periodLabel} Total Detections`, labels: weekLabels, values: weekDetections, xLabel: "Week", yLabel: "Total detections", color: "#4f46e5" }), _jsx(SimpleLineChart, { title: `${periodLabel} Cumulative Detections`, labels: weekLabels, values: cumulative, xLabel: "Week", yLabel: "Cumulative detections", stroke: "#7c3aed" })] }), _jsxs("div", { className: "grid-2", children: [_jsx(SimpleBarChart, { title: "Trap Comparison (Detections)", labels: (analytics?.by_trap ?? []).slice(0, 10).map((row) => row.trap_code), values: (analytics?.by_trap ?? []).slice(0, 10).map((row) => row.detections), xLabel: "Trap", yLabel: "Detections", color: "#0d9488" }), _jsx(SimpleBarChart, { title: "Trap Comparison (Avg per Upload)", labels: (analytics?.by_trap ?? []).slice(0, 10).map((row) => row.trap_code), values: trapAvg, xLabel: "Trap", yLabel: "Avg detections per upload", color: "#059669" })] })] })) : null, _jsxs("div", { className: "card", children: [_jsx("h3", { children: user?.role === 'admin' ? 'Admin Scope: all-fields' : `Scope: ${analytics?.scope ?? 'owned-fields'}` }), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { children: [_jsx("h4", { children: "Totals" }), _jsxs("p", { children: ["Uploads: ", analytics?.totals.uploads ?? 0] }), _jsxs("p", { children: ["Detections: ", analytics?.totals.detections ?? 0] }), _jsxs("p", { children: ["Avg/upload: ", analytics?.totals.avg_detection_per_upload ?? 0] })] }), _jsxs("div", { children: [_jsx("h4", { children: "Daily (latest)" }), _jsx("ul", { className: "list", children: (analytics?.daily ?? []).slice(0, 10).map((row) => (_jsxs("li", { children: [row.capture_date, ": uploads=", row.uploads, ", detections=", row.detections] }, row.capture_date))) })] })] }), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { children: [_jsx("h4", { children: "By Field" }), _jsx("ul", { className: "list", children: (analytics?.by_field ?? []).slice(0, 10).map((row) => (_jsxs("li", { children: [row.field_name, ": uploads=", row.uploads, ", detections=", row.detections] }, row.field_id))) })] }), _jsxs("div", { children: [_jsx("h4", { children: "By Trap" }), _jsx("ul", { className: "list", children: (analytics?.by_trap ?? []).slice(0, 10).map((row) => (_jsxs("li", { children: [row.trap_code, ": uploads=", row.uploads, ", detections=", row.detections] }, row.trap_code))) })] })] })] })] }));
            })()] }));
    const renderModelOverview = () => (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Insect Model Overview" }), _jsx("p", { children: "Global quality and runtime behavior of the active SWD detection model." }), _jsxs("div", { className: "grid-2", children: [_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Model Runtime" }), _jsxs("p", { children: ["Model file: ", modelStats?.model.weights_file ?? '-'] }), _jsxs("p", { children: ["Confidence threshold: ", modelStats?.model.confidence_threshold ?? '-'] }), _jsxs("p", { children: ["Inference image size: ", modelStats?.model.image_size ?? '-'] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Evaluation Quality" }), _jsxs("p", { children: ["Precision: ", modelStats?.evaluation.precision ?? '-'] }), _jsxs("p", { children: ["Recall: ", modelStats?.evaluation.recall ?? '-'] }), _jsxs("p", { children: ["mAP@50: ", modelStats?.evaluation.map50 ?? '-'] }), _jsxs("p", { children: ["mAP@50:95: ", modelStats?.evaluation.map50_95 ?? '-'] }), _jsx("p", { children: modelStats?.evaluation.notes ?? '' })] })] }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Observed Platform Performance" }), _jsxs("p", { children: ["Total uploads processed: ", modelStats?.production_observed.total_uploads ?? 0] }), _jsxs("p", { children: ["Total detections generated: ", modelStats?.production_observed.total_detections ?? 0] }), _jsxs("p", { children: ["Average upload confidence: ", modelStats?.production_observed.average_upload_confidence ?? 0] })] })] }));
    const runExploratoryChat = async (event) => {
        event.preventDefault();
        if (!token)
            return;
        if (!chatFieldId) {
            setError('Select a field first for exploratory analysis.');
            return;
        }
        const question = chatInput.trim();
        if (!question)
            return;
        setChatBusy(true);
        setError('');
        setChatMessages((prev) => [...prev, { role: 'user', text: question }]);
        setChatInput('');
        try {
            const response = await apiClient.post('/api/analysis/exploratory-report', {
                question,
                field_id: chatFieldId,
                all_data: chatRange === 'all',
                weeks: chatRange === 'all' ? undefined : Number.parseInt(chatRange, 10),
            }, token);
            const provider = response.used_openai ? 'OpenAI' : 'Local';
            const providerNote = response.provider_error ? ` (provider error: ${response.provider_error})` : '';
            const summaryLine = `Data snapshot: uploads=${response.context.totals.uploads}, detections=${response.context.totals.detections}, avg confidence=${response.context.totals.avg_confidence}`;
            const blob = new Blob([response.html], { type: 'text/html;charset=utf-8' });
            const reportHref = URL.createObjectURL(blob);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    text: `${response.answer}\n\n${summaryLine}\nSource: ${provider}${providerNote}`,
                    reportHref,
                    reportFilename: response.filename,
                },
            ]);
        }
        catch (err) {
            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', text: err instanceof Error ? err.message : 'Chat request failed.' },
            ]);
        }
        finally {
            setChatBusy(false);
        }
    };
    const renderExploratoryAnalysis = () => (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Exploratory Analysis" }), _jsx("p", { children: "Ask field-specific questions. The chatbot will analyze uploads, trap trends, and weather context for the selected field." }), _jsxs("div", { className: "card", children: [_jsx("h3", { children: "Data Chatbot" }), _jsxs("div", { className: "map-toolbar", children: [_jsxs("select", { value: chatFieldId, onChange: (e) => setChatFieldId(e.target.value), children: [_jsx("option", { value: "", children: "Select field" }), fieldOptions.map((field) => (_jsx("option", { value: field.id, children: field.name }, field.id)))] }), _jsxs("select", { value: chatRange, onChange: (e) => setChatRange(e.target.value), children: [_jsx("option", { value: "all", children: "All data" }), _jsx("option", { value: "5", children: "5 weeks" }), _jsx("option", { value: "10", children: "10 weeks" }), _jsx("option", { value: "26", children: "26 weeks" }), _jsx("option", { value: "52", children: "52 weeks" })] })] }), _jsx("div", { className: "chat-log", children: chatMessages.map((message, idx) => (_jsxs("div", { className: `chat-bubble ${message.role === 'user' ? 'chat-user' : 'chat-assistant'}`, children: [_jsxs("strong", { children: [message.role === 'user' ? 'You' : 'Assistant', ":"] }), " ", message.text, message.reportHref ? (_jsx("div", { style: { marginTop: 8 }, children: _jsx("a", { href: message.reportHref, download: message.reportFilename ?? 'exploratory-report.html', children: "Download HTML report" }) })) : null] }, `${message.role}-${idx}`))) }), _jsxs("form", { onSubmit: runExploratoryChat, className: "form", children: [_jsxs("label", { children: ["Ask a question", _jsx("input", { placeholder: "Example: Which trap had the highest detections in the last uploads?", value: chatInput, onChange: (e) => setChatInput(e.target.value) })] }), _jsx("button", { type: "submit", disabled: chatBusy, children: chatBusy ? 'Analyzing...' : 'Ask Chatbot' })] })] })] }));
    const renderSettings = () => (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Settings" }), _jsxs("p", { children: ["Name: ", user?.full_name] }), _jsxs("p", { children: ["Email: ", user?.email] }), _jsxs("p", { children: ["Role: ", user?.role] }), _jsxs("p", { children: ["Access scope: ", user?.role === 'admin' ? 'All fields/uploads/analytics' : 'Only associated fields/uploads/analytics'] })] }));
    return (_jsxs("div", { className: "page", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { children: [_jsx("h1", { children: "Spotted Wing Drosophila Monitoring Platform" }), _jsxs("p", { children: ["Logged in as ", user?.full_name, " (", user?.role, ")"] })] }), _jsxs("div", { className: "map-toolbar", children: [section !== 'home' ? (_jsx("button", { type: "button", onClick: () => setSection('home'), children: "Home" })) : null, _jsx("button", { onClick: logout, children: "Logout" })] })] }), error ? _jsx("div", { className: "error card", children: error }) : null, section === 'home' ? renderHome() : null, section === 'new-field' ? renderMapSection('Create Field Workspace', false, true) : null, section === 'upload' ? renderMapSection('Upload Trap Images to Selected Trap', true) : null, section === 'analytics' ? renderAnalytics() : null, section === 'model' ? renderModelOverview() : null, section === 'explore' ? renderExploratoryAnalysis() : null, section === 'settings' ? renderSettings() : null] }));
}
