import React from "react";
import { useParams, Link } from "react-router-dom";

export default function ManagerProjectDetails() {
  const { id } = useParams();

  return (
    <div>
      <h1>Detalji projekta.</h1>
      <p>Ovde će biti članovi + zadaci + kreiranje zadatka + upravljanje timom.</p>

      <hr />

      <p><b>Project ID:</b> {id}</p>

      <p>
        <Link to={`/manager/projects/${id}/metrics`}>Idi na metrike projekta.</Link>
      </p>
    </div>
  );
}
