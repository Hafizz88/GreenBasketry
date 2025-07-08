import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RiderHome = () => {
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');
    
    if (!user || role !== 'rider') {
      navigate('/');  // If user is not a rider, redirect to login
    } else {
      setRider(user);  // Set rider details if the user is a rider
    }
  }, [navigate]);

  if (!rider) return null;  // If no rider, don't render

  return (
    <div>
      <h2>Welcome, {rider.name}!</h2>
      <p>Vehicle: {rider.vehicle_info}</p>
      <p>Status: {rider.available !== undefined ? (rider.available ? 'Available' : 'Unavailable') : 'Status not set'}</p>
    </div>
  );
};

export default RiderHome;