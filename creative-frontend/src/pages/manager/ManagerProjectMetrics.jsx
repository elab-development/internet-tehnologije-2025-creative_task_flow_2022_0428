import React, { useEffect, useMemo, useState } from "react";
import { api, extractErrorMessage } from "../../api";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

function clamp(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function buildRows(items) {
  // Recharts voli { name, value, color }.
  return items.map((it) => ({
    name: it.label,
    value: clamp(it.value),
    color: it.color,
  }));
}

function PieCard({ title, rows }) {
  const total = rows.reduce((acc, r) => acc + clamp(r.value), 0);

  return (
    <div className="card" style={{ height: "auto" }}>
      <div className="card-head">
        <div className="card-title">{title}</div>
        <span className="badge badge--soft">Ukupno: {total}</span>
      </div>

      <div style={{ width: "100%", height: 300 }}>
        {total === 0 ? (
          <div className="muted">Nema podataka za grafikon.</div>
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={rows}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                isAnimationActive={true}
              >
                {rows.map((r, idx) => (
                  <Cell key={idx} fill={r.color} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function BarCard({ title, rows }) {
  const total = rows.reduce((acc, r) => acc + clamp(r.value), 0);

  return (
    <div className="card" style={{ height: "auto" }}>
      <div className="card-head">
        <div className="card-title">{title}</div>
        <span className="badge badge--soft">Ukupno: {total}</span>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        {total === 0 ? (
          <div className="muted">Nema podataka za grafikon.</div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" isAnimationActive={true}>
                {rows.map((r, idx) => (
                  <Cell key={idx} fill={r.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function ManagerMetrics() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [metrics, setMetrics] = useState(null);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProjects = async () => {
    setLoadingProjects(true);
    setError("");
    setNotice("");

    try {
      const res = await api.get("/manager/projects");
      const list = res?.data?.data?.projects || [];
      setProjects(list);

      if (!selectedProjectId && list.length > 0) {
        setSelectedProjectId(String(list[0].id));
      }

      return list;
    } catch (e) {
      setError(extractErrorMessage(e));
      setProjects([]);
      return [];
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMetrics = async (projectId) => {
    if (!projectId) {
      setMetrics(null);
      return;
    }

    setLoadingMetrics(true);
    setError("");
    setNotice("");

    try {
      const res = await api.get(`/manager/projects/${projectId}/metrics`);
      const m = res?.data?.data?.metrics || null;
      setMetrics(m);
      setNotice("Metrike su uspešno učitane.");
    } catch (e) {
      setError(extractErrorMessage(e));
      setMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    (async () => {
      const list = await loadProjects();
      if (list.length > 0) {
        const initialId = selectedProjectId ? selectedProjectId : String(list[0].id);
        await loadMetrics(initialId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProject = useMemo(() => {
    return projects.find((p) => String(p.id) === String(selectedProjectId)) || null;
  }, [projects, selectedProjectId]);

  const total = metrics?.total_tasks ?? 0;

  const COLORS = {
    teal: "rgba(80, 137, 145, 0.92)",
    orange: "rgba(225, 159, 102, 0.92)",
    dark: "rgba(13, 52, 66, 0.80)",
    soft: "rgba(80, 137, 145, 0.45)",
  };

  const statusItems = useMemo(() => {
    const s = metrics?.tasks_by_status || {};
    return [
      { key: "todo", label: "To do", value: clamp(s.todo), color: COLORS.teal },
      { key: "inprogress", label: "In progress", value: clamp(s.inprogress), color: COLORS.orange },
      { key: "review", label: "Review", value: clamp(s.review), color: COLORS.dark },
      { key: "done", label: "Done", value: clamp(s.done), color: COLORS.soft },
    ];
  }, [metrics]);

  const priorityItems = useMemo(() => {
    const p = metrics?.tasks_by_priority || {};
    return [
      { key: "low", label: "Low", value: clamp(p.low), color: COLORS.soft },
      { key: "medium", label: "Medium", value: clamp(p.medium), color: COLORS.teal },
      { key: "high", label: "High", value: clamp(p.high), color: COLORS.orange },
      { key: "urgent", label: "Urgent", value: clamp(p.urgent), color: COLORS.dark },
    ];
  }, [metrics]);

  const statusRows = useMemo(() => buildRows(statusItems), [statusItems]);
  const priorityRows = useMemo(() => buildRows(priorityItems), [priorityItems]);

  const onSelectProject = async (e) => {
    const id = e.target.value;
    setSelectedProjectId(id);
    setMetrics(null);
    setNotice("");
    setError("");
    await loadMetrics(id);
  };

  const refresh = async () => {
    const list = await loadProjects();
    const idToUse = selectedProjectId || (list.length > 0 ? String(list[0].id) : "");
    if (idToUse) {
      await loadMetrics(idToUse);
    }
  };

  return (
    <div className="page">
      <div className="page__container">
        <h1 className="h1">Metrics.</h1>
        <div className="muted metrics__intro">
          Prvo izaberi projekat, zatim se prikazuju metrike za taj projekat.
        </div>

        <div className="card" style={{ height: "auto", marginBottom: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Projekat</div>
              <div className="muted">Izaberi projekat za koji želiš prikaz metrika.</div>
            </div>

            <button
              className="button"
              type="button"
              onClick={refresh}
              disabled={loadingProjects || loadingMetrics}
            >
              {loadingProjects || loadingMetrics ? "Učitavam..." : "Osveži"}
            </button>
          </div>

          <div className="metrics__selectorGrid">
            <label className="adminUsers__label metrics__selectorLabel">
              Projekat
              <select
                className="input"
                value={selectedProjectId}
                onChange={onSelectProject}
                disabled={loadingProjects}
              >
                <option value="">
                  {loadingProjects ? "Učitavam projekte..." : "Izaberi projekat"}
                </option>

                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? `Projekat #${p.id}`}
                  </option>
                ))}
              </select>
            </label>

            {error ? <div className="alert">{error}</div> : null}
            {notice ? <div className="alert metrics__notice">{notice}</div> : null}
          </div>
        </div>

        {!selectedProjectId ? (
          <div className="muted">Izaberi projekat da bi se prikazale metrike.</div>
        ) : loadingMetrics ? (
          <div className="muted">Učitavam metrike...</div>
        ) : !metrics ? (
          <div className="muted">Nema metrika za prikaz.</div>
        ) : (
          <>
            <div className="card metrics__projectHeaderCard">
              <div className="card-head">
                <div>
                  <div className="card-title">
                    {selectedProject?.name ?? `Projekat #${selectedProjectId}`}
                  </div>
                  <div className="muted">Vizuelni pregled taskova po statusu i prioritetu.</div>
                </div>

                <span className="badge badge--soft">Total: {total}</span>
              </div>
            </div>

            <div className="metrics__kpiGrid">
              <div className="card metrics__kpiCard">
                <div className="muted metrics__kpiLabel">Ukupno taskova</div>
                <div className="metrics__kpiValue">{metrics.total_tasks ?? 0}</div>
              </div>

              <div className="card metrics__kpiCard">
                <div className="muted metrics__kpiLabel">Completion rate</div>
                <div className="metrics__kpiValue">{metrics.completion_rate ?? 0}%</div>
              </div>

              <div className="card metrics__kpiCard">
                <div className="muted metrics__kpiLabel">Overdue</div>
                <div className="metrics__kpiValue">{metrics.overdue_tasks ?? 0}</div>
              </div>

              <div className="card metrics__kpiCard">
                <div className="muted metrics__kpiLabel">Rok u 7 dana</div>
                <div className="metrics__kpiValue">{metrics.due_next_7_days ?? 0}</div>
              </div>
            </div>

            <div className="metrics__chartsGrid">
              <PieCard title="Taskovi po statusu (Donut)" rows={statusRows} />
              <PieCard title="Taskovi po prioritetu (Donut)" rows={priorityRows} />
            </div>

            <div className="metrics__chartsGrid">
              <BarCard title="Taskovi po statusu (Bar)" rows={statusRows} />
              <BarCard title="Taskovi po prioritetu (Bar)" rows={priorityRows} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
