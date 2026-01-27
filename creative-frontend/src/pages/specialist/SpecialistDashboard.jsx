import React from "react";
import { useNavigate } from "react-router-dom";

export default function SpecialistDashboard() {
  const navigate = useNavigate();

  // Placeholder: kasnije će doći fetch /specialist/tasks
  const mockTasks = [
    { id: 1, title: "Instagram post - vizual", status: "todo" },
    { id: 2, title: "Google Ads banner", status: "inprogress" },
  ];

  return (
    <div>
      <h1>Moji zadaci.</h1>
      <p>Ovde će biti lista svih zadataka dodeljenih specijalisti.</p>

      <hr />

      <h3>Placeholder tasks.</h3>
      <ul>
        {mockTasks.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <button onClick={() => navigate(`/specialist/tasks/${t.id}`)}>
              Otvori zadatak: {t.title} ({t.status})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
