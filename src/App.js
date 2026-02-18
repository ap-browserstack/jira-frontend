import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // Make sure you have some basic CSS or remove this line

const App = () => {
  const [tickets, setTickets] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. DETERMINE API URL (Handles Localhost vs Vercel automatically)
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Fetch data from your backend
        const response = await axios.get(`${API_BASE_URL}/api/tickets`);
        setTickets(response.data);
        
        // 2. SEPARATE TICKETS INTO 'UPCOMING' AND 'PAST'
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset "Now" to Midnight this morning

        const upcomingList = [];
        const pastList = [];

        response.data.forEach(ticket => {
          if (!ticket.due_date || ticket.due_date === 'No Date') {
            // Decide where to put tickets with no date (optional)
            upcomingList.push(ticket); 
            return;
          }

          // 3. ROBUST DATE PARSING (Fixes the "Today" bug)
          // We split "YYYY-MM-DD" manually to ensure it's treated as Local Time, not UTC.
          const [year, month, day] = ticket.due_date.split('-').map(Number);
          const ticketDate = new Date(year, month - 1, day); // Month is 0-indexed in JS

          if (ticketDate >= today) {
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

  // 4. HELPER TO RENDER A LIST OF TICKETS
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
            <span className={`status ${ticket.status.toLowerCase().replace(" ", "-")}`}>
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
            <h2>⚠️ Past Due / Overdue ({past.length})</h2>
            {renderTicketList(past)}
          </section>

        </div>
      )}
    </div>
  );
};

export default App;