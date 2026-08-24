import { useState, useEffect } from "react";
import "./App.css";

const META = {
  posts: { label: 'Posts', desc: 'All posts from JSONPlaceholder', icon: 'fa-file-lines', color: '#7c6ef5' },
  comments: { label: 'Comments', desc: 'User comments on posts', icon: 'fa-comments', color: '#06b6d4' },
  albums: { label: 'Albums', desc: 'Photo album collections', icon: 'fa-layer-group', color: '#ec4899' },
  photos: { label: 'Photos', desc: 'Photos from all albums', icon: 'fa-image', color: '#3b82f6' },
  todos: { label: 'Todos', desc: 'Todo items with completion status', icon: 'fa-list-check', color: '#10b981' },
  users: { label: 'Users', desc: 'Registered user profiles', icon: 'fa-users', color: '#8b5cf6' },
};

export default function App() {
  const [resource, setResource] = useState(null);
  const [data, setData] = useState([]);

  // Fetch data whenever the sel
  // ected resource changes
  useEffect(() => {
    if (resource) {
      fetch(`https://jsonplaceholder.typicode.com/${resource}`)
        .then(response => response.json())
        .then(json => setData(json.slice(0, 50))); // Limit to 50 items
    }
  }, [resource]);

  // SCREEN 1: Home Page (Choose a category)
  if (!resource) {
    return (
      <div className="container">
        <header className="header">
          <h1>JSON Explorer</h1>
          <p>Select a category to view data</p>
        </header>

        <div className="category-grid">
          {Object.entries(META).map(([key, info]) => (
            <div className="category-card" key={key} onClick={() => setResource(key)}>
              <div className="icon-wrapper" style={{ color: info.color }}>
                <i className={`fa-solid ${info.icon}`}></i>
              </div>
              <h2>{info.label}</h2>
              <p>{info.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="container">
      <header className="header">
        <h1>{META[resource].label}</h1>
        <button className="back-btn" onClick={() => setResource(null)}>
          <i className="fa-solid fa-arrow-left"></i> Go Back
        </button>
      </header>

      <div className="data-grid">
        {data.map(item => (
          <div className="data-card" key={item.id}>
            <h3>{item.name || item.title}</h3>
            <p>{item.email || item.body || `Completed: ${item.completed}`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
