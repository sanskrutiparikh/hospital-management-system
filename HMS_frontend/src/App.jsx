import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";

import Patients from "./pages/Patients";

import Doctors from "./pages/Doctors";

import "./App.css";

function App() {

  return (

    <BrowserRouter>

      <div className="app-layout">

        <Sidebar />

        <div className="main-content">

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

        </div>

      </div>

    </BrowserRouter>
  );
}

export default App;