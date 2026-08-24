import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import LocalStorageForm from './LocalStorageForm';
import ContextFormDemo from './ContextForm';
import ReduxFormDemo from './ReduxForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="container">
        {/* Navigation Bar */}
        <nav className="nav-buttons">
          <NavLink
            to="/localstorage"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Local Storage
          </NavLink>

          <NavLink
            to="/context"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Context API
          </NavLink>

          <NavLink
            to="/redux"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Redux Toolkit
          </NavLink>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Navigate to="/localstorage" replace />} />
          <Route path="/localstorage" element={<LocalStorageForm />} />
          <Route path="/context" element={<ContextFormDemo />} />
          <Route path="/redux" element={<ReduxFormDemo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
