const fs = require('fs');
const path = require('path');

// --- 1. Define the File Content ---

const packageJson = `{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.13.5",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`;

const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Jira Radar</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

// YOUR App.js CODE
const appJs = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterTime, setFilterTime] = useState('All');

  // Use Env var for Vercel, localhost for dev
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(\`\${API_BASE_URL}/api/tickets\`);
        setTickets(response.data);
        setLoading(false);
      } catch (err) {
        setError("Could not connect to Backend.");
        setLoading(false);
      }
    };
    fetchTickets();
  }, [API_BASE_URL]);

  const getDateColorClass = (dateString) => {
    if (!dateString || dateString === 'No Date') return 'neutral';
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const due = new Date(dateString);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'red';
    if (diffDays <= 3) return 'yellow';
    return 'green';
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesAssignee = filterAssignee === 'All' || ticket.assignee === filterAssignee;
    let matchesTime = true;
    const color = getDateColorClass(ticket.due_date);
    if (filterTime === 'Previous') matchesTime = color === 'red'; 
    else if (filterTime === 'Upcoming') matchesTime = color !== 'red';
    return matchesAssignee && matchesTime;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.due_date === 'No Date') return 1;
    if (b.due_date === 'No Date') return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const uniqueAssignees = ['All', ...new Set(tickets.map(t => t.assignee))];

  if (loading) return <div className="loading-screen"><div className="spinner"></div>Loading Mission Control...</div>;
  if (error) return <div className="error-screen">⚠️ {error}</div>;

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="brand"><span className="brand-icon">⚡</span><h1>Jira Radar</h1></div>
        <div className="controls">
          <div className="filter-wrapper">
            <label>Assignee</label>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              {uniqueAssignees.map(user => <option key={user} value={user}>{user}</option>)}
            </select>
          </div>
          <div className="filter-wrapper">
            <label>Timeline</label>
            <select value={filterTime} onChange={e => setFilterTime(e.target.value)}>
              <option value="All">All Time</option>
              <option value="Upcoming">📅 Upcoming</option>
              <option value="Previous">⚠️ Overdue / Past</option>
            </select>
          </div>
        </div>
      </nav>
      <main className="board-content">
        <div className="board-header">
          <h2>Active Issues</h2>
          <span className="count-badge">{sortedTickets.length} issues found</span>
        </div>
        <div className="card-grid">
          {sortedTickets.map(ticket => {
             const colorClass = getDateColorClass(ticket.due_date);
             return (
              <a key={ticket.id} href={ticket.link} target="_blank" rel="noopener noreferrer" className="ticket-card-link">
                <div className="ticket-card">
                  <div className="card-top">
                    <span className="ticket-id">{ticket.key}</span>
                    <span className={\`status-pill \${ticket.status.replace(/[\\s/]+/g, '-').toLowerCase()}\`}>{ticket.status}</span>
                  </div>
                  <h3 className="ticket-subject">{ticket.title}</h3>
                  <div className="card-meta">
                    <div className="assignee-tag">
                      <div className="avatar">{ticket.assignee.charAt(0)}</div>
                      <span className="name">{ticket.assignee.split(' ')[0]}</span>
                    </div>
                    <div className={\`date-tag \${colorClass}\`}>
                      {ticket.due_date === 'No Date' ? 'No Due Date' : \`📅 \${ticket.due_date}\`}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
        {sortedTickets.length === 0 && <div className="empty-state"><h3>All Clear! 🎉</h3><p>No tickets match your current filters.</p></div>}
      </main>
    </div>
  );
}`;

// YOUR App.css CODE
const appCss = `:root { --bg-body: #F4F5F7; --bg-card: #FFFFFF; --text-primary: #172B4D; --text-secondary: #6B778C; --accent: #0052CC; --border: #DFE1E6; --shadow: 0px 4px 12px rgba(9, 30, 66, 0.08); }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: var(--bg-body); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
.app-container { display: flex; flex-direction: column; min-height: 100vh; }
.top-nav { background: white; padding: 0 40px; height: 70px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.brand { display: flex; align-items: center; gap: 10px; }
.brand h1 { font-size: 1.2rem; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
.controls { display: flex; gap: 20px; }
.filter-wrapper { display: flex; align-items: center; gap: 10px; background: var(--bg-body); padding: 6px 12px; border-radius: 6px; border: 1px solid transparent; transition: all 0.2s; }
.filter-wrapper:hover { border-color: #B3BAC5; background: white; }
.filter-wrapper label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary); }
.filter-wrapper select { background: transparent; border: none; font-size: 0.9rem; font-weight: 500; color: var(--text-primary); outline: none; cursor: pointer; }
.board-content { padding: 40px; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.board-header { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; }
.board-header h2 { font-size: 1.5rem; margin: 0; }
.count-badge { background: rgba(0, 82, 204, 0.1); color: var(--accent); padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.ticket-card { background: var(--bg-card); border-radius: 8px; padding: 20px; border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(9, 30, 66, 0.05); transition: transform 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
.ticket-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); border-color: var(--accent); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.ticket-id { font-family: monospace; color: var(--text-secondary); font-size: 0.85rem; }
.status-pill { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px; }
.status-pill.to-do { background: #dfe1e6; color: #42526e; }
.status-pill.in-progress { background: #deebff; color: #0052cc; }
.status-pill.done { background: #e3fcef; color: #006644; }
.status-pill { background: #eae6ff; color: #403294; }
.ticket-subject { font-size: 1rem; line-height: 1.4; margin: 0 0 20px 0; font-weight: 600; color: var(--text-primary); }
.card-meta { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F4F5F7; padding-top: 15px; }
.assignee-tag { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); }
.avatar { width: 24px; height: 24px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold; }
.loading-screen, .empty-state, .error-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; color: var(--text-secondary); text-align: center; }
.spinner { border: 4px solid rgba(0,0,0,0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: var(--accent); animation: spin 1s linear infinite; margin-bottom: 20px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.ticket-card-link { text-decoration: none; color: inherit; display: block; }
.date-tag { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); padding: 4px 8px; border-radius: 4px; }
.date-tag.red { background-color: #FFEBE6; color: #DE350B; border: 1px solid rgba(222, 53, 11, 0.2); }
.date-tag.yellow { background-color: #FFF0B3; color: #B67906; border: 1px solid rgba(255, 171, 0, 0.2); }
.date-tag.green { background-color: #E3FCEF; color: #006644; border: 1px solid rgba(0, 102, 68, 0.2); }
.date-tag.neutral { background-color: #F4F5F7; color: #6B778C; }`;

// --- 2. Create Directory Structure & Write Files ---

const dirs = [
  'public',
  'src'
];

// Create folders
dirs.forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    console.log(`✅ Created folder: ${dir}`);
  }
});

// Write files
const files = [
  { path: 'package.json', content: packageJson },
  { path: 'public/index.html', content: indexHtml },
  { path: 'src/index.js', content: indexJs },
  { path: 'src/App.js', content: appJs },
  { path: 'src/App.css', content: appCss },
];

files.forEach(file => {
  fs.writeFileSync(file.path, file.content);
  console.log(`✅ Created file: ${file.path}`);
});

console.log("\n🎉 SUCCESS! Frontend project created.");
console.log("👉 Now run 'npm install' to get started.");