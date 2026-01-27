import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import img1 from "../assets/img1.png";
import { useNavigate, Link } from "react-router-dom";

export default function Register({ onRegister }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await onRegister(
      {
      name,
      email,
      password,
      profile_photo: null, 
    },
    (msg) => setError(msg)
    );

    setLoading(false);

    if (!ok) return;
    navigate("/", { replace: true });
  }

  return (
    <AuthLayout
      title="Registracija"
      subtitle="Kreiraj nalog i počni sa organizacijom marketing rada."
      imageUrl={img1}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <label className="auth-label">
          Ime
          <input
            className="auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Unesi ime"
            required
          />
        </label>

        <label className="auth-label">
          Email
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="npr. iva@creative.net"
            required
          />
        </label>

        <label className="auth-label">
          Lozinka
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 karaktera"
            required
          />
        </label>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Kreiranje..." : "Registruj se"}
        </button>

        <div className="auth-small">
          Već imaš nalog.{" "}
          <Link to="/login" className="auth-link">
            Prijavi se
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
