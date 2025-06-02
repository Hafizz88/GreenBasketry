import React from "react";

function Dashboard() {
  const role = localStorage.getItem("role");

  return (
    <div>
      <h2>Welcome, {role}!</h2>
      <p>This is the {role} dashboard.</p>
    </div>
  );
}

export default Dashboard;
