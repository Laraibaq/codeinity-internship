import React, { useState, useContext } from 'react';
import { ThemeUserContext, ThemeUserProvider } from './UserContext';

// Child Component
function ThemePreviewChild() {
  const { theme, userProfile } = useContext(ThemeUserContext);

  return (
    <div className={`box theme-box ${theme}`}>
      <h3>Child Component</h3>
      <p>Theme: <strong>{theme.toUpperCase()} MODE</strong></p>
      <div className="card-detail">
        <p><strong>Username:</strong> {userProfile.username}</p>
        <p><strong>Language:</strong> {userProfile.language}</p>
        <p><strong>Notifications:</strong> {userProfile.notifications ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  );
}

// Parent Component
function SettingsFormParent() {
  const { theme, toggleTheme, userProfile, updateUserProfile } = useContext(ThemeUserContext);
  const [username, setUsername] = useState(userProfile.username);
  const [language, setLanguage] = useState(userProfile.language);
  const [notifications, setNotifications] = useState(userProfile.notifications);
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserProfile({ username, language, notifications });
    setStatus('Context updated successfully.');
  };

  return (
    <div className="box">
      <h3>Parent Form</h3>
      
      <div className="theme-toggle-container">
        <span>Current Theme: <strong>{theme}</strong></span>
        <button type="button" onClick={toggleTheme} className="secondary-btn">
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
        <label>Username:</label>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label>Language:</label>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            style={{ width: 'auto', margin: 0 }}
          />
          Enable Notifications
        </label>

        <button type="submit">Save to Context</button>
        {status && <p className="status-msg success">{status}</p>}
      </form>
    </div>
  );
}

// Context Demo Wrapper
function ContextFormDemo() {
  return (
    <ThemeUserProvider>
      <h2>Context API Form</h2>
      <SettingsFormParent />
      <ThemePreviewChild />
    </ThemeUserProvider>
  );
}

export default ContextFormDemo;
