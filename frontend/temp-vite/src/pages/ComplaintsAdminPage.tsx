import React, { useEffect, useState } from 'react';

interface Complaint {
  complaint_id: number;
  complaint_text: string;
  created_at: string;
  resolved: boolean;
  customer_id: number;
}

const ComplaintsAdminPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5001/api/complaints', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => setComplaints(data))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = (complaint_id: number) => {
    fetch(`http://localhost:5001/api/admin/complaints/${complaint_id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then((updated: Complaint) => {
        setComplaints(prev => prev.map(c => c.complaint_id === updated.complaint_id ? updated : c));
      });
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Complaints Management</h2>
      {loading ? (
        <div>Loading complaints...</div>
      ) : (
        <table className="min-w-full bg-white rounded shadow overflow-hidden">
          <thead>
            <tr className="bg-blue-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Customer ID</th>
              <th className="py-2 px-4 text-left">Complaint</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c, idx) => (
              <tr key={c.complaint_id ?? idx} className={c.resolved ? 'bg-green-50' : 'bg-red-50'}>
                <td className="py-2 px-4">{c.complaint_id}</td>
                <td className="py-2 px-4">{c.customer_id}</td>
                <td className="py-2 px-4">{c.complaint_text}</td>
                <td className="py-2 px-4">{new Date(c.created_at).toLocaleString()}</td>
                <td className="py-2 px-4">
                  {c.resolved ? (
                    <span className="text-green-700 font-semibold">Resolved</span>
                  ) : (
                    <span className="text-red-700 font-semibold">Pending</span>
                  )}
                </td>
                <td className="py-2 px-4">
                  {!c.resolved && (
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                      onClick={() => handleResolve(c.complaint_id)}
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ComplaintsAdminPage; 