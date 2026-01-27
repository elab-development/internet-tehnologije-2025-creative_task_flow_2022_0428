import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import img1 from "../assets/img1.png";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


export default function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@creative.net");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setLoading(true);

  const ok = await onLogin({ email, password }, (msg) => setError(msg));

  setLoading(false);

  if (!ok) return;          
  navigate("/", { replace: true }); 
}


  return (
    <AuthLayout
      title="Prijava"
      subtitle="Prijavi se i nastavi rad na projektima i zadacima"
      imageUrl={img1}
    >
      <form onSubmit={handleSubmit} className="auth-form">
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
            placeholder="Unesi lozinku"
            required
          />
        </label>

        {error ? <div className="auth-error">{error}</div> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Prijavljivanje..." : "Prijavi se"}
        </button>

        <div className="auth-small">
          Nemaš nalog <Link to="/register" className="auth-link">Registruj se</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
