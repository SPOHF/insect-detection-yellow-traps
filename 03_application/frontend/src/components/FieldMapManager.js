import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents, } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../api/client';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
const cornerIcon = L.divIcon({
    className: 'map-pin map-pin-corner',
    html: '<span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});
const draftTrapIcon = L.divIcon({
    className: 'map-pin map-pin-trap-draft',
    html: '<span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});
const savedTrapIcon = L.divIcon({
    className: 'map-pin map-pin-trap-saved',
    html: '<span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});
function ClickLayer({ mode, onAddPolygonPoint, onAddTrapPoint, }) {
    useMapEvents({
        click: (event) => {
            const point = { lat: event.latlng.lat, lng: event.latlng.lng };
            if (mode === 'draw') {
                onAddPolygonPoint(point);
            }
            if (mode === 'trap') {
                onAddTrapPoint(point);
            }
        },
    });
    return null;
}
function Recenter({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView([center.lat, center.lng]);
    }, [center.lat, center.lng, map]);
    return null;
}
export default function FieldMapManager({ token, selectedTrapId, onTrapSelect, uploadOnly = false, autoSelectFirstField = true, createOnly = false, preferredFieldId = null, }) {
    const [mode, setMode] = useState('none');
    const [fieldName, setFieldName] = useState('');
    const [draftPolygon, setDraftPolygon] = useState([]);
    const [draftTraps, setDraftTraps] = useState([]);
    const [polygonRedoStack, setPolygonRedoStack] = useState([]);
    const [trapRedoStack, setTrapRedoStack] = useState([]);
    const [fields, setFields] = useState([]);
    const [activeFieldId, setActiveFieldId] = useState('');
    const [activeField, setActiveField] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [mapCenter, setMapCenter] = useState({ lat: 52.1326, lng: 5.2913 });
    const [error, setError] = useState('');
    const [renameValue, setRenameValue] = useState('');
    const [renamingBusy, setRenamingBusy] = useState(false);
    const activePolygon = useMemo(() => (activeField ? activeField.polygon : draftPolygon), [activeField, draftPolygon]);
    const loadFields = async () => {
        const summaries = await apiClient.get('/api/map/fields', token);
        setFields(summaries);
        if (!activeFieldId && summaries.length > 0 && autoSelectFirstField) {
            setActiveFieldId(summaries[0].id);
        }
    };
    useEffect(() => {
        void loadFields();
    }, [token]);
    useEffect(() => {
        if (!preferredFieldId)
            return;
        setActiveFieldId((prev) => (prev === preferredFieldId ? prev : preferredFieldId));
    }, [preferredFieldId]);
    useEffect(() => {
        if (!createOnly)
            return;
        setActiveFieldId('');
        setActiveField(null);
        setMode('draw');
        onTrapSelect(null, null);
    }, [createOnly]);
    useEffect(() => {
        if (activeFieldId) {
            let cancelled = false;
            void (async () => {
                try {
                    const detail = await apiClient.get(`/api/map/fields/${activeFieldId}`, token);
                    if (cancelled)
                        return;
                    if (activeFieldId) {
                        setActiveField(detail);
                        if (detail.polygon.length > 0) {
                            setMapCenter(detail.polygon[0]);
                        }
                    }
                }
                catch {
                    if (!cancelled) {
                        setError('Failed to load selected field');
                    }
                }
            })();
            return () => {
                cancelled = true;
            };
        }
        else {
            setActiveField(null);
        }
        onTrapSelect(null, activeFieldId || null);
    }, [activeFieldId, token]);
    const selectedTrap = useMemo(() => {
        if (!activeField || !selectedTrapId)
            return null;
        return activeField.traps.find((trap) => trap.id === selectedTrapId) ?? null;
    }, [activeField, selectedTrapId]);
    useEffect(() => {
        setRenameValue(selectedTrap?.name ?? '');
    }, [selectedTrap?.id]);
    const onSearch = async () => {
        if (searchText.trim().length < 2)
            return;
        try {
            const rows = await apiClient.get(`/api/map/search?q=${encodeURIComponent(searchText.trim())}`, token);
            setSearchResults(rows);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
        }
    };
    const startDraftField = () => {
        if (uploadOnly) {
            return;
        }
        setActiveFieldId('');
        setActiveField(null);
        setDraftPolygon([]);
        setDraftTraps([]);
        setPolygonRedoStack([]);
        setTrapRedoStack([]);
        onTrapSelect(null, null);
        setMode('draw');
    };
    const undoLastCorner = () => {
        setDraftPolygon((prev) => {
            if (prev.length === 0)
                return prev;
            setPolygonRedoStack((redo) => [...redo, prev[prev.length - 1]]);
            return prev.slice(0, -1);
        });
    };
    const undoLastTrap = () => {
        setDraftTraps((prev) => {
            if (prev.length === 0)
                return prev;
            setTrapRedoStack((redo) => [...redo, prev[prev.length - 1]]);
            return prev.slice(0, -1);
        });
    };
    const redoCorner = () => {
        setPolygonRedoStack((prev) => {
            if (prev.length === 0)
                return prev;
            const restored = prev[prev.length - 1];
            setDraftPolygon((poly) => [...poly, restored]);
            return prev.slice(0, -1);
        });
    };
    const redoTrap = () => {
        setTrapRedoStack((prev) => {
            if (prev.length === 0)
                return prev;
            const restored = prev[prev.length - 1];
            setDraftTraps((traps) => [...traps, restored]);
            return prev.slice(0, -1);
        });
    };
    const clearDraft = () => {
        setDraftPolygon([]);
        setDraftTraps([]);
        setPolygonRedoStack([]);
        setTrapRedoStack([]);
        onTrapSelect(null, null);
    };
    const saveField = async () => {
        if (uploadOnly) {
            return;
        }
        setError('');
        if (draftPolygon.length < 3) {
            setError('Draw a polygon with at least 3 points.');
            return;
        }
        if (fieldName.trim().length < 2) {
            setError('Field name is required.');
            return;
        }
        try {
            const created = await apiClient.post('/api/map/fields', {
                name: fieldName.trim(),
                polygon: draftPolygon,
                traps: draftTraps,
            }, token);
            setDraftPolygon([]);
            setDraftTraps([]);
            setMode('none');
            setFieldName('');
            await loadFields();
            setActiveFieldId(created.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Field save failed');
        }
    };
    const addTrapToActiveField = async (point) => {
        if (!activeFieldId)
            return;
        try {
            const detail = await apiClient.post(`/api/map/fields/${activeFieldId}/traps`, point, token);
            setActiveField(detail);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add trap');
        }
    };
    const renameSelectedTrap = async () => {
        if (!activeFieldId || !selectedTrap) {
            setError('Select a trap first.');
            return;
        }
        const nextName = renameValue.trim();
        if (!nextName) {
            setError('Trap name cannot be empty.');
            return;
        }
        setError('');
        setRenamingBusy(true);
        try {
            const detail = await apiClient.patch(`/api/map/fields/${activeFieldId}/traps/${selectedTrap.id}`, { name: nextName }, token);
            setActiveField(detail);
            const refreshedTrap = detail.traps.find((item) => item.id === selectedTrap.id) ?? null;
            onTrapSelect(refreshedTrap, activeFieldId);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rename trap');
        }
        finally {
            setRenamingBusy(false);
        }
    };
    const onMapTrapClick = (trap) => {
        onTrapSelect(trap, activeField?.id ?? null);
    };
    return (_jsxs("section", { className: "card", children: [_jsx("h2", { children: "Field Map & Trap Placement" }), _jsx("p", { children: uploadOnly
                    ? 'Select an existing field and trap marker, then upload images to that exact trap.'
                    : 'Search farm, draw field polygon, place traps, then click a trap to upload images to that exact point.' }), !uploadOnly && searchResults.length > 0 ? (_jsx("ul", { className: "list", children: searchResults.map((result, idx) => (_jsx("li", { children: _jsx("button", { type: "button", onClick: () => setMapCenter({ lat: result.lat, lng: result.lng }), children: result.display_name }) }, `${result.display_name}-${idx}`))) })) : null, error ? _jsx("div", { className: "error", children: error }) : null, mode === 'draw' ? (_jsxs("p", { children: ["Draw mode active: click map to add field corners. Current points: ", _jsx("strong", { children: draftPolygon.length })] })) : null, !uploadOnly ? (_jsxs("div", { className: "map-toolbar", children: [_jsx("input", { placeholder: "Search farm location", value: searchText, onChange: (event) => setSearchText(event.target.value) }), _jsx("button", { type: "button", onClick: onSearch, children: "Search" })] })) : null, !createOnly ? (_jsxs("div", { className: "map-toolbar", children: [_jsxs("select", { value: activeFieldId, onChange: (event) => setActiveFieldId(event.target.value), children: [_jsx("option", { value: "", children: uploadOnly ? 'Select existing field' : 'Draft mode (new field)' }), fields.map((field) => (_jsxs("option", { value: field.id, children: [field.name, " (", field.trap_count, " traps)"] }, field.id)))] }), !uploadOnly ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: startDraftField, children: "New Field Draft" }), !activeFieldId ? (_jsxs(_Fragment, { children: [_jsx("input", { placeholder: "New field name", value: fieldName, onChange: (event) => setFieldName(event.target.value) }), _jsx("button", { type: "button", onClick: saveField, children: "Save Field" })] })) : null] })) : null] })) : (_jsxs("div", { className: "map-toolbar", children: [_jsx("input", { placeholder: "New field name", value: fieldName, onChange: (event) => setFieldName(event.target.value) }), _jsx("button", { type: "button", onClick: saveField, children: "Save Field" })] })), _jsxs("div", { className: "map-wrap", children: [_jsx("div", { className: "map-overlay", children: _jsxs("div", { className: "map-panel map-header-main", children: [_jsxs("div", { className: "map-header-left map-menu-bar", children: [!uploadOnly ? (_jsx("button", { type: "button", className: mode === 'draw' ? 'is-active' : '', onClick: () => {
                                                if (!activeFieldId && draftPolygon.length === 0 && draftTraps.length === 0) {
                                                    startDraftField();
                                                    return;
                                                }
                                                setMode((prev) => (prev === 'draw' ? 'none' : 'draw'));
                                            }, children: "Draw Field" })) : null, !uploadOnly ? (_jsx("button", { type: "button", className: mode === 'trap' ? 'is-active' : '', onClick: () => setMode((prev) => (prev === 'trap' ? 'none' : 'trap')), children: "Place Traps" })) : (_jsx("span", { className: "map-mode-hint", children: "Select an existing trap marker" }))] }), _jsxs("div", { className: "map-header-center map-edit-bar", children: [mode === 'draw' ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: undoLastCorner, disabled: draftPolygon.length === 0, children: "Undo Corner" }), _jsx("button", { type: "button", onClick: redoCorner, disabled: polygonRedoStack.length === 0, children: "Redo Corner" }), _jsx("button", { type: "button", onClick: clearDraft, disabled: draftPolygon.length === 0 && draftTraps.length === 0, children: "Clear Draft" })] })) : null, mode === 'trap' ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: undoLastTrap, disabled: draftTraps.length === 0 || !!activeFieldId, children: "Undo Trap" }), _jsx("button", { type: "button", onClick: redoTrap, disabled: trapRedoStack.length === 0 || !!activeFieldId, children: "Redo Trap" }), _jsx("button", { type: "button", onClick: clearDraft, disabled: draftPolygon.length === 0 && draftTraps.length === 0, children: "Clear Draft" })] })) : null, mode === 'none' && !uploadOnly ? (_jsx("span", { className: "map-mode-hint", children: "Select Draw Field or Place Traps" })) : null] }), _jsx("div", { className: "map-header-right" })] }) }), _jsxs(MapContainer, { center: [mapCenter.lat, mapCenter.lng], zoom: 16, style: { height: 460, width: '100%' }, children: [_jsx(Recenter, { center: mapCenter }), _jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(ClickLayer, { mode: uploadOnly ? 'none' : mode, onAddPolygonPoint: (point) => {
                                    setDraftPolygon((prev) => [...prev, point]);
                                    setPolygonRedoStack([]);
                                }, onAddTrapPoint: (point) => {
                                    if (uploadOnly) {
                                        return;
                                    }
                                    if (activeFieldId) {
                                        void addTrapToActiveField(point);
                                    }
                                    else {
                                        if (uploadOnly) {
                                            setError('Select an existing field before placing/selecting traps.');
                                            return;
                                        }
                                        setDraftTraps((prev) => [...prev, point]);
                                        setTrapRedoStack([]);
                                    }
                                } }), activePolygon.length >= 3 ? (_jsx(Polygon, { positions: activePolygon.map((point) => [point.lat, point.lng]) })) : null, !activeField && draftPolygon.length >= 2 ? (_jsx(Polyline, { positions: draftPolygon.map((point) => [point.lat, point.lng]) })) : null, !activeField
                                ? draftPolygon.map((point, idx) => (_jsx(Marker, { position: [point.lat, point.lng], icon: cornerIcon, draggable: true, eventHandlers: {
                                        dragend: (event) => {
                                            const latlng = event.target.getLatLng();
                                            setDraftPolygon((prev) => prev.map((entry, entryIdx) => entryIdx === idx ? { lat: latlng.lat, lng: latlng.lng } : entry));
                                        },
                                    }, children: _jsxs(Popup, { children: ["Corner ", idx + 1, _jsx("br", {}), "Drag to adjust"] }) }, `draft-poly-${idx}`)))
                                : null, (activeField ? activeField.traps : []).map((trap) => (_jsxs(Marker, { position: [trap.lat, trap.lng], icon: savedTrapIcon, eventHandlers: {
                                    click: () => onMapTrapClick(trap),
                                }, children: [_jsx(Tooltip, { permanent: true, direction: "top", offset: [0, -10], opacity: 0.95, children: trap.name }), _jsxs(Popup, { children: [_jsx("strong", { children: trap.name }), _jsx("br", {}), "Grid code: ", trap.code, _jsx("br", {}), "Click marker to select this trap for upload"] })] }, trap.id))), !activeField
                                ? draftTraps.map((point, idx) => (_jsx(Marker, { position: [point.lat, point.lng], icon: draftTrapIcon, draggable: true, eventHandlers: {
                                        dragend: (event) => {
                                            const latlng = event.target.getLatLng();
                                            setDraftTraps((prev) => prev.map((entry, entryIdx) => entryIdx === idx ? { lat: latlng.lat, lng: latlng.lng } : entry));
                                        },
                                    }, children: _jsxs(Popup, { children: ["Draft trap #", idx + 1, _jsx("br", {}), "Drag to adjust"] }) }, `draft-${idx}`)))
                                : null] })] }), selectedTrap ? _jsxs("p", { children: ["Selected trap for upload: ", selectedTrap.name] }) : _jsx("p", { children: "No trap selected yet." }), selectedTrap && !uploadOnly ? (_jsxs("div", { className: "card", children: [_jsx("h3", { children: "Selected Trap" }), _jsxs("p", { children: ["Current name: ", _jsx("strong", { children: selectedTrap.name }), " (grid ", selectedTrap.code, ")"] }), _jsxs("div", { className: "form", children: [_jsxs("label", { children: ["Rename trap", _jsx("input", { value: renameValue, onChange: (event) => setRenameValue(event.target.value) })] }), _jsx("button", { type: "button", onClick: renameSelectedTrap, disabled: renamingBusy, children: renamingBusy ? 'Saving...' : 'Save Trap Name' }), _jsx("p", { children: "Renaming updates existing uploads linked to this trap automatically." })] })] })) : null] }));
}
