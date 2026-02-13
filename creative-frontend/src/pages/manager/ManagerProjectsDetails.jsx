import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, extractErrorMessage } from "../../api";
import SimpleModal from "../../components/SimpleModal";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "inprogress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

function safeStr(x) {
  return x == null ? "" : String(x);
}

export default function ManagerProjectDetails() {
  const { id } = useParams(); // projectId
  const projectId = id;

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [form, setForm] = useState({
    user_id: "",
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    due_date: "",
  });

  const specialists = useMemo(() => {
    return (members || []).filter((u) => u.role === "specialist");
  }, [members]);

  const resetForm = () => {
    setForm({
      user_id: specialists?.[0]?.id ? String(specialists[0].id) : "",
      title: "",
      description: "",
      priority: "medium",
      status: "todo",
      due_date: "",
    });
  };

  const openCreate = () => {
    setEditingTask(null);
    setError("");
    setNotice("");
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setError("");
    setNotice("");
    setForm({
      user_id: task?.user?.id ? String(task.user.id) : "",
      title: safeStr(task?.title),
      description: safeStr(task?.description),
      priority: safeStr(task?.priority || "medium"),
      status: safeStr(task?.status || "todo"),
      due_date: task?.due_date ? formatDate(task.due_date) : "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

  const loadProjectDetails = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      // Očekivano: GET /manager/projects/:id -> data.project (sa users, tasks)
      const res = await api.get(`/manager/projects/${projectId}`);
      const p = res?.data?.data?.project || null;

      setProject(p);

      const users = p?.users || [];
      setMembers(users);

      const t = p?.tasks || [];
      setTasks(Array.isArray(t) ? t : []);
    } catch (e) {
      setError(extractErrorMessage(e));
      setProject(null);
      setMembers([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    // kad se učitaju članovi, ako forma nema assignee, setuj prvog specijalistu
    if (!form.user_id && specialists.length > 0) {
      setForm((prev) => ({ ...prev, user_id: String(specialists[0].id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialists.length]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        user_id: Number(form.user_id),
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
      };

      if (!editingTask) {
        const res = await api.post(`/manager/projects/${projectId}/tasks`, payload);
        const created = res?.data?.data?.task || null;

        if (created) {
          // optimistic ubaci u listu
          setTasks((prev) => [created, ...prev]);
        } else {
          // fallback: refetch
          await loadProjectDetails();
        }

        setNotice("Zadatak je uspešno kreiran.");
        closeModal();
      } else {
        const res = await api.put(
          `/manager/projects/${projectId}/tasks/${editingTask.id}`,
          payload
        );
        const updated = res?.data?.data?.task || null;

        if (updated) {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        } else {
          await loadProjectDetails();
        }

        setNotice("Zadatak je uspešno ažuriran.");
        closeModal();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const projectName = project?.name ?? `Projekat #${projectId}`;

  return (
    <div className="page">
      <div className="page__container">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="h1">Detalji projekta i taskovi</h1>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="button button--disabled" to="/manager">
              Nazad na projekte
            </Link>

            <button className="button" type="button" onClick={loadProjectDetails} disabled={loading}>
              {loading ? "Učitavam..." : "Osveži"}
            </button>
          </div>
        </div>

        {error ? <div className="alert">{error}</div> : null}
        {notice ? (
          <div className="alert" style={{ borderColor: "rgba(80, 137, 145, 0.35)" }}>
            {notice}
          </div>
        ) : null}

        {/* Info card */}
        <div className="card" style={{ height: "auto", marginTop: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">{projectName}</div>
              <div className="muted">{project?.description || "—"}</div>
              <div className="muted" style={{ marginTop: 6 }}>
                Status: <span className="badge badge--soft">{project?.status || "—"}</span>{" "}
                • Taskovi: <span className="badge badge--soft">{project?.tasks_count ?? tasks.length}</span>{" "}
                • Start: <span className="badge badge--soft">{formatDate(project?.start_date)}</span>{" "}
                • End: <span className="badge badge--soft">{formatDate(project?.end_date)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="button" type="button" onClick={openCreate} disabled={loading}>
                + Kreiraj task
              </button>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="card" style={{ height: "auto", marginTop: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Članovi projekta</div>
              <div className="muted">Za taskove možeš da biraš samo specijaliste.</div>
            </div>

            <span className="badge badge--soft">Ukupno: {members.length}</span>
          </div>

          {members.length === 0 ? (
            <div className="muted">Nema članova.</div>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {members.map((u) => (
                <span key={u.id} className="badge badge--soft">
                  {u.name} ({u.role}) • ID: {u.id}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="card" style={{ height: "auto", marginTop: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Taskovi</div>
              <div className="muted">Klini na task koji zelis da azuriras.</div>
            </div>

            <span className="badge badge--soft">Ukupno: {tasks.length}</span>
          </div>

          {tasks.length === 0 ? (
            <div className="muted">Trenutno nema taskova za ovaj projekat.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tasks.map((t) => (
                <div key={t.id} className="card" style={{ height: "auto" }}>
                  <div className="card-head">
                    <div>
                      <div className="card-title">{t.title}</div>
                      <div className="muted">
                        Assignee: <b>{t.user?.name || "—"}</b> • ID: {t.user?.id || "—"}
                      </div>

                      <div className="muted" style={{ marginTop: 6 }}>
                        Status: <span className="badge badge--soft">{t.status}</span>{" "}
                        • Priority: <span className="badge badge--soft">{t.priority}</span>{" "}
                        • Due: <span className="badge badge--soft">{formatDate(t.due_date)}</span>
                      </div>

                      {t.description ? (
                        <div className="muted" style={{ marginTop: 10 }}>
                          {t.description}
                        </div>
                      ) : null}
                    </div>

                    <button className="button" type="button" onClick={() => openEdit(t)}>
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Create/Edit */}
        {modalOpen ? (
          <SimpleModal
            title={editingTask ? "Ažuriraj task" : "Kreiraj task"}
            subtitle={
              editingTask
                ? `Task ID: ${editingTask.id} • Projekat: ${projectName}`
                : `Projekat: ${projectName}`
            }
            onClose={closeModal}
          >
            {error ? <div className="alert">{error}</div> : null}

            <form className="adminUsers__form" onSubmit={submitTask}>
              <label className="adminUsers__label">
                Specijalista (assignee)
                <select
                  className="input"
                  name="user_id"
                  value={form.user_id}
                  onChange={onChange}
                  disabled={busy}
                >
                  <option value="">Izaberi specijalistu</option>
                  {specialists.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (ID: {u.id})
                    </option>
                  ))}
                </select>
              </label>

              <label className="adminUsers__label">
                Naslov
                <input
                  className="input"
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  placeholder="Npr. Kreirati Instagram vizuale"
                  disabled={busy}
                />
              </label>

              <label className="adminUsers__label">
                Opis (opciono)
                <textarea
                  className="input"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Detalji zadatka..."
                  rows={4}
                  disabled={busy}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <label className="adminUsers__label">
                  Priority
                  <select
                    className="input"
                    name="priority"
                    value={form.priority}
                    onChange={onChange}
                    disabled={busy}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="adminUsers__label">
                  Status
                  <select
                    className="input"
                    name="status"
                    value={form.status}
                    onChange={onChange}
                    disabled={busy}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="adminUsers__label">
                  Due date (opciono)
                  <input
                    className="input"
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={onChange}
                    disabled={busy}
                  />
                </label>
              </div>

              <div className="adminUsers__formActions">
                <button className="button" type="submit" disabled={busy}>
                  {busy ? "Čuvam..." : editingTask ? "Sačuvaj izmene" : "Kreiraj"}
                </button>

                <button className="button button--disabled" type="button" onClick={closeModal} disabled={busy}>
                  Odustani
                </button>
              </div>

              {specialists.length === 0 ? (
                <div className="muted" style={{ marginTop: 10 }}>
                  Nema specijalista na projektu. Prvo dodaj specijalistu u članove projekta.
                </div>
              ) : null}
            </form>
          </SimpleModal>
        ) : null}
      </div>
    </div>
  );
}
