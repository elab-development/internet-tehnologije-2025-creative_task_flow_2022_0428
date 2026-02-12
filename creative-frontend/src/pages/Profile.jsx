import React, { useEffect, useState } from "react";
import usePexelsImages from "../hooks/usePexelsImages";
import SimpleModal from "../components/SimpleModal"; 
import { api, extractErrorMessage, setAuthToken } from "../api"; 

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function getStoredToken() {
  const t1 = sessionStorage.getItem("token");
  if (t1) return t1;

  return null;
}

export default function Profile() {
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    name: "",
    profile_photo: "",
  });

  // Auth header (Bearer) postavljamo iz sessionStorage tokena.
  useEffect(() => {
    const token = getStoredToken();
    setAuthToken(token);
  }, []);

  // Pexels kljuc
  const PEXELS_API_KEY = process.env.REACT_APP_PEXELS_API_KEY;

  const {
    images,
    loading: pexelsLoading,
    error: pexelsError,
    refresh,
  } = usePexelsImages({
    apiKey: PEXELS_API_KEY,
    query: "marketing branding social media workspace",
    perPage: 3,
  });

  const openModal = () => {
    if (!user) return;

    setError("");
    setNotice("");

    setForm({
      name: user?.name || "",
      profile_photo: user?.profile_photo || "",
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError("");
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);

    try {
      const payload = {
        name: (form.name || "").trim(),
        // Ako je prazno, NE šaljemo key, pa backend neće menjati sliku.
        ...(form.profile_photo?.trim()
          ? { profile_photo: form.profile_photo.trim() }
          : {}),
      };

      const res = await api.put("/profile", payload);
      const updated = res?.data?.data?.user;

      if (updated) {
        setUser(updated);
        sessionStorage.setItem("user", JSON.stringify(updated));
      }

      setNotice(res?.data?.message || "Profil je uspešno ažuriran.");
      closeModal();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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

        {notice ? (
          <div className="alert alert--success" style={{ marginBottom: 12 }}>
            {notice}
          </div>
        ) : null}

        <div className="profile-grid">
          {/* Levo: podaci korisnika */}
          <section className="card">
            <div className="profile-head">
              {user.profile_photo ? (
                <img className="avatar" src={user.profile_photo} alt="Profile" />
              ) : (
                <div className="avatar avatar--placeholder">
                  {getInitials(user.name)}
                </div>
              )}

              <div className="profile-head__info">
                <div className="profile-name">{user.name}</div>
                <div className="profile-meta">{user.email}</div>
                <div className="profile-meta">Uloga: {user.role}</div>
              </div>
            </div>

            <div className="divider" />

            <button className="button" type="button" onClick={openModal}>
              Ažuriraj profil
            </button>

            <p className="muted" style={{ marginTop: 10 }}>
              Možeš da izmeniš ime i (opciono) URL profilne slike.
            </p>
          </section>

          {/* Desno: Pexels slike */}
          <section className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Marketing inspiracija</div>
                <div className="muted">Povučeno sa Pexels API-ja</div>
              </div>

              <button
                className="button"
                onClick={refresh}
                type="button"
                disabled={pexelsLoading}
              >
                {pexelsLoading ? "Učitavam..." : "Generiši nove slike"}
              </button>
            </div>

            {pexelsError ? <div className="alert">{pexelsError}</div> : null}

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

        {isModalOpen ? (
          <SimpleModal
            title="Ažuriranje profila"
            subtitle="Izmeni ime i opcionalno URL profilne slike."
            onClose={closeModal}
          >
            <div style={{ padding: 12 }}>
              {error ? (
                <div className="alert" style={{ marginBottom: 10 }}>
                  {error}
                </div>
              ) : null}

              <form onSubmit={submit}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Ime.
                    </div>
                    <input
                      className="input"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Unesi novo ime"
                      required
                    />
                  </div>

                  <div>
                    <div className="muted" style={{ marginBottom: 6 }}>
                      Profilna slika (URL, opciono).
                    </div>
                    <input
                      className="input"
                      name="profile_photo"
                      value={form.profile_photo}
                      onChange={onChange}
                      placeholder="https://..."
                    />
                    <div className="muted" style={{ marginTop: 6 }}>
                      Ako ostaviš prazno, slika se neće menjati.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    <button className="button" type="submit" disabled={saving}>
                      {saving ? "Čuvam..." : "Sačuvaj"}
                    </button>

                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                    >
                      Otkaži
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </SimpleModal>
        ) : null}
      </div>
    </div>
  );
}
