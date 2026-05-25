import { Link } from "react-router-dom";

function Navbar() {

  return (

    <nav className="navbar">

      <h2>HMS Dashboard</h2>

      <ul>

        <li>
          <Link to="/">
            Home
          </Link>
        </li>

        <li>
          <Link to="/patients">
            Patients
          </Link>
        </li>

        <li>
          <Link to="/doctors">
            Doctors
          </Link>
        </li>

      </ul>

    </nav>
  );
}

export default Navbar;