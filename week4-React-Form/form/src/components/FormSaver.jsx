import React, { useState } from 'react';

function FormSaver() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Developer');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSaveToLocalStorage = (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      setStatusMessage('⚠️ Please fill out both Name and Email fields.');
      return;
    }

    const userData = {
      name: name.trim(),
      email: email.trim(),
      role: role,
      savedAt: new Date().toLocaleTimeString(),
    };

    // Save data to localStorage under key 'userData'
    localStorage.setItem('userData', JSON.stringify(userData));

    setStatusMessage('✅ Data successfully saved to localStorage!');
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setStatusMessage('');
    }, 3000);
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setRole('Developer');
    setStatusMessage('');
  };

  return (
    <div className="card parent-card">
      <div className="card-header">
        <span className="badge parent-badge">Parent Component</span>
        <h2>Form Input (Data Saver)</h2>
        <p className="card-subtitle">
          Type input below and click <strong>"Save to Local Storage"</strong> to write data into browser storage.
        </p>
      </div>

      <form onSubmit={handleSaveToLocalStorage} className="form-container">
        <div className="form-group">
          <label htmlFor="name-input">Full Name</label>
          <input
            id="name-input"
            type="text"
            placeholder="e.g. Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-input">Email Address</label>
          <input
            id="email-input"
            type="email"
            placeholder="e.g. alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="role-select">Role / Profession</label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Developer">Frontend Developer</option>
            <option value="Designer">UI/UX Designer</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="Product Manager">Product Manager</option>
          </select>
        </div>

        {statusMessage && (
          <div className={`status-banner ${statusMessage.includes('⚠️') ? 'error' : 'success'}`}>
            {statusMessage}
          </div>
        )}

        <div className="button-group">
          <button type="submit" className="btn btn-primary">
            💾 Save to Local Storage
          </button>
          <button type="button" onClick={handleResetForm} className="btn btn-secondary">
            🔄 Reset Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormSaver;
