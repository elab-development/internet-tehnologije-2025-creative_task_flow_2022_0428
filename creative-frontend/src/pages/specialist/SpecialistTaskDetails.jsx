import React from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function SpecialistTaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Detalji zadatka.</h1>
      <p>Ovo je Task Details stranica. Otvara se klikom sa dashboard-a.</p>

      <hr />

      <p><b>Task ID:</b> {id}</p>

      <p>
        Ovde će kasnije biti:
        status dropdown, opis, komentari, prilozi (File.io linkovi), dugme za upload, itd.
      </p>

      <button onClick={() => navigate(-1)}>Nazad.</button>
    </div>
  );
}
