const BASE_URL = "https://hospital-management-system-0zr0.onrender.com";

// ======================
// PATIENT APIs
// ======================

export const getPatients = async () => {

  const response = await fetch(
    `${BASE_URL}/patients`
  );

  return response.json();
};

export const addPatient = async (patient) => {

  const response = await fetch(
    `${BASE_URL}/patients`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(patient)
    }
  );

  return response.json();
};

export const deletePatient = async (id) => {

  await fetch(
    `${BASE_URL}/patients/${id}`,
    {
      method: "DELETE"
    }
  );
};

// ======================
// DOCTOR APIs
// ======================

export const getDoctors = async () => {

  const response = await fetch(
    `${BASE_URL}/doctors`
  );

  return response.json();
};

export const addDoctor = async (doctor) => {

  const response = await fetch(
    `${BASE_URL}/doctors`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(doctor)
    }
  );

  return response.json();
};

export const deleteDoctor = async (id) => {

  await fetch(
    `${BASE_URL}/doctors/${id}`,
    {
      method: "DELETE"
    }
  );
};