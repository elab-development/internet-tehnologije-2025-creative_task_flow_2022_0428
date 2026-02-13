import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, extractErrorMessage } from "../../api";

const STATUS_OPTIONS = [
  { value: "", label: "Svi" },
  { value: "todo", label: "To do" },
  { value: "inprogress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

export default function SpecialistDashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  //fja za ucitavanje taskova sa backenda
  const loadTasks = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const res = await api.get("/specialist/tasks");
      const list = res?.data?.data?.tasks || [];
      setTasks(list);
      setNotice("Zadaci su uspešno učitani.");
    } catch (e) {
      setError(extractErrorMessage(e));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  //na pokretanje stranice ucitavaju se taskovi
  useEffect(() => {
    loadTasks();
  }, []);

  //filtriranje taskova
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;

      if (query) {
        const title = (t.title || "").toLowerCase();
        const proj = (t.project?.name || "").toLowerCase();
        if (!title.includes(query) && !proj.includes(query)) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, q]);

  //jednostavna statistika za taskove listu
  const stats = useMemo(() => {
    const s = { todo: 0, inprogress: 0, review: 0, done: 0, total: tasks.length };
    for (const t of tasks) {
      if (t.status && s[t.status] != null) s[t.status] += 1;
    }
    return s;
  }, [tasks]);

  return (
    <div className="page">
      <div className="page__container">
        <h1 className="h1">Moji zadaci.</h1>

        <div className="card" style={{ height: "auto", marginBottom: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Pregled zadataka</div>
              <div className="muted">Klikni na zadatak da otvoriš detalje.</div>
            </div>

            <button className="button" type="button" onClick={loadTasks} disabled={loading}>
              {loading ? "Učitavam..." : "Osveži"}
            </button>
          </div>

          {error ? <div className="alert">{error}</div> : null}
          {notice ? (
            <div className="alert" style={{ borderColor: "rgba(80, 137, 145, 0.35)" }}>
              {notice}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <span className="badge badge--soft">Total: {stats.total}</span>
            <span className="badge badge--soft">To do: {stats.todo}</span>
            <span className="badge badge--soft">In progress: {stats.inprogress}</span>
            <span className="badge badge--soft">Review: {stats.review}</span>
            <span className="badge badge--soft">Done: {stats.done}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, marginTop: 14 }}>
            <label className="adminUsers__label">
              Pretraga (naslov ili projekat)
              <input
                className="input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Npr. Instagram, Ads..."
              />
            </label>

            <label className="adminUsers__label">
              Status
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtered.length === 0 && !loading ? (
          <div className="muted">Nema zadataka za prikaz.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((t) => (
              <div key={t.id} className="card" style={{ height: "auto" }}>
                <div className="card-head">
                  <div>
                    <div className="card-title">{t.title}</div>

                    <div className="muted" style={{ marginTop: 6 }}>
                      Projekat: <b>{t.project_name || `#${t.project_id}`}</b>
                    </div>

                    <div className="muted" style={{ marginTop: 8 }}>
                      Status: <span className="badge badge--soft">{t.status}</span>{" "}
                      • Priority: <span className="badge badge--soft">{t.priority}</span>{" "}
                      • Due: <span className="badge badge--soft">{formatDate(t.due_date)}</span>
                    </div>
                  </div>

                  <button
                    className="button"
                    type="button"
                    onClick={() => navigate(`/specialist/tasks/${t.id}`)}
                  >
                    Otvori
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
