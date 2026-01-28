import React, { useEffect, useMemo, useState } from "react";
import { api, extractErrorMessage } from "../../api";

const ROLES = [
  { value: "specialist", label: "specialist" },
  { value: "manager", label: "manager" },
  { value: "admin", label: "admin" },
];

//inicijali korisnika
function getInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

//default vrednosti kada se forma otvori
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
  //promenljive koje ce nam trebati
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 3; 

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create i edit
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(emptyForm());


  //poziv ka backendu
  const loadUsers = async () => {
    setLoading(true); //krece izvrsavanje funkcije, imamo status loading na true, dok se ne zavrsi sve
    setError("");
    setNotice("");

    try {
      //pozivamo backend rutu i uzimamo listu korisnika koju setujemo na tu vracenu listu
      const res = await api.get("/admin/users");
      const list = res?.data?.data?.users || [];
      setUsers(list);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      //kad se sve zavrsi stavljamo loading na false sto znaci da je izvrseno vracanje
      setLoading(false);
    }
  };

  //svaki put kada se desi izmena ponovo se ucitavaju korisnici
  useEffect(() => {
    loadUsers();
  }, []);


 // Memoizovana filtracija korisnika. Pokreće se samo kada se promene `users` ili `search`
const filtered = useMemo(() => {
  // Normalizujemo unos (trim + lowercase) da pretraga bude "case-insensitive".
  const q = search.trim().toLowerCase();

  // Ako nema unosa za pretragu, vraćamo sve korisnike
  if (!q) return users;

  // Filtriramo samo po imenu
  return users.filter((u) => {
    const name = (u?.name || "").toLowerCase(); //poklapanje imena
    return name.includes(q); //ako sadrzi bar 1 slovo pretrazuje sve
  });
}, [users, search]);

  //racunanje ukupnog broja stranica
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [search]); //svaki put kad se promeni kriterijum pretrage vraca se korisnik na prvu stranicu
  

  //stavlja se status modala na create- da zna koji modal da prikaze, setuje se empty forma i open modal na true
  const openCreate = () => {
    setMode("create");
    setEditingUserId(null);
    setForm(emptyForm());
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  //stavlja se status modala na edit- da zna koji modal da prikaze, setuje se empty forma i open modal na true
  const openEdit = (u) => {
    setMode("edit");
    setEditingUserId(u.id);
    setForm({
      name: u?.name || "",
      email: u?.email || "",
      role: u?.role || "specialist",
      profile_photo: u?.profile_photo || "",
      password: "",
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  //zatvara se modal, brise se id korisnika za editovanje i prazni se forma
  const closeModal = () => {
    setModalOpen(false);
    setEditingUserId(null);
    setForm(emptyForm());
  };

  //svaki put kad se desi izmena u inputu korisnika, menja se forma sa tim vrednostima
  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  //fja za submit forme - azuriranje ili kreiranje 
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");

    try {
      if (mode === "create") {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          profile_photo: form.profile_photo || null,
          password: form.password,
        };

        //kreiranje novog korisnika i slanje podataka
        const res = await api.post("/admin/users", payload);
        const created = res?.data?.data?.user;

        if (created) setUsers((prev) => [created, ...prev]);
        else await loadUsers();

        setNotice("Korisnik je uspešno kreiran."); //obavestenje
        closeModal(); //zatvara se modal
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        };

        //azuriranje korisnika
        const res = await api.put(`/admin/users/${editingUserId}`, payload);
        const updated = res?.data?.data?.user;

        if (updated) setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        else await loadUsers();

        setNotice("Korisnik je uspešno ažuriran.");
        closeModal();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  //brisanje korisnika
  const removeUser = async (u) => {
    const ok = window.confirm(`Da li sigurno želiš da obrišeš korisnika: ${u.name} (${u.email})?`);
    if (!ok) return;

    setBusyId(u.id);
    setError("");
    setNotice("");

    try {
      await api.delete(`/admin/users/${u.id}`); //zove se backend
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
              <div className="muted">Pregled, kreiranje, izmena i brisanje korisnika. Dostupno samo adminu</div>
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
              placeholder="Pretraga: ime, email ili uloga"
            />
          </div>

          
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
              Strana {safePage} od {totalPages}. Ukupno: {filtered.length}.
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

        {/* MODAL */}
        {modalOpen ? (
          <div className="adminUsers__modalOverlay" onMouseDown={closeModal} role="presentation">
            <div className="card adminUsers__modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="card-head">
                <div>
                  <div className="card-title">{mode === "create" ? "Novi korisnik" : "Izmena korisnika"}</div> 
                  <div className="muted">
                    {mode === "create"
                      ? "Popuni podatke i dodeli ulogu."
                      : "Menjaš ime, email, ulogu i opciono lozinku."}
                  </div>
                </div>

                <button className="button adminUsers__btn" type="button" onClick={closeModal}>
                  X
                </button>
              </div>

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
                    Photo link se menja kasnije (backend update trenutno ne prima profile_photo).
                  </div>
                )}

                <label className="adminUsers__label">
                  {mode === "create" ? "Lozinka." : "Nova lozinka. (opciono)"}
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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
