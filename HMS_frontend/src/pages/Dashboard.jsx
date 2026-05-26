import {
  FaUserInjured,
  FaHospital,
  FaCalendarCheck,
  FaHeartbeat
} from "react-icons/fa";

import { useEffect, useState } from "react";

import { getPatients } from "../services/api";

import "../styles/Dashboard.css";

function Dashboard() {

  const [patients, setPatients]
    = useState([]);

  useEffect(() => {

    loadPatients();

  }, []);

  const loadPatients = async () => {

    const data = await getPatients();

    setPatients(data);
  };

  return (

    <div className="dashboard">

      {/* HERO SECTION */}

      <div className="hero-section">

        <div>

          <h1>
            Welcome Back 👋
          </h1>

          <p>
            Manage patients, appointments,
            and hospital operations easily.
          </p>

        </div>

      </div>

      {/* STATS GRID */}

      <div className="stats-grid">

        <div className="stat-card">

          <FaUserInjured className="stat-icon" />

          <h2>{patients.length}</h2>

          <p>Total Patients</p>

        </div>

        <div className="stat-card">

          <FaHospital className="stat-icon" />

          <h2>25</h2>

          <p>Total Doctors</p>

        </div>

        <div className="stat-card">

          <FaCalendarCheck className="stat-icon" />

          <h2>45</h2>

          <p>Appointments</p>

        </div>

        <div className="stat-card">

          <FaHeartbeat className="stat-icon" />

          <h2>12</h2>

          <p>Emergency Cases</p>

        </div>

      </div>

      {/* RECENT PATIENTS */}

      <div className="recent-section">

        <h2>
          Recent Patients
        </h2>

        <table className="patients-table">

          <thead>

            <tr>

              <th>ID</th>

              <th>Name</th>

              <th>Disease</th>

            </tr>

          </thead>

          <tbody>

            {patients.map((patient) => (

              <tr key={patient.id}>

                <td>{patient.id}</td>

                <td>{patient.name}</td>

                <td>{patient.disease}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Dashboard;