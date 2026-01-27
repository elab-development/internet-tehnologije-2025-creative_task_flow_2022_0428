import React from "react";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const mockProjects = [
    { id: 10, name: "Kampanja - Proleće", status: "active" },
    { id: 11, name: "Rebranding - Vizuali", status: "planned" },
  ];

  return (
    <div>
      <h1>Projekti.</h1>
      <p>Ovde će biti svi projekti na kojima je menadžer član.</p>

      <hr />

      <h3>Placeholder projekti.</h3>
      <ul>
        {mockProjects.map((p) => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <button onClick={() => navigate(`/manager/projects/${p.id}`)}>
              Otvori projekat: {p.name} ({p.status})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
