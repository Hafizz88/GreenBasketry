import React, { useEffect, useState } from 'react';
import ComplaintForm from '../components/ComplaintForm';

export default function ComplaintsPage({ customerId }) {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    fetch(`/api/complaints/customer/${customerId}`)
      .then(res => res.json())
      .then(setComplaints);
  }, [customerId]);

  const handleSubmit = (complaint_text) => {
    fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, complaint_text }),
    })
      .then(res => res.json())
      .then(newComplaint => setComplaints([newComplaint, ...complaints]));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-10">
      <ComplaintForm onSubmit={handleSubmit} />
      <div className="max-w-2xl mx-auto mt-8">
        <h3 className="text-xl font-semibold mb-4 text-green-800">Your Complaints</h3>
        <ul>
          {complaints.map(c => (
            <li
              key={c.complaint_id}
              className={`mb-4 p-4 rounded-lg shadow ${c.resolved ? 'bg-green-100' : 'bg-red-50'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{c.complaint_text}</span>
                <span className={`text-xs px-2 py-1 rounded ${c.resolved ? 'bg-green-300 text-green-900' : 'bg-red-200 text-red-800'}`}>
                  {c.resolved ? 'Resolved' : 'Pending'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 