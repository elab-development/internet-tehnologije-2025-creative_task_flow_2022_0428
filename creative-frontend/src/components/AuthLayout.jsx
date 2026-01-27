import React from "react";

export default function AuthLayout({ title, subtitle, imageUrl, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card auth-card--imageBig">
        <div
          className="auth-left"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="auth-left-overlay"></div>

          <div className="auth-left-content">
            <div className="auth-brand">Creative Task Flow</div>
            <h1 className="auth-title">{title}</h1>
            {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">{children}</div>
        </div>
      </div>
    </div>
  );
}
