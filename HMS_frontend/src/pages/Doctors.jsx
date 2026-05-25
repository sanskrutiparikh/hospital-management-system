import { useEffect, useState } from "react";

import {
  getDoctors,
  addDoctor
} from "../services/api";

import "../styles/Patients.css";

function Doctors() {

  const [doctors, setDoctors] = useState([]);

  const [name, setName] = useState("");

  const [specialization, setSpecialization]
  = useState("");

  const [experience, setExperience]
  = useState("");

  const [contact, setContact]
  = useState("");

  useEffect(() => {

    loadDoctors();

  }, []);

  const loadDoctors = async () => {

    const data = await getDoctors();

    setDoctors(data);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    const newDoctor = {

      name,
      specialization,
      experience,
      contact
    };

    await addDoctor(newDoctor);

    setName("");
    setSpecialization("");
    setExperience("");
    setContact("");

    loadDoctors();
  };

  return (

    <div className="container">

      <h1 className="title">
        Doctor Management
      </h1>

      <div className="form-container">

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Doctor Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="input-field"
          />

          <input
            type="text"
            placeholder="Specialization"
            value={specialization}
            onChange={(e) =>
              setSpecialization(e.target.value)
            }
            className="input-field"
          />

          <input
            type="number"
            placeholder="Experience"
            value={experience}
            onChange={(e) =>
              setExperience(e.target.value)
            }
            className="input-field"
          />

          <input
            type="text"
            placeholder="Contact Number"
            value={contact}
            onChange={(e) =>
              setContact(e.target.value)
            }
            className="input-field"
          />

          <button
            type="submit"
            className="add-btn"
          >
            Add Doctor
          </button>

        </form>
      </div>

      <div className="patient-list">

        {doctors.map((doctor) => (

          <div
            key={doctor.id}
            className="patient-card"
          >

            <h3>{doctor.name}</h3>

            <p>
              <strong>Specialization:</strong>
              {" "}
              {doctor.specialization}
            </p>

            <p>
              <strong>Experience:</strong>
              {" "}
              {doctor.experience} years
            </p>

            <p>
              <strong>Contact:</strong>
              {" "}
              {doctor.contact}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Doctors;