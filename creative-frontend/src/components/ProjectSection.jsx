import React from "react";
import MemberCard from "./MemberCard";

/**
 * ProjectSection
 * - Prikazuje jedan projekat kao sekciju (card)
 * - U headeru ima osnovne info + dugme "Add members"
 * - Ispod prikazuje članove projekta kao grid (MemberCard)
 */
export default function ProjectSection({
  project,
  members,
  membersLoading,
  onAddMembersClick,
  onRemoveMember,
  busyMemberId,
}) {
  return (
    <section className="card mgrProjectSection">
      <div className="card-head">
        <div>
          <div className="card-title">{project.name}</div>

          <div className="muted">
            Status: <span className="badge badge--soft">{project.status || "active"}</span>
            {typeof project.tasks_count === "number" ? (
              <span className="mgrProjectSection__metaSep">Taskovi: {project.tasks_count}</span>
            ) : null}
            {project.start_date ? (
              <span className="mgrProjectSection__metaSep">Start: {project.start_date}</span>
            ) : null}
            {project.end_date ? <span className="mgrProjectSection__metaSep">End: {project.end_date}</span> : null}
          </div>

          {project.description ? (
            <div className="muted" style={{ marginTop: 6 }}>
              {project.description}
            </div>
          ) : null}
        </div>

        <button className="button" type="button" onClick={() => onAddMembersClick(project)}>
          + Add members to this project
        </button>
      </div>

      <div className="divider" />

      <div className="muted" style={{ marginBottom: 10 }}>
        Članovi projekta
      </div>

      {membersLoading ? (
        <div className="muted">Učitavam članove...</div>
      ) : members.length === 0 ? (
        <div className="muted">Trenutno nema članova na projektu</div>
      ) : (
        <div className="mgrProjectSection__grid">
          {members.map((u) => (
            <MemberCard
              key={u.id}
              user={u}
              removing={busyMemberId === u.id}
              onRemove={() => onRemoveMember(project.id, u.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
