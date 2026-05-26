import { useEffect, useState } from "react";

import {
  getPatients,
  addPatient,
  deletePatient
} from "../services/api";

import "../styles/Patients.css";

function Patients() {

  const [patients, setPatients]
    = useState([]);

  const [name, setName]
    = useState("");

  const [disease, setDisease]
    = useState("");

  // LOAD PATIENTS
  useEffect(() => {

    loadPatients();

  }, []);

  const loadPatients = async () => {

    const data = await getPatients();

    setPatients(data);
  };

  // ADD PATIENT
  const handleSubmit = async (e) => {

    e.preventDefault();

    const newPatient = {
      name,
      disease
    };

    await addPatient(newPatient);

    setName("");
    setDisease("");

    loadPatients();
  };

  // DELETE PATIENT
  const handleDelete = async (id) => {

    await deletePatient(id);

    loadPatients();
  };

  return (

    <div className="container">

      <h1 className="title">
        Patient Management
      </h1>

      {/* FORM */}

      <div className="form-container">

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Enter Patient Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="input-field"
          />

          <input
            type="text"
            placeholder="Enter Disease"
            value={disease}
            onChange={(e) =>
              setDisease(e.target.value)
            }
            className="input-field"
          />

          <button
            type="submit"
            className="add-btn"
          >
            Add Patient
          </button>

        </form>

      </div>

      {/* PATIENT LIST */}

      <div className="patient-list">

        {patients.map((patient) => (

          <div
            key={patient.id}
            className="patient-card"
          >

            <h3>{patient.name}</h3>

            <p>
              <strong>ID:</strong>{" "}
              {patient.id}
            </p>

            <p>
              <strong>Disease:</strong>{" "}
              {patient.disease}
            </p>

            <button
              onClick={() =>
                handleDelete(patient.id)
              }
              className="delete-btn"
            >
              Delete
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Patients;