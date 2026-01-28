import React, { useEffect, useMemo, useState } from "react";
import { api, extractErrorMessage } from "../../api";
import SimpleModal from "../../components/SimpleModal";

const ROLES = [
  { value: "specialist", label: "specialist" },
  { value: "manager", label: "manager" },
  { value: "admin", label: "admin" },
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

//prazna forma - da refreshujemo podatke
function emptyForm() {
  return {
    name: "",
    email: "",
    role: "specialist",
    profile_photo: "", 
    password: "",
  };
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Search + paginacija (client-side)
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 3; 

  // Modal state (create/edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create i edit
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  // Učitavanje liste korisnika (admin endpoint)
  const loadUsers = async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const res = await api.get("/admin/users");
      const list = res?.data?.data?.users || [];
      setUsers(list);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  //svaki put se ucita lista korisnika
  useEffect(() => {
    loadUsers();
  }, []);

  // Memoizovana filtracija korisnika.Pokreće se samo kada se promene `users` ili `search`.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u?.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [users, search]);

  // Paginacija (client-side)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  // Kad se promeni search, vraćamo na prvu stranu
  useEffect(() => {
    setPage(1);
  }, [search]);

  //otvaranje create novog korisnika
  const openCreate = () => {
    setMode("create");
    setEditingUserId(null);
    setForm(emptyForm());
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  //otvaranje editovanja
  const openEdit = (u) => {
    setMode("edit");
    setEditingUserId(u.id);
    setForm({
      name: u?.name || "",
      email: u?.email || "",
      role: u?.role || "specialist",
      profile_photo: u?.profile_photo || "",
      password: "", // opciono resetovanje lozinke
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  //zatvaranje modala
  const closeModal = () => {
    setModalOpen(false);
    setEditingUserId(null);
    setForm(emptyForm());
  };

  // Helper za inpute u formi
  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Submit forme (create/update)
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    try {
      if (mode === "create") {
        // Create korisnika (admin)
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          profile_photo: form.profile_photo || null,
          password: form.password,
        };

        const res = await api.post("/admin/users", payload);
        const created = res?.data?.data?.user;

        // Odmah prikaži promenu (ubaci na vrh)
        if (created) setUsers((prev) => [created, ...prev]);
        else await loadUsers();

        setNotice("Korisnik je uspešno kreiran.");
        closeModal();
      } else {
        // Update korisnika (admin)
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          // Backend trenutno ne prima profile_photo u update validaciji
          ...(form.password ? { password: form.password } : {}),
        };

        const res = await api.put(`/admin/users/${editingUserId}`, payload);
        const updated = res?.data?.data?.user;

        // Odmah prikaži promenu
        if (updated) {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        } else {
          await loadUsers();
        }

        setNotice("Korisnik je uspešno ažuriran.");
        closeModal();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  // Brisanje korisnika (sa confirm) + instant UI update
  const removeUser = async (u) => {
    const ok = window.confirm(`Da li sigurno želiš da obrišeš korisnika: ${u.name} (${u.email})?`);
    if (!ok) return;

    setBusyId(u.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/users/${u.id}`);

      // Odmah ukloni iz UI
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setNotice("Korisnik je uspešno obrisan.");
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page">
      <div className="page__container">
        <h1 className="h1">Korisnici sistema</h1>

        <section className="card-admin">
          <div className="card-head">
            <div>
              <div className="muted">Pregled, kreiranje, izmena i brisanje korisnika (dostupno samo adminu)</div>
            </div>

            <button className="button" type="button" onClick={openCreate} disabled={loading}>
              + Novi korisnik
            </button>
          </div>

          {error ? <div className="alert">{error}</div> : null}
          {notice ? (
            <div className="alert" style={{ borderColor: "rgba(80, 137, 145, 0.35)" }}>
              {notice}
            </div>
          ) : null}

          <div className="adminUsers__toolbar">
            <input
              className="input adminUsers__search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pretraga po imenu"
            />

            <button className="button" type="button" onClick={loadUsers} disabled={loading}>
              {loading ? "Učitavam..." : "Osveži"}
            </button>
          </div>

          <div className="divider" />

          {/* GRID KARTICA: 3 u redu */}
          <div className="adminUsers__grid">
            {paged.length === 0 ? (
              <div className="muted">Nema rezultata</div>
            ) : (
              paged.map((u) => (
                <div key={u.id} className="card adminUsers__userCard">
                  <div className="adminUsers__userHead">
                    {u.profile_photo ? (
                      <img className="avatar" src={u.profile_photo} alt="Profile" />
                    ) : (
                      <div className="avatar avatar--placeholder">{getInitials(u.name)}</div>
                    )}

                    <div className="adminUsers__userInfo">
                      <div className="profile-name">{u.name}</div>
                      <div className="profile-meta">{u.email}</div>
                      <div className="profile-meta">Uloga: {u.role}</div>

                      {u.profile_photo ? (
                        <a className="adminUsers__photoLink" href={u.profile_photo} target="_blank" rel="noreferrer">
                          Otvori sliku
                        </a>
                      ) : (
                        <div className="muted">Nema slike</div>
                      )}
                    </div>
                  </div>

                  <div className="divider" />

                  <div className="adminUsers__actions">
                    <button className="button adminUsers__btn" type="button" onClick={() => openEdit(u)}>
                      Izmeni
                    </button>

                    <button
                      className="button adminUsers__btn adminUsers__btn--danger"
                      type="button"
                      onClick={() => removeUser(u)}
                      disabled={busyId === u.id}
                    >
                      {busyId === u.id ? "Brišem..." : "Obriši"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINACIJA */}
          <div className="adminUsers__pagination">
            <button
              className="button adminUsers__btn"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              ← Prethodna
            </button>

            <div className="muted">
              Strana {safePage} od {totalPages} | Ukupno: {filtered.length}
            </div>

            <button
              className="button adminUsers__btn"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Sledeća →
            </button>
          </div>
        </section>

        {/* MODAL (reusable SimpleModal) */}
        {modalOpen ? (
          <SimpleModal
            title={mode === "create" ? "Novi korisnik" : "Izmena korisnika"}
            subtitle={
              mode === "create"
                ? "Popuni podatke i dodeli ulogu"
                : "Menjaš ime, email, ulogu i opciono lozinku"
            }
            onClose={closeModal}
          >
            {error ? <div className="alert">{error}</div> : null}

            <form className="adminUsers__form" onSubmit={submit}>
              <label className="adminUsers__label">
                Ime
                <input className="input" value={form.name} onChange={onChange("name")} required />
              </label>

              <label className="adminUsers__label">
                Email
                <input className="input" value={form.email} onChange={onChange("email")} required />
              </label>

              <label className="adminUsers__label">
                Uloga
                <select className="input" value={form.role} onChange={onChange("role")} required>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>

              {mode === "create" ? (
                <label className="adminUsers__label">
                  Profile photo link (opciono)
                  <input
                    className="input"
                    value={form.profile_photo}
                    onChange={onChange("profile_photo")}
                    placeholder="https://..."
                  />
                </label>
              ) : (
                <div className="muted" style={{ marginTop: 4 }}>
                  Photo link se menja kasnije (backend update trenutno ne prima profile_photo)
                </div>
              )}

              <label className="adminUsers__label">
                {mode === "create" ? "Lozinka" : "Nova lozinka (opciono)"}
                <input
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={onChange("password")}
                  placeholder={mode === "create" ? "" : "Ostavi prazno ako ne menjaš"}
                  required={mode === "create"}
                />
              </label>

              <div className="adminUsers__formActions">
                <button className="button" type="submit">
                  {mode === "create" ? "Kreiraj" : "Sačuvaj"}
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
