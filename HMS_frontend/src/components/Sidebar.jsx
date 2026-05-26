import {
  FaHospitalUser,
  FaUserInjured,
  FaChartLine
} from "react-icons/fa";

import "./Sidebar.css";

function Sidebar() {

  return (

    <div className="sidebar">

      <h2 className="logo">
        HMS
      </h2>

      <ul>

        <li>
          <FaChartLine />
          Dashboard
        </li>

        <li>
          <FaUserInjured />
          Patients
        </li>

        <li>
          <FaHospitalUser />
          Doctors
        </li>

      </ul>

    </div>
  );
}

export default Sidebar;