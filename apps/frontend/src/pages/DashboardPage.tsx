import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import FieldMapManager from '../components/FieldMapManager';
import { useAuth } from '../context/AuthContext';
import type {
  AnalyticsOverview,
  EnvironmentOverview,
  ExploratoryReportResponse,
  FieldMapSummary,
  FieldTimeseries,
  FieldMapDetail,
  ModelStats,
  TrapPoint,
  UploadBatchResponse,
  UploadSummary,
} from '../types/api';

function SimpleBarChart({
  title,
  labels,
  values,
  xLabel,
  yLabel,
  color = '#0f5f8d',
}: {
  title: string;
  labels: string[];
  values: number[];
  xLabel: string;
  yLabel: string;
  color?: string;
}) {
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
  const yFor = (v: number) => margin.top + ((domainMax - v) / (domainMax - domainMin)) * innerHeight;
  const baselineY = includesZero ? yFor(0) : yFor(domainMin);
  const gap = 6;
  const barWidth = Math.max(6, innerWidth / Math.max(values.length, 1) - gap);
  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => domainMin + ((domainMax - domainMin) * i) / yTicks).reverse();
  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));

  return (
    <div className="card">
      <h3>{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {tickValues.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={`tick-${tick}`}>
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={margin.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#475569">
                {fmt(tick)}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} y1={baselineY} x2={width - margin.right} y2={baselineY} stroke="#64748b" strokeWidth="1.2" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#64748b" strokeWidth="1.2" />
        {values.map((value, idx) => {
          const x = margin.left + idx * (barWidth + gap) + gap / 2;
          const y = yFor(value);
          const yNeg = baselineY;
          const barY = Math.min(y, yNeg);
          const barH = Math.max(2, Math.abs(y - yNeg));
          return (
            <g key={`${labels[idx]}-${idx}`}>
              <rect x={x} y={barY} width={barWidth} height={barH} fill={color}>
                <title>{`${labels[idx]}: ${value.toFixed(2)}`}</title>
              </rect>
              <text x={x + barWidth / 2} y={height - margin.bottom + 14} textAnchor="middle" fontSize="10" fill="#64748b">
                {labels[idx]}
              </text>
            </g>
          );
        })}
        <text x={margin.left + innerWidth / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#334155">
          {xLabel}
        </text>
        <text
          x={14}
          y={margin.top + innerHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 14, ${margin.top + innerHeight / 2})`}
          fontSize="12"
          fill="#334155"
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}

function SimpleLineChart({
  title,
  labels,
  values,
  xLabel,
  yLabel,
  stroke = '#2563eb',
}: {
  title: string;
  labels: string[];
  values: number[];
  xLabel: string;
  yLabel: string;
  stroke?: string;
}) {
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
  const xFor = (i: number) => margin.left + i * xStep;
  const yFor = (v: number) => margin.top + ((domainMax - v) / (domainMax - domainMin)) * innerHeight;
  const points = values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => domainMin + ((domainMax - domainMin) * i) / yTicks).reverse();
  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
  return (
    <div className="card">
      <h3>{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
        {tickValues.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={`line-tick-${tick}`}>
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={margin.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#475569">
                {fmt(tick)}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="#64748b" strokeWidth="1.2" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#64748b" strokeWidth="1.2" />
        <polyline fill="none" stroke={stroke} strokeWidth="3" points={points} />
        {values.map((v, i) => (
          <circle key={`pt-${i}`} cx={xFor(i)} cy={yFor(v)} r="3" fill={stroke}>
            <title>{`${labels[i]}: ${v}`}</title>
          </circle>
        ))}
        {labels.map((label, i) => (
          <text key={`lbl-${label}-${i}`} x={xFor(i)} y={height - margin.bottom + 14} textAnchor="middle" fontSize="10" fill="#64748b">
            {label}
          </text>
        ))}
        <text x={margin.left + innerWidth / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#334155">
          {xLabel}
        </text>
        <text
          x={14}
          y={margin.top + innerHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 14, ${margin.top + innerHeight / 2})`}
          fontSize="12"
          fill="#334155"
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
}

type SectionKey = 'home' | 'new-field' | 'upload' | 'analytics' | 'model' | 'explore' | 'settings';

const SECTION_CARDS: Array<{ key: SectionKey; title: string; description: string }> = [
  { key: 'new-field', title: 'Create New Field', description: 'Search location, draw field boundary, and place traps.' },
  { key: 'upload', title: 'Upload Trap Images', description: 'Choose an existing field and trap, then upload images.' },
  { key: 'analytics', title: 'Monitoring Analytics', description: 'Review detections by date, field, and trap.' },
  { key: 'model', title: 'Insect Model Overview', description: 'Inspect model quality and live runtime performance metrics.' },
  { key: 'explore', title: 'Exploratory Analysis', description: 'Ask questions about your uploads and detection trends.' },
  { key: 'settings', title: 'Account Settings', description: 'View account profile and access scope.' },
];

export default function DashboardPage() {
  const { token, user, logout } = useAuth();

  const [section, setSection] = useState<SectionKey>('home');
  const [uploads, setUploads] = useState<UploadSummary[]>([]);
  const [lastBatch, setLastBatch] = useState<UploadBatchResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [environmentOverview, setEnvironmentOverview] = useState<EnvironmentOverview | null>(null);
  const [fieldOptions, setFieldOptions] = useState<FieldMapSummary[]>([]);
  const [error, setError] = useState('');

  const [selectedTrap, setSelectedTrap] = useState<TrapPoint | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [preferredUploadFieldId, setPreferredUploadFieldId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatFieldId, setChatFieldId] = useState('');
  const [chatRange, setChatRange] = useState<string>('all');
  const [envBusy, setEnvBusy] = useState(false);
  const [envSyncFieldId, setEnvSyncFieldId] = useState('');
  const [timeseriesRange, setTimeseriesRange] = useState<string>('all');
  const [timeseriesBusy, setTimeseriesBusy] = useState(false);
  const [timeseries, setTimeseries] = useState<FieldTimeseries | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; reportHref?: string; reportFilename?: string }>
  >([
    {
      role: 'assistant',
      text: 'Ask me anything about trap uploads, detections, fields, and trends in your current data scope.',
    },
  ]);

  const loadUploads = async () => {
    if (!token) return;
    const uploadRows = await apiClient.get<UploadSummary[]>('/api/analysis/uploads', token);
    setUploads(uploadRows);
  };

  const loadAnalytics = async () => {
    if (!token) return;
    const payload = await apiClient.get<AnalyticsOverview>('/api/analytics/overview', token);
    setAnalytics(payload);
  };

  const loadModelStats = async () => {
    if (!token) return;
    const payload = await apiClient.get<ModelStats>('/api/analysis/model-stats', token);
    setModelStats(payload);
  };

  const loadEnvironmentOverview = async () => {
    if (!token) return;
    const payload = await apiClient.get<EnvironmentOverview>('/api/environment/overview', token);
    setEnvironmentOverview(payload);
    if (!envSyncFieldId && payload.fields.length > 0) {
      const preferred = payload.fields.find((row) => row.records > 0) ?? payload.fields[0];
      setEnvSyncFieldId(preferred.field_id);
    }
  };

  const loadFieldOptions = async () => {
    if (!token) return;
    const rows = await apiClient.get<FieldMapSummary[]>('/api/map/fields', token);
    setFieldOptions(rows);
    if (!chatFieldId && rows.length > 0) {
      setChatFieldId(rows[0].id);
    }
  };

  const loadFieldTimeseries = async (fieldId: string, range: string = timeseriesRange) => {
    if (!token || !fieldId) return;
    const query = range === 'all' ? 'all_data=true' : `weeks=${Number.parseInt(range, 10) || 10}`;
    const payload = await apiClient.get<FieldTimeseries>(`/api/environment/fields/${fieldId}/timeseries?${query}`, token);
    setTimeseries(payload);
  };

  useEffect(() => {
    if (!token) return;
    void loadUploads().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load uploads');
    });
    void loadModelStats().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load model stats');
    });
  }, [token]);

  useEffect(() => {
    if (section !== 'analytics' || !token) return;
    void Promise.all([loadAnalytics(), loadEnvironmentOverview(), loadFieldOptions()]).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    });
  }, [section, token]);

  useEffect(() => {
    if (section !== 'explore' || !token) return;
    void loadFieldOptions().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    });
  }, [section, token]);

  useEffect(() => {
    if (section !== 'analytics' || !token || !envSyncFieldId) return;
    setTimeseriesBusy(true);
    void loadFieldTimeseries(envSyncFieldId)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load field timeseries');
      })
      .finally(() => setTimeseriesBusy(false));
  }, [section, token, envSyncFieldId, timeseriesRange]);

  useEffect(() => {
    if (section !== 'upload' || !token) return;

    const latestTrapUpload = uploads.find((item) => item.trap_id && item.field_id);
    if (!latestTrapUpload || !latestTrapUpload.trap_id) return;

    const nextFieldId = latestTrapUpload.field_id;
    setPreferredUploadFieldId(nextFieldId);
    setSelectedFieldId(nextFieldId);

    void (async () => {
      try {
        const detail = await apiClient.get<FieldMapDetail>(`/api/map/fields/${nextFieldId}`, token);
        const trap = detail.traps.find((item) => item.id === latestTrapUpload.trap_id) ?? null;
        setSelectedTrap(trap);
      } catch {
        setSelectedTrap(null);
      }
    })();
  }, [section, token, uploads]);

  const uploadBatch = async (event: React.FormEvent) => {
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

      const response = await apiClient.postForm<UploadBatchResponse>('/api/analysis/upload-range', formData, token);
      setLastBatch(response);
      await loadUploads();
      if (section === 'analytics') {
        await loadAnalytics();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const renderHome = () => (
    <section className="card">
      <h2>Platform Home</h2>
      <div className="home-welcome">
        <h3>Welcome back, {user?.full_name ?? 'Researcher'}</h3>
        <p>Pick a module below to continue mapping fields, uploading trap images, or reviewing model outcomes.</p>
      </div>
      <div className="hub-grid">
        {SECTION_CARDS.map((card) => (
          <button key={card.key} className="hub-card" type="button" onClick={() => setSection(card.key)}>
            <strong>{card.title}</strong>
            <span>{card.description}</span>
          </button>
        ))}
      </div>
    </section>
  );

  const renderMapSection = (title: string, withUploadForm: boolean, createOnly: boolean = false) => (
    <>
      {token ? (
        <FieldMapManager
          token={token}
          selectedTrapId={selectedTrap?.id ?? ''}
          uploadOnly={withUploadForm}
          autoSelectFirstField={withUploadForm ? false : !createOnly}
          createOnly={createOnly}
          preferredFieldId={withUploadForm ? preferredUploadFieldId : null}
          onTrapSelect={(trap, fieldId) => {
            setSelectedTrap(trap);
            setSelectedFieldId(fieldId);
          }}
        />
      ) : null}

      {withUploadForm ? (
        <section className="card">
          <h2>{title}</h2>
          <p>
            Active trap: <strong>{selectedTrap?.name ?? 'None selected'}</strong>
            {selectedTrap ? ` (${selectedTrap.id})` : ''}
          </p>
          <form onSubmit={uploadBatch} className="form">
            <label>
              Start Date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </label>
            <label>
              End Date
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </label>
            <label>
              Images
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} required />
            </label>
            <button type="submit" disabled={busy}>
              {busy ? 'Processing...' : 'Upload + Run Model'}
            </button>
          </form>
        </section>
      ) : null}
    </>
  );

  const renderAnalytics = () => (
    <section className="card">
      <h2>Analytics</h2>
      {(() => {
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
        return (
          <>
            <p>
              Scope: <strong>{analytics?.scope ?? '-'}</strong>
            </p>
            <p>Use the charts below to compare weekly population signals with weather and stress indicators.</p>
            <div className="card">
              <h3>Environmental Data (Field Weather + Derived Metrics)</h3>
              <div className="map-toolbar">
                <select value={envSyncFieldId} onChange={(event) => setEnvSyncFieldId(event.target.value)}>
                  <option value="">Select field</option>
                  {(environmentOverview?.fields ?? []).map((row) => (
                    <option key={row.field_id} value={row.field_id}>
                      {row.field_name}
                    </option>
                  ))}
                </select>
                <select value={timeseriesRange} onChange={(event) => setTimeseriesRange(event.target.value)}>
                  <option value="all">All data</option>
                  <option value="4">4 weeks</option>
                  <option value="10">10 weeks</option>
                  <option value="26">26 weeks</option>
                  <option value="52">52 weeks</option>
                </select>
                <button
                  type="button"
                  disabled={!envSyncFieldId || envBusy}
                  onClick={async () => {
                    if (!token || !envSyncFieldId) return;
                    setEnvBusy(true);
                    setError('');
                    try {
                      await apiClient.post(`/api/environment/fields/${envSyncFieldId}/sync`, {}, token);
                      await loadEnvironmentOverview();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to sync environmental data');
                    } finally {
                      setEnvBusy(false);
                    }
                  }}
                >
                  {envBusy ? 'Syncing...' : 'Fetch / Update Environmental Data'}
                </button>
                <button
                  type="button"
                  disabled={!envSyncFieldId || timeseriesBusy}
                  onClick={async () => {
                    if (!envSyncFieldId) return;
                    setTimeseriesBusy(true);
                    try {
                      await loadFieldTimeseries(envSyncFieldId, timeseriesRange);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to refresh charts');
                    } finally {
                      setTimeseriesBusy(false);
                    }
                  }}
                >
                  {timeseriesBusy ? 'Loading Charts...' : 'Refresh Charts'}
                </button>
              </div>
              {(() => {
                const selected = (environmentOverview?.fields ?? []).find((row) => row.field_id === envSyncFieldId);
                if (!selected) {
                  return <p>No environmental summary available for the selected field yet.</p>;
                }
                return (
                  <div className="grid-2">
                    <div>
                      <p>
                        <strong>Field:</strong> {selected.field_name}
                      </p>
                      <p>
                        <strong>Records:</strong> {selected.records}
                      </p>
                      <p>
                        <strong>Coverage:</strong> {selected.start_date ?? '-'} to {selected.end_date ?? '-'}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Latest day:</strong> {selected.latest?.date ?? '-'}
                      </p>
                      <p>
                        <strong>Temp:</strong> {selected.latest?.temperature_mean_c ?? '-'} C | <strong>Rain:</strong>{' '}
                        {selected.latest?.precipitation_mm ?? '-'} mm
                      </p>
                      <p>
                        <strong>GDD:</strong> {selected.latest?.gdd_base10_c ?? '-'} | <strong>Deficit:</strong>{' '}
                        {selected.latest?.water_deficit_mm ?? '-'} mm
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
            {timeseries ? (
              <>
                <SimpleBarChart
                  title={`${periodLabel} Population (Avg per Upload) | ${timeseries.field_name}`}
                  labels={timeseries.population_weekly.map((row) => row.week_start.slice(5))}
                  values={timeseries.population_weekly.map((row) => row.avg_population)}
                  xLabel="Week"
                  yLabel="Avg detections per upload"
                  color="#0f766e"
                />
                <div className="grid-2">
                  <SimpleLineChart
                    title="Weather Trend: Weekly Average Temperature (°C)"
                    labels={timeseries.weather_weekly.map((row) => row.week_start.slice(5))}
                    values={timeseries.weather_weekly.map((row) => row.temp_avg)}
                    xLabel="Week"
                    yLabel="Temperature (°C)"
                    stroke="#2563eb"
                  />
                  <SimpleLineChart
                    title="Weather Trend: Weekly Rain Sum (mm)"
                    labels={timeseries.weather_weekly.map((row) => row.week_start.slice(5))}
                    values={timeseries.weather_weekly.map((row) => row.rain_sum)}
                    xLabel="Week"
                    yLabel="Rainfall (mm)"
                    stroke="#0ea5e9"
                  />
                </div>
                <div className="grid-2">
                  <SimpleLineChart
                    title="Plant Signal: Weekly GDD (base 10)"
                    labels={timeseries.weather_weekly.map((row) => row.week_start.slice(5))}
                    values={timeseries.weather_weekly.map((row) => row.gdd_avg)}
                    xLabel="Week"
                    yLabel="GDD"
                    stroke="#f59e0b"
                  />
                  <SimpleLineChart
                    title="Plant Signal: Weekly Water Deficit (mm)"
                    labels={timeseries.weather_weekly.map((row) => row.week_start.slice(5))}
                    values={timeseries.weather_weekly.map((row) => row.deficit_avg)}
                    xLabel="Week"
                    yLabel="Water deficit (mm)"
                    stroke="#dc2626"
                  />
                </div>
                <div className="grid-2">
                  <SimpleBarChart
                    title={`${periodLabel} Upload Volume`}
                    labels={timeseries.population_weekly.map((row) => row.week_start.slice(5))}
                    values={timeseries.population_weekly.map((row) => row.uploads)}
                    xLabel="Week"
                    yLabel="Uploads"
                    color="#334155"
                  />
                  <SimpleLineChart
                    title="Weekly Heat Stress Index"
                    labels={timeseries.weather_weekly.map((row) => row.week_start.slice(5))}
                    values={timeseries.weather_weekly.map((row) => row.heat_stress_avg)}
                    xLabel="Week"
                    yLabel="Heat stress (°C above threshold)"
                    stroke="#be123c"
                  />
                </div>
                <div className="grid-2">
                  <SimpleBarChart
                    title={`${periodLabel} Total Detections`}
                    labels={weekLabels}
                    values={weekDetections}
                    xLabel="Week"
                    yLabel="Total detections"
                    color="#4f46e5"
                  />
                  <SimpleLineChart
                    title={`${periodLabel} Cumulative Detections`}
                    labels={weekLabels}
                    values={cumulative}
                    xLabel="Week"
                    yLabel="Cumulative detections"
                    stroke="#7c3aed"
                  />
                </div>
                <div className="grid-2">
                  <SimpleBarChart
                    title="Trap Comparison (Detections)"
                    labels={(analytics?.by_trap ?? []).slice(0, 10).map((row) => row.trap_code)}
                    values={(analytics?.by_trap ?? []).slice(0, 10).map((row) => row.detections)}
                    xLabel="Trap"
                    yLabel="Detections"
                    color="#0d9488"
                  />
                  <SimpleBarChart
                    title="Trap Comparison (Avg per Upload)"
                    labels={(analytics?.by_trap ?? []).slice(0, 10).map((row) => row.trap_code)}
                    values={trapAvg}
                    xLabel="Trap"
                    yLabel="Avg detections per upload"
                    color="#059669"
                  />
                </div>
              </>
            ) : null}
            <div className="card">
              <h3>{user?.role === 'admin' ? 'Admin Scope: all-fields' : `Scope: ${analytics?.scope ?? 'owned-fields'}`}</h3>
              <div className="grid-2">
                <div>
                  <h4>Totals</h4>
                  <p>Uploads: {analytics?.totals.uploads ?? 0}</p>
                  <p>Detections: {analytics?.totals.detections ?? 0}</p>
                  <p>Avg/upload: {analytics?.totals.avg_detection_per_upload ?? 0}</p>
                </div>
                <div>
                  <h4>Daily (latest)</h4>
                  <ul className="list">
                    {(analytics?.daily ?? []).slice(0, 10).map((row) => (
                      <li key={row.capture_date}>
                        {row.capture_date}: uploads={row.uploads}, detections={row.detections}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <h4>By Field</h4>
                  <ul className="list">
                    {(analytics?.by_field ?? []).slice(0, 10).map((row) => (
                      <li key={row.field_id}>
                        {row.field_name}: uploads={row.uploads}, detections={row.detections}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>By Trap</h4>
                  <ul className="list">
                    {(analytics?.by_trap ?? []).slice(0, 10).map((row) => (
                      <li key={row.trap_code}>
                        {row.trap_code}: uploads={row.uploads}, detections={row.detections}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </section>
  );

  const renderModelOverview = () => (
    <section className="card">
      <h2>Insect Model Overview</h2>
      <p>Global quality and runtime behavior of the active SWD detection model.</p>
      <div className="grid-2">
        <div className="card">
          <h3>Model Runtime</h3>
          <p>Model file: {modelStats?.model.weights_file ?? '-'}</p>
          <p>Confidence threshold: {modelStats?.model.confidence_threshold ?? '-'}</p>
          <p>Inference image size: {modelStats?.model.image_size ?? '-'}</p>
        </div>
        <div className="card">
          <h3>Evaluation Quality</h3>
          <p>Precision: {modelStats?.evaluation.precision ?? '-'}</p>
          <p>Recall: {modelStats?.evaluation.recall ?? '-'}</p>
          <p>mAP@50: {modelStats?.evaluation.map50 ?? '-'}</p>
          <p>mAP@50:95: {modelStats?.evaluation.map50_95 ?? '-'}</p>
          <p>{modelStats?.evaluation.notes ?? ''}</p>
        </div>
      </div>
      <div className="card">
        <h3>Observed Platform Performance</h3>
        <p>Total uploads processed: {modelStats?.production_observed.total_uploads ?? 0}</p>
        <p>Total detections generated: {modelStats?.production_observed.total_detections ?? 0}</p>
        <p>Average upload confidence: {modelStats?.production_observed.average_upload_confidence ?? 0}</p>
      </div>
    </section>
  );

  const runExploratoryChat = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!chatFieldId) {
      setError('Select a field first for exploratory analysis.');
      return;
    }
    const question = chatInput.trim();
    if (!question) return;

    setChatBusy(true);
    setError('');
    setChatMessages((prev) => [...prev, { role: 'user', text: question }]);
    setChatInput('');

    try {
      const response = await apiClient.post<ExploratoryReportResponse>(
        '/api/analysis/exploratory-report',
        {
          question,
          field_id: chatFieldId,
          all_data: chatRange === 'all',
          weeks: chatRange === 'all' ? undefined : Number.parseInt(chatRange, 10),
        },
        token
      );
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
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err instanceof Error ? err.message : 'Chat request failed.' },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const renderExploratoryAnalysis = () => (
    <section className="card">
      <h2>Exploratory Analysis</h2>
      <p>Ask field-specific questions. The chatbot will analyze uploads, trap trends, and weather context for the selected field.</p>
      <div className="card">
        <h3>Data Chatbot</h3>
        <div className="map-toolbar">
          <select value={chatFieldId} onChange={(e) => setChatFieldId(e.target.value)}>
            <option value="">Select field</option>
            {fieldOptions.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
          <select value={chatRange} onChange={(e) => setChatRange(e.target.value)}>
            <option value="all">All data</option>
            <option value="5">5 weeks</option>
            <option value="10">10 weeks</option>
            <option value="26">26 weeks</option>
            <option value="52">52 weeks</option>
          </select>
        </div>
        <div className="chat-log">
          {chatMessages.map((message, idx) => (
            <div key={`${message.role}-${idx}`} className={`chat-bubble ${message.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
              <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong> {message.text}
              {message.reportHref ? (
                <div style={{ marginTop: 8 }}>
                  <a href={message.reportHref} download={message.reportFilename ?? 'exploratory-report.html'}>
                    Download HTML report
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <form onSubmit={runExploratoryChat} className="form">
          <label>
            Ask a question
            <input
              placeholder="Example: Which trap had the highest detections in the last uploads?"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
          </label>
          <button type="submit" disabled={chatBusy}>
            {chatBusy ? 'Analyzing...' : 'Ask Chatbot'}
          </button>
        </form>
      </div>
    </section>
  );

  const renderSettings = () => (
    <section className="card">
      <h2>Settings</h2>
      <p>Name: {user?.full_name}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>
      <p>Access scope: {user?.role === 'admin' ? 'All fields/uploads/analytics' : 'Only associated fields/uploads/analytics'}</p>
    </section>
  );

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Spotted Wing Drosophila Monitoring Platform</h1>
          <p>
            Logged in as {user?.full_name} ({user?.role})
          </p>
        </div>
        <div className="map-toolbar">
          {section !== 'home' ? (
            <button type="button" onClick={() => setSection('home')}>
              Home
            </button>
          ) : null}
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      {error ? <div className="error card">{error}</div> : null}

      {section === 'home' ? renderHome() : null}
      {section === 'new-field' ? renderMapSection('Create Field Workspace', false, true) : null}
      {section === 'upload' ? renderMapSection('Upload Trap Images to Selected Trap', true) : null}
      {section === 'analytics' ? renderAnalytics() : null}
      {section === 'model' ? renderModelOverview() : null}
      {section === 'explore' ? renderExploratoryAnalysis() : null}
      {section === 'settings' ? renderSettings() : null}
    </div>
  );
}
