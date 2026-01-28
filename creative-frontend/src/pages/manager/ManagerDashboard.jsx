import React, { useEffect, useMemo, useState } from "react";
import { api, extractErrorMessage } from "../../api";

import SimpleModal from "../../components/SimpleModal";
import ProjectSection from "../../components/ProjectSection";

export default function ManagerDashboard() {
  const [projects, setProjects] = useState([]);

  // Members cache: { [projectId]: users[] }
  const [membersByProjectId, setMembersByProjectId] = useState({});
  const [membersLoadingByProjectId, setMembersLoadingByProjectId] = useState({});

  const [loading, setLoading] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Add members modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [memberIdsText, setMemberIdsText] = useState("");

  // Učitavanje projekata (manager endpoint)
  const loadProjects = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const res = await api.get("/manager/projects");
      const list = res?.data?.data?.projects || [];
      setProjects(list);
      return list;
    } catch (e) {
      setError(extractErrorMessage(e));
      setProjects([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Učitavanje članova za jedan projekat
  const loadMembers = async (projectId) => {
    setMembersLoadingByProjectId((prev) => ({ ...prev, [projectId]: true }));

    try {
      const res = await api.get(`/manager/projects/${projectId}/members`);
      const users = res?.data?.data?.users || [];
      setMembersByProjectId((prev) => ({ ...prev, [projectId]: users }));
    } catch (e) {
      setError(extractErrorMessage(e));
      setMembersByProjectId((prev) => ({ ...prev, [projectId]: [] }));
    } finally {
      setMembersLoadingByProjectId((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Inicijalno učitavanje: projekti + članovi za svaki projekat
  useEffect(() => {
    (async () => {
      const list = await loadProjects();

      // Nema paginacije, pa odmah učitamo članove za sve projekte
      for (const p of list) {
        await loadMembers(p.id);
      }
    })();
  }, []);

  // Otvaranje modala za dodavanje članova
  const openAddMembers = (project) => {
    setActiveProject(project);
    setMemberIdsText("");
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveProject(null);
    setMemberIdsText("");
  };

  // Parsiranje unosa: "2, 5  9" -> [2,5,9]
  const parsedUserIds = useMemo(() => {
    const raw = memberIdsText
      .split(/[, \n\t]+/)
      .map((x) => x.trim())
      .filter(Boolean);

    const nums = raw
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n > 0);

    return Array.from(new Set(nums));
  }, [memberIdsText]);

  // Submit dodavanja članova
  const submitAddMembers = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!activeProject) return;

    if (parsedUserIds.length === 0) {
      setError("Unesi bar jedan validan ID korisnika");
      return;
    }

    try {
      await api.post(`/manager/projects/${activeProject.id}/members`, {
        user_ids: parsedUserIds,
      });

      setNotice("Članovi su uspešno dodati");
      closeModal();

      // Odmah osveži listu članova za taj projekat
      await loadMembers(activeProject.id);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // Uklanjanje člana sa projekta + instant UI update
  const removeMember = async (projectId, userId) => {
    const ok = window.confirm("Da li sigurno želiš da ukloniš člana sa projekta?");
    if (!ok) return;

    setBusyMemberId(userId);
    setError("");
    setNotice("");

    try {
      await api.delete(`/manager/projects/${projectId}/members/${userId}`);

      // Odmah ukloni iz UI bez refetcha
      setMembersByProjectId((prev) => {
        const curr = prev[projectId] || [];
        return { ...prev, [projectId]: curr.filter((u) => u.id !== userId) };
      });

      setNotice("Član je uspešno uklonjen");
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusyMemberId(null);
    }
  };

  // Osveži sve: projekti + članovi
  const refreshAll = async () => {
    const list = await loadProjects();
    for (const p of list) {
      await loadMembers(p.id);
    }
  };

  return (
    <div className="page">
      <div className="page__container">
        <h1 className="h1">Projekti</h1>

        <div className="card" style={{ height: "auto", marginBottom: 18 }}>
          <div className="card-head">
            <div>
              <div className="card-title">Moji projekti</div>
              <div className="muted">Pregled projekata i upravljanje članovima (manager)</div>
            </div>

            <button className="button" type="button" onClick={refreshAll} disabled={loading}>
              {loading ? "Učitavam..." : "Osveži"}
            </button>
          </div>

          {error ? <div className="alert">{error}</div> : null}
          {notice ? (
            <div className="alert" style={{ borderColor: "rgba(80, 137, 145, 0.35)" }}>
              {notice}
            </div>
          ) : null}
        </div>

        {projects.length === 0 && !loading ? (
          <div className="muted">Trenutno nema projekata</div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {projects.map((p) => (
              <ProjectSection
                key={p.id}
                project={p}
                members={membersByProjectId[p.id] || []}
                membersLoading={!!membersLoadingByProjectId[p.id]}
                onAddMembersClick={openAddMembers}
                onRemoveMember={removeMember}
                busyMemberId={busyMemberId}
              />
            ))}
          </div>
        )}

        {/* Add members modal */}
        {modalOpen ? (
          <SimpleModal
            title="Dodaj članove"
            subtitle={
              activeProject
                ? `Projekat: ${activeProject.name}. Unesi ID-jeve korisnika (npr. 2, 5, 9)`
                : "Unesi ID-jeve korisnika"
            }
            onClose={closeModal}
          >
            {error ? <div className="alert">{error}</div> : null}

            <form className="adminUsers__form" onSubmit={submitAddMembers}>
              <label className="adminUsers__label">
                ID korisnika
                <input
                  className="input"
                  value={memberIdsText}
                  onChange={(e) => setMemberIdsText(e.target.value)}
                  placeholder="2, 5, 9"
                />
              </label>

              <div className="muted" style={{ marginTop: 6 }}>
                Validni ID-jevi: {parsedUserIds.length ? parsedUserIds.join(", ") : "—"}
              </div>

              <div className="adminUsers__formActions">
                <button className="button" type="submit">
                  Dodaj
                </button>

                <button className="button button--disabled" type="button" onClick={closeModal}>
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
