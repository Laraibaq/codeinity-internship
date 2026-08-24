import React, { useState } from 'react';

function ChildComponent() {
  const [retrievedFeedback, setRetrievedFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const getData = () => {
    const rawData = localStorage.getItem('userFeedback');
    if (!rawData) {
      setErrorMsg('No feedback data found in Local Storage.');
      setRetrievedFeedback(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      setRetrievedFeedback(parsed);
      setErrorMsg('');
    } catch (err) {
      setErrorMsg('Error parsing data from Local Storage.');
    }
  };

  return (
    <div className="box child-box">
      <h3>Child Component</h3>
      <button onClick={getData}>Retrieve Saved Feedback</button>
      
      {errorMsg && <p className="status-msg error">{errorMsg}</p>}

      {retrievedFeedback && (
        <div className="card-detail">
          <h4>Retrieved Details:</h4>
          <p><strong>Name:</strong> {retrievedFeedback.name}</p>
          <p><strong>Email:</strong> {retrievedFeedback.email}</p>
          <p><strong>Rating:</strong> {retrievedFeedback.rating} / 5</p>
          {retrievedFeedback.comments && <p><strong>Comments:</strong> {retrievedFeedback.comments}</p>}
          <p className="timestamp">Saved At: {retrievedFeedback.savedAt}</p>
        </div>
      )}
    </div>
  );
}

export default ChildComponent;
