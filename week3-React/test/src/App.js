import { useState, useEffect } from "react";
import "./App.css";

const categories = ["posts", "comments", "albums", "photos", "todos", "users"];

export default function App() {
  const [resource, setResource] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (resource) {
      fetch(`https://jsonplaceholder.typicode.com/${resource}`)
        .then(res => res.json())
        .then(json => setData(json.slice(0, 30)));
    }
  }, [resource]);

  if (!resource) {
    return (
      <div className="container">
        <h1>JSON Explorer</h1>
        <div className="category-grid">
          {categories.map(name => (
            <button key={name} className="category-card" onClick={() => setResource(name)}>
              {name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{resource}</h1>
      <button className="back-btn" onClick={() => setResource(null)}>Go Back</button>
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
