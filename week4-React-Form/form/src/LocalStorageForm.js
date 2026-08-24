import React, { useState } from 'react';
import ChildComponent from './ChildComponent';

function LocalStorageForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: '5',
    comments: '',
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setStatus('Please provide Name and Email.');
      return;
    }

    const payload = {
      ...formData,
      savedAt: new Date().toLocaleTimeString(),
    };

    localStorage.setItem('userFeedback', JSON.stringify(payload));
    setStatus('Feedback saved to Local Storage.');
  };

  return (
    <div>
      <h2>Local Storage Form</h2>

      {/* Parent Form */}
      <form onSubmit={handleSave} className="box">
        <h3>Parent Form</h3>
        
        <label>Full Name:</label>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
        />

        <label>Email Address:</label>
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
        />

        <label>Rating:</label>
        <select name="rating" value={formData.rating} onChange={handleChange}>
          <option value="5">5 / 5</option>
          <option value="4">4 / 5</option>
          <option value="3">3 / 5</option>
          <option value="2">2 / 5</option>
        </select>

        <label>Comments:</label>
        <textarea
          name="comments"
          placeholder="Comments..."
          value={formData.comments}
          onChange={handleChange}
          rows="3"
        />

        <button type="submit">Save to Local Storage</button>
        {status && <p className={`status-msg ${status.includes('Please') ? 'error' : 'success'}`}>{status}</p>}
      </form>

      {/* Child Component */}
      <ChildComponent />
    </div>
  );
}

export default LocalStorageForm;
