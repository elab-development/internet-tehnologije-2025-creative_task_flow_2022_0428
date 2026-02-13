import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, extractErrorMessage } from "../../api";
import SimpleModal from "../../components/SimpleModal";
import use0x0Upload from "../../hooks/use0x0Upload";

const STATUS_OPTIONS = [
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

function bytesToKb(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${Math.round(n / 1024)} KB`;
}

export default function SpecialistTaskDetails() {
  const { id } = useParams();
  const taskId = id;

  // glavni podaci ekrana
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // UI stanja
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // draft za status (select)
  const [statusDraft, setStatusDraft] = useState("todo");

  // modali
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);

  // forme
  const [commentText, setCommentText] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  // hook za upload (preko backend proxy-ja na 0x0.st)
  const { upload, uploading, error: uploadError } = use0x0Upload();

  const resetMessages = () => {
    setError("");
    setNotice("");
  };

  const closeAllModals = () => {
    setCommentModalOpen(false);
    setAttachmentModalOpen(false);
  };

  // 1) Učitavanje detalja taska (task + comments + attachments)
  const loadDetails = async () => {
    setLoading(true);
    resetMessages();

    try {
      const res = await api.get(`/specialist/tasks/${taskId}`);
      const t = res?.data?.data?.task || null;
      const c = res?.data?.data?.comments || [];
      const a = res?.data?.data?.attachments || [];

      setTask(t);
      setComments(Array.isArray(c) ? c : []);
      setAttachments(Array.isArray(a) ? a : []);

      // da select bude u skladu sa task statusom
      if (t?.status) setStatusDraft(t.status);

      setNotice("Detalji zadatka su učitani.");
    } catch (e) {
      setError(extractErrorMessage(e));
      setTask(null);
      setComments([]);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Project name sada dolazi kao string: task.project_name
  const projectName = task?.project_name || "—";

  // mali vizuelni summary (badge-ovi)
  const taskBadges = useMemo(() => {
    return (
      <div className="muted" style={{ marginTop: 8 }}>
        Status: <span className="badge badge--soft">{task?.status || "—"}</span>{" "}
        • Priority: <span className="badge badge--soft">{task?.priority || "—"}</span>{" "}
        • Due: <span className="badge badge--soft">{formatDate(task?.due_date)}</span>
      </div>
    );
  }, [task]);

  // 2) Ažuriranje statusa
  const saveStatus = async () => {
    setBusy(true);
    resetMessages();

    try {
      const res = await api.put(`/specialist/tasks/${taskId}/status`, {
        status: statusDraft,
      });

      const updated = res?.data?.data?.task || null;
      if (updated) {
        setTask(updated);
        setNotice("Status je uspešno ažuriran.");
      } else {
        await loadDetails();
      }
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // 3) Komentari
  const openCommentModal = () => {
    resetMessages();
    setCommentText("");
    setCommentModalOpen(true);
  };

  const addComment = async (e) => {
    e.preventDefault();
    setBusy(true);
    resetMessages();

    try {
      const res = await api.post(`/specialist/tasks/${taskId}/comments`, {
        content: commentText,
      });

      const created = res?.data?.data?.comment || null;
      if (created) {
        setComments((prev) => [created, ...prev]);
      } else {
        await loadDetails();
      }

      setNotice("Komentar je dodat.");
      setCommentModalOpen(false);
    } catch (e2) {
      setError(extractErrorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (commentId) => {
    const ok = window.confirm("Da li sigurno želiš da obrišeš komentar?");
    if (!ok) return;

    setBusy(true);
    resetMessages();

    try {
      await api.delete(`/specialist/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setNotice("Komentar je obrisan.");
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // 4) Attachments
  const openAttachmentModal = () => {
    resetMessages();
    setFile(null);
    setFileName("");
    setAttachmentModalOpen(true);
  };

  const addAttachment = async (e) => {
    e.preventDefault();
    setBusy(true);
    resetMessages();

    try {
      if (!file) {
        setError("Izaberi fajl.");
        return;
      }

      const finalName = fileName.trim() || file.name;

      // A) upload na 0x0 (preko backend proxy endpointa iz hook-a)
      const url = await upload(file);
      if (!url) return;

      // B) snimi link u bazu preko specialist rute
      const payload = {
        file_name: finalName,
        file_path: url,
        file_size: file.size || 0,
        mime_type: file.type || "application/octet-stream",
      };

      const res = await api.post(`/specialist/tasks/${taskId}/attachments`, payload);

      const created = res?.data?.data?.attachment || null;
      if (created) {
        setAttachments((prev) => [created, ...prev]);
      } else {
        await loadDetails();
      }

      setNotice("Prilog je dodat.");
      setAttachmentModalOpen(false);
    } catch (e2) {
      setError(extractErrorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  const deleteAttachment = async (attachmentId) => {
    const ok = window.confirm("Da li sigurno želiš da obrišeš prilog?");
    if (!ok) return;

    setBusy(true);
    resetMessages();

    try {
      await api.delete(`/specialist/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      setNotice("Prilog je obrisan.");
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page__container">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="h1">Detalji zadatka.</h1>
            <div className="muted">
              Project: <b>{projectName}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Link className="button button--disabled" to="/specialist">
              Nazad
            </Link>

            <button className="button" type="button" onClick={loadDetails} disabled={loading}>
              {loading ? "Učitavam..." : "Osveži"}
            </button>
          </div>
        </div>

        {/* Global messages */}
        {error ? <div className="alert">{error}</div> : null}
        {notice ? (
          <div className="alert" style={{ borderColor: "rgba(80, 137, 145, 0.35)" }}>
            {notice}
          </div>
        ) : null}

        {/* Loading / content */}
        {!task ? (
          <div className="muted" style={{ marginTop: 18 }}>
            Učitavam zadatak...
          </div>
        ) : (
          <>
            {/* Task info */}
            <div className="card" style={{ height: "auto", marginTop: 18 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">{task?.title || "—"}</div>
                  <div className="muted">{task?.description || "—"}</div>
                  {taskBadges}
                </div>

                <span className="badge badge--soft">ID: {task?.id}</span>
              </div>
            </div>

            {/* Status */}
            <div className="card" style={{ height: "auto", marginTop: 18 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">Status</div>
                  <div className="muted">Promeni status i sačuvaj.</div>
                </div>

                <button className="button" type="button" onClick={saveStatus} disabled={busy || loading}>
                  {busy ? "Čuvam..." : "Sačuvaj status"}
                </button>
              </div>

              <label className="adminUsers__label" style={{ maxWidth: 420 }}>
                Status
                <select
                  className="input"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  disabled={busy}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Comments */}
            <div className="card" style={{ height: "auto", marginTop: 18 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">Komentari</div>
                  <div className="muted">Dodaj i briši svoje komentare.</div>
                </div>

                <button className="button" type="button" onClick={openCommentModal} disabled={busy}>
                  + Dodaj komentar
                </button>
              </div>

              {comments.length === 0 ? (
                <div className="muted">Nema komentara.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {comments.map((c) => (
                    <div key={c.id} className="card" style={{ height: "auto" }}>
                      <div className="card-head">
                        <div>
                          <div className="card-title" style={{ fontSize: 16 }}>
                            {c.user?.name || "—"}
                          </div>
                          <div className="muted">{c.content}</div>
                        </div>

                        <button className="button" type="button" onClick={() => deleteComment(c.id)} disabled={busy}>
                          Obriši
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="card" style={{ height: "auto", marginTop: 18 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">Prilozi</div>
                  <div className="muted">Upload + čuvanje linka u bazi.</div>
                </div>

                <button className="button" type="button" onClick={openAttachmentModal} disabled={busy}>
                  + Dodaj prilog
                </button>
              </div>

              {attachments.length === 0 ? (
                <div className="muted">Nema priloga.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {attachments.map((a) => (
                    <div key={a.id} className="card" style={{ height: "auto" }}>
                      <div className="card-head">
                        <div>
                          <div className="card-title" style={{ fontSize: 16 }}>
                            {a.file_name || "—"}
                          </div>

                          <div className="muted" style={{ marginTop: 6 }}>
                            Tip: <span className="badge badge--soft">{a.mime_type || "—"}</span>{" "}
                            • Veličina: <span className="badge badge--soft">{bytesToKb(a.file_size)}</span>
                          </div>

                          <div className="muted" style={{ marginTop: 8 }}>
                            <a className="button" href={a.file_path} target="_blank" rel="noreferrer">
                              Otvori
                            </a>
                          </div>
                        </div>

                        <button className="button" type="button" onClick={() => deleteAttachment(a.id)} disabled={busy}>
                          Obriši
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Comment modal */}
        {commentModalOpen ? (
          <SimpleModal
            title="Dodaj komentar"
            subtitle={`Task: ${task?.title || "—"}`}
            onClose={closeAllModals}
          >
            {error ? <div className="alert">{error}</div> : null}

            <form className="adminUsers__form" onSubmit={addComment}>
              <label className="adminUsers__label">
                Komentar
                <textarea
                  className="input"
                  rows={5}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Unesi komentar..."
                  disabled={busy}
                />
              </label>

              <div className="adminUsers__formActions">
                <button className="button" type="submit" disabled={busy}>
                  {busy ? "Čuvam..." : "Dodaj"}
                </button>

                <button className="button button--disabled" type="button" onClick={closeAllModals} disabled={busy}>
                  Odustani
                </button>
              </div>
            </form>
          </SimpleModal>
        ) : null}

        {/* Attachment modal */}
        {attachmentModalOpen ? (
          <SimpleModal
            title="Dodaj prilog"
            subtitle="Fajl se uploaduje, zatim se link čuva u bazi."
            onClose={closeAllModals}
          >
            {error ? <div className="alert">{error}</div> : null}
            {uploadError ? <div className="alert">{uploadError}</div> : null}

            <form className="adminUsers__form" onSubmit={addAttachment}>
              <label className="adminUsers__label">
                Izaberi fajl
                <input
                  className="input"
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setFile(f);
                    setFileName(f?.name || "");
                  }}
                  disabled={busy || uploading}
                />
              </label>

              <label className="adminUsers__label">
                Naziv (opciono)
                <input
                  className="input"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Ako želiš drugačiji naziv"
                  disabled={busy || uploading}
                />
              </label>

              <div className="muted" style={{ marginTop: 6 }}>
                {file ? (
                  <>
                    Izabrano: <b>{file.name}</b> • {bytesToKb(file.size)} • {file.type || "unknown"}
                  </>
                ) : (
                  "Nije izabran fajl."
                )}
              </div>

              <div className="adminUsers__formActions">
                <button className="button" type="submit" disabled={busy || uploading}>
                  {uploading ? "Upload..." : busy ? "Čuvam..." : "Dodaj prilog"}
                </button>

                <button
                  className="button button--disabled"
                  type="button"
                  onClick={closeAllModals}
                  disabled={busy || uploading}
                >
                  Odustani
                </button>
              </div>
            </form>
          </SimpleModal>
        ) : null}
      </div>
    </div>
  );
}
