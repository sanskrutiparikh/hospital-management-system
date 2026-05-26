import {
  FaUserInjured,
  FaHospital,
  FaCalendarCheck,
  FaHeartbeat
} from "react-icons/fa";

import "../styles/Dashboard.css";

function Dashboard() {

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

          <h2>120</h2>

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

              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td>101</td>

              <td>Rahul Sharma</td>

              <td>Fever</td>

              <td>

                <span className="status active">

                  Active

                </span>

              </td>

            </tr>

            <tr>

              <td>102</td>

              <td>Ananya Patel</td>

              <td>Diabetes</td>

              <td>

                <span className="status stable">

                  Stable

                </span>

              </td>

            </tr>

            <tr>

              <td>103</td>

              <td>Rohan Verma</td>

              <td>Asthma</td>

              <td>

                <span className="status critical">

                  Critical

                </span>

              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Dashboard;