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

  // --- HELPER: CALCULATE DAYS REMAINING ---
  // We use this single source of truth for both Color and Filtering
  const getDaysRemaining = (dateString) => {
    if (!dateString || dateString === 'No Date') return 999; // Treat No Date as far future
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const [year, month, day] = dateString.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- LOGIC 1: COLOR (VISUAL) ---
  const getDateColorClass = (dateString) => {
    const diffDays = getDaysRemaining(dateString);

    if (dateString === 'No Date') return 'neutral';

    // VISUAL RULE: Today (0) and Past (<0) are RED
    if (diffDays <= 0) return 'red';      
    if (diffDays <= 3) return 'yellow';  
    return 'green';                      
  };

  // --- LOGIC 2: FILTERING (LOCATION) ---
  const filteredTickets = tickets.filter(ticket => {
    const matchesAssignee = filterAssignee === 'All' || ticket.assignee === filterAssignee;
    let matchesTime = true;
    
    const diffDays = getDaysRemaining(ticket.due_date);
    
    if (filterTime === 'Previous') {
      // "Previous" means STRICTLY Past (Yesterday or older)
      matchesTime = diffDays < 0; 
    } 
    else if (filterTime === 'Upcoming') {
      // "Upcoming" means Today (0) or Future (>0)
      matchesTime = diffDays >= 0; 
    }
    
    return matchesAssignee && matchesTime;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (a.due_date === 'No Date') return 1;
    if (b.due_date === 'No Date') return -1;
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
              <option value="Upcoming">📅 Today & Upcoming</option>
              <option value="Previous">⚠️ Overdue</option>
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