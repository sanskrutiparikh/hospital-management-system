import { useState } from "react";

import "../styles/Billing.css";

function Billing() {

  const [patientName, setPatientName]
    = useState("");

  const [consultation, setConsultation]
    = useState("");

  const [medicine, setMedicine]
    = useState("");

  const [room, setRoom]
    = useState("");

  const [bills, setBills]
    = useState([]);

  const handleSubmit = (e) => {

    e.preventDefault();

    const total =
      Number(consultation) +
      Number(medicine) +
      Number(room);

    const newBill = {

      id: Date.now(),

      patientName,

      consultation,

      medicine,

      room,

      total
    };

    setBills([...bills, newBill]);

    setPatientName("");

    setConsultation("");

    setMedicine("");

    setRoom("");
  };

  return (

    <div className="billing-container">

      <h1 className="billing-title">
        Billing Management
      </h1>

      {/* FORM */}

      <div className="billing-form">

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Patient Name"
            value={patientName}
            onChange={(e) =>
              setPatientName(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Consultation Fee"
            value={consultation}
            onChange={(e) =>
              setConsultation(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Medicine Charges"
            value={medicine}
            onChange={(e) =>
              setMedicine(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Room Charges"
            value={room}
            onChange={(e) =>
              setRoom(e.target.value)
            }
          />

          <button type="submit">

            Generate Bill

          </button>

        </form>

      </div>

      {/* BILL CARDS */}

      <div className="bill-grid">

        {bills.map((bill) => (

          <div
            key={bill.id}
            className="bill-card"
          >

            <h2>
              {bill.patientName}
            </h2>

            <p>
              Consultation:
              ₹ {bill.consultation}
            </p>

            <p>
              Medicine:
              ₹ {bill.medicine}
            </p>

            <p>
              Room:
              ₹ {bill.room}
            </p>

            <hr />

            <h3>
              Total:
              ₹ {bill.total}
            </h3>

            <span className="paid-status">

              Paid

            </span>

          </div>

        ))}

      </div>

    </div>
  );
}

export default Billing;