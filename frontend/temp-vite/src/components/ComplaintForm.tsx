import React, { useState } from 'react';

interface ComplaintFormProps {
  onSubmit: (complaint: string) => void;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSubmit }) => {
  const [complaint, setComplaint] = useState('');
  return (
    <form
      className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto"
      onSubmit={e => {
        e.preventDefault();
        onSubmit(complaint);
        setComplaint('');
      }}
    >
      <h2 className="text-2xl font-bold mb-4 text-green-700">Submit a Complaint</h2>
      <textarea
        className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        rows={5}
        placeholder="Describe your issue..."
        value={complaint}
        onChange={e => setComplaint(e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
      >
        Submit
      </button>
    </form>
  );
};

export default ComplaintForm; 