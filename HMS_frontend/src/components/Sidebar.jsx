import {
  FaHospitalUser,
  FaUserInjured,
  FaChartLine,
  FaMoneyBillWave
} from "react-icons/fa";

import { Link } from "react-router-dom";

import "./Sidebar.css";

function Sidebar() {

  return (

    <div className="sidebar">

      {/* LOGO */}

      <h2 className="logo">
        HMS
      </h2>

      {/* MENU */}

      <ul>

        {/* DASHBOARD */}

        <li>

          <Link to="/">

            <FaChartLine />

            Dashboard

          </Link>

        </li>

        {/* PATIENTS */}

        <li>

          <Link to="/patients">

            <FaUserInjured />

            Patients

          </Link>

        </li>

        {/* DOCTORS */}

        <li>

          <Link to="/doctors">

            <FaHospitalUser />

            Doctors

          </Link>

        </li>

        {/* BILLING */}

        <li>

          <Link to="/billing">

            <FaMoneyBillWave />

            Billing

          </Link>

        </li>

      </ul>

    </div>
  );
}

export default Sidebar;