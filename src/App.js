import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterTime, setFilterTime] = useState('All');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tickets`);
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
    
    // 1. Get "Today" at Local Midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    // 2. Parse Due Date as Local Midnight (Fixes the timezone bug)
    const [year, month, day] = dateString.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    // 3. Calculate Difference
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 4. Logic Fix: "Today" (0) should NOT be red.
    if (diffDays < 0) return 'red';      // Strictly Past
    if (diffDays <= 3) return 'yellow';  // Today + Next 3 Days
    return 'green';                      // Future
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesAssignee = filterAssignee === 'All' || ticket.assignee === filterAssignee;
    let matchesTime = true;
    const color = getDateColorClass(ticket.due_date);
    
    // Since "Today" is now Yellow, it will NOT match 'red', so it goes to Upcoming.
    if (filterTime === 'Previous') matchesTime = color === 'red'; 
    else if (filterTime === 'Upcoming') matchesTime = color !== 'red';
    
    return matchesAssignee && matchesTime;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.due_date === 'No Date') return 1;
    if (b.due_date === 'No Date') return -1;
    // Simple string comparison is safer for sorting YYYY-MM-DD
    return a.due_date.localeCompare(b.due_date);
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
                    <span className={`status-pill ${ticket.status.replace(/[\s/]+/g, '-').toLowerCase()}`}>{ticket.status}</span>
                  </div>
                  <h3 className="ticket-subject">{ticket.title}</h3>
                  <div className="card-meta">
                    <div className="assignee-tag">
                      <div className="avatar">{ticket.assignee.charAt(0)}</div>
                      <span className="name">{ticket.assignee.split(' ')[0]}</span>
                    </div>
                    <div className={`date-tag ${colorClass}`}>
                      {ticket.due_date === 'No Date' ? 'No Due Date' : `📅 ${ticket.due_date}`}
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
}

export default App;