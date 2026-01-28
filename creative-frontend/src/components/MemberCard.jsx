import React from "react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * MemberCard
 * - Prikazuje člana projekta kao karticu (avatar/initials + osnovne info).
 * - Dugme "Remove member" poziva callback iz parent komponente.
 */
export default function MemberCard({ user, onRemove, removing }) {
  return (
    <div className="card mgrMemberCard">
      <div className="profile-head mgrMemberCard__head">
        {user.profile_photo ? (
          <img className="avatar mgrMemberCard__avatar" src={user.profile_photo} alt="Profile" />
        ) : (
          <div className="avatar avatar--placeholder mgrMemberCard__avatar">
            {getInitials(user.name)}
          </div>
        )}

        <div className="profile-head__info">
          <div className="profile-name mgrMemberCard__name">{user.name}</div>
          <div className="profile-meta">{user.email}</div>
          <div className="profile-meta">Uloga: {user.role}</div>
          <div className="muted">ID: {user.id}</div>

          {user.profile_photo ? (
            <a className="mgrMemberCard__link" href={user.profile_photo} target="_blank" rel="noreferrer">
              Otvori sliku
            </a>
          ) : null}
        </div>
      </div>

      <div className="divider" />

      <div className="mgrMemberCard__actions">
        <button className="button ctfBtn--small" type="button" onClick={onRemove} disabled={removing}>
          {removing ? "Uklanjam..." : "Remove member"}
        </button>
      </div>
    </div>
  );
}
