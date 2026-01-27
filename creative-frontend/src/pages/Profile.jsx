import React, { useMemo } from "react";
import usePexelsImages from "../hooks/usePexelsImages";

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Profile() {
  const user = useMemo(() => {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);


  const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY;

  const { images, loading, error, refresh } = usePexelsImages({
    apiKey: PEXELS_API_KEY,
    query: "marketing branding social media workspace",
    perPage: 3,
  });

  if (!user) {
    return (
      <div className="page">
        <div className="page__container">
          <h1 className="h1">My Profile.</h1>
          <p>Nisi ulogovana.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__container">
        <h1 className="h1">My Profile</h1>

        <div className="profile-grid">
          {/* Levo: podaci korisnika */}
          <section className="card">
            <div className="profile-head">
              {user.profile_photo ? (
                <img className="avatar" src={user.profile_photo} alt="Profile" />
              ) : (
                <div className="avatar avatar--placeholder">{getInitials(user.name)}</div>
              )}

              <div className="profile-head__info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-meta">{user.email}</div>
                <div className="profile-meta">Uloga: {user.role}</div>
              </div>
            </div>

            <div className="divider" />

            <button className="button button--disabled" disabled>
              Ažuriraj profil (uskoro).
            </button>

            <p className="muted" style={{ marginTop: 10 }}>
              Dugme je trenutno onemogućeno. Kasnije radimo update profila
            </p>
          </section>

          {/* Desno: Pexels slike */}
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Marketing inspiracija</div>
                <div className="muted">Povučeno sa Pexels API-ja</div>
              </div>

              <button className="button" onClick={refresh} type="button" disabled={loading}>
                {loading ? "Učitavam..." : "Generiši nove slike"}
              </button>
            </div>

            {error ? <div className="alert">{error}</div> : null}

            <div className="img-grid">
              {images.map((img) => (
                <a
                  key={img.id}
                  className="img-card"
                  href={img.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  title={img.alt}
                >
                  <img src={img.src?.medium || img.src?.small} alt={img.alt} />
                  <div className="img-caption">
                    {img.photographer ? `${img.photographer}.` : "Pexels."}
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
