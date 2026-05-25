function Dashboard() {

  return (

    <div className="container">

      <h1 className="title">
        Hospital Dashboard
      </h1>

      <div className="patient-list">

        <div className="patient-card">

          <h3>Patients Module</h3>

          <p>
            Manage patient records
          </p>

        </div>

        <div className="patient-card">

          <h3>Doctors Module</h3>

          <p>
            Manage doctor records
          </p>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;