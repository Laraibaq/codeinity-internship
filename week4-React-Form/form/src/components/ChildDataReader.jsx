import React, { useState } from 'react';

function ChildDataReader() {
  const [retrievedData, setRetrievedData] = useState(null);
  const [errorInfo, setErrorInfo] = useState('');

  const handleGetDataFromLocalStorage = () => {
    // Retrieve stored data from localStorage using key 'userData'
    const storedString = localStorage.getItem('userData');

    if (!storedString) {
      setErrorInfo('No data found in localStorage. Please save data in the form first!');
      setRetrievedData(null);
      return;
    }

    try {
      const parsedData = JSON.parse(storedString);
      setRetrievedData(parsedData);
      setErrorInfo('');
    } catch (err) {
      setErrorInfo('Failed to parse data from localStorage.');
      setRetrievedData(null);
    }
  };

  const handleClearDisplay = () => {
    setRetrievedData(null);
    setErrorInfo('');
  };

  const handleClearLocalStorage = () => {
    localStorage.removeItem('userData');
    setRetrievedData(null);
    setErrorInfo('localStorage cleared successfully!');
    setTimeout(() => setErrorInfo(''), 3000);
  };

  return (
    <div className="card child-card">
      <div className="card-header">
        <span className="badge child-badge">Child Component</span>
        <h2>Child Data Retriever</h2>
        <p className="card-subtitle">
          Click <strong>"Get Data from Local Storage"</strong> to read saved data from browser local storage independently.
        </p>
      </div>

      <div className="button-group">
        <button
          id="get-localstorage-btn"
          type="button"
          onClick={handleGetDataFromLocalStorage}
          className="btn btn-accent"
        >
          📥 Get Data from Local Storage
        </button>

        {retrievedData && (
          <button type="button" onClick={handleClearDisplay} className="btn btn-secondary">
            🙈 Hide Data
          </button>
        )}

        <button type="button" onClick={handleClearLocalStorage} className="btn btn-outline-danger">
          🗑️ Clear Storage
        </button>
      </div>

      {errorInfo && (
        <div className="status-banner warning">
          ⚠️ {errorInfo}
        </div>
      )}

      {retrievedData ? (
        <div className="retrieved-data-container">
          <div className="retrieved-header">
            <h3>Result from Local Storage</h3>
            <span className="timestamp">Saved at: {retrievedData.savedAt || 'N/A'}</span>
          </div>

          <div className="data-grid">
            <div className="data-item">
              <span className="data-label">Name:</span>
              <span className="data-value">{retrievedData.name}</span>
            </div>

            <div className="data-item">
              <span className="data-label">Email:</span>
              <span className="data-value">{retrievedData.email}</span>
            </div>

            <div className="data-item">
              <span className="data-label">Role:</span>
              <span className="data-value highlight">{retrievedData.role}</span>
            </div>
          </div>

          <div className="raw-json-box">
            <span className="raw-label">Raw JSON stored in localStorage:</span>
            <code>{JSON.stringify(retrievedData)}</code>
          </div>
        </div>
      ) : (
        !errorInfo && (
          <div className="placeholder-box">
            <p>Click the button above to fetch and inspect data from local storage.</p>
          </div>
        )
      )}
    </div>
  );
}

export default ChildDataReader;
