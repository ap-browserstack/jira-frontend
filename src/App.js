import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; 

const App = () => {
  // REMOVED: const [tickets, setTickets] = useState([]); <-- This caused the error
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tickets`);
        // We don't need setTickets(response.data) anymore.
        
        // 1. GET "TODAY" AS A STRING (YYYY-MM-DD) in your local time
        const todayString = new Date().toLocaleDateString('en-CA');

        const upcomingList = [];
        const pastList = [];

        response.data.forEach(ticket => {
          if (!ticket.due_date) {
            upcomingList.push(ticket); 
            return;
          }

          // 2. STRING COMPARISON
          if (ticket.due_date >= todayString) {
            upcomingList.push(ticket);
          } else {
            pastList.push(ticket);
          }
        });

        setUpcoming(upcomingList);
        setPast(pastList);
        setLoading(false);

      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError("Could not connect to Backend.");
        setLoading(false);
      }
    };

    fetchTickets();
  }, [API_BASE_URL]);

  const renderTicketList = (list) => (
    <div className="ticket-grid">
      {list.length === 0 ? <p>No tickets found.</p> : list.map(ticket => (
        <div key={ticket.id} className="ticket-card">
          <h3>
            <a href={ticket.link} target="_blank" rel="noopener noreferrer">
              {ticket.key}
            </a>
            : {ticket.title}
          </h3>
          <div className="ticket-info">
            <span className={`status ${ticket.status ? ticket.status.toLowerCase().replace(" ", "-") : 'unknown'}`}>
              {ticket.status}
            </span>
            <span className="assignee">👤 {ticket.assignee}</span>
            <span className="date">📅 {ticket.due_date}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚀 Jira Dashboard</h1>
      </header>

      {loading && <div className="loading">Loading tickets...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="dashboard-container">
          
          <section className="section upcoming">
            <h2>📅 Upcoming & Due Today ({upcoming.length})</h2>
            {renderTicketList(upcoming)}
          </section>

          <hr />

          <section className="section past">
            <h2>⚠️ Past Due ({past.length})</h2>
            {renderTicketList(past)}
          </section>

        </div>
      )}
    </div>
  );
};

export default App;