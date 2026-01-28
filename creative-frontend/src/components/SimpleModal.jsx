import React from "react";

/**
 * SimpleModal.
 * - Generički modal koji možemo reuse za AdminUsers, ManagerProjects, itd
 * - Klik van modala zatvara modal. Header ima naslov, podnaslov (opciono) i X dugme
 */
export default function SimpleModal({ title, subtitle, onClose, children }) {
  return (
    <div className="ctfModal__overlay" onMouseDown={onClose} role="presentation">
      <div className="card ctfModal__box" onMouseDown={(e) => e.stopPropagation()}>
        <div className="card-head">
          <div>
            <div className="card-title">{title}</div>
            {subtitle ? <div className="muted">{subtitle}</div> : null}
          </div>

          <button className="button ctfBtn--small" type="button" onClick={onClose}>
            X
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
