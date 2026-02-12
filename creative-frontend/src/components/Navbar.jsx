import React from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;
  if (location.pathname === "/login" || location.pathname === "/register") return null;

  const role = user.role;

  const linkClass = ({ isActive }) => `nav__link ${isActive ? "nav__link--active" : ""}`;

  const handleLogout = async () => {
    await onLogout?.();
    navigate("/login", { replace: true });
  };

  return (
    <header className="nav">
      <div className="nav__container">
        {/* Levo */}
        <Link to="/" className="nav__left" aria-label="Početna">
          <div className="nav__logoWrap">
            <img className="nav__logoImg" src={logo} alt="Logo" />
          </div>

          <div className="nav__brand">
            <div className="nav__title">Creative Task Flow</div>

            <div className="nav__meta">
              <span>{user.name}</span>
              <span className="nav__role">{role}</span>
            </div>
          </div>
        </Link>

        {/* Centar */}
        <nav className="nav__center">
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>

          {role === "specialist" ? (
            <NavLink to="/specialist" className={linkClass}>
              Moji zadaci
            </NavLink>
          ) : null}

          {role === "manager" ? (
            <>
              <NavLink to="/manager" className={linkClass}>
                Projekti
              </NavLink>
              <NavLink to="/manager/metrics" className={linkClass}>
                Metrike
              </NavLink>
            </>
          ) : null}

          {role === "admin" ? (
            <>
              <NavLink to="/admin/users" className={linkClass}>
                Korisnici
              </NavLink>
            </>
          ) : null}
        </nav>

        {/* Desno */}
        <div className="nav__right">
          <button className="nav__logout" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
