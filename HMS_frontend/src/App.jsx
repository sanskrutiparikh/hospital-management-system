import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";

import Patients from "./pages/Patients";

import Doctors from "./pages/Doctors";

function App() {

  return (

    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/patients"
          element={<Patients />}
        />

        <Route
          path="/doctors"
          element={<Doctors />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;