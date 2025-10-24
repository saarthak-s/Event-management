import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin_panel.css';

function OrganizerPanel({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await fetch('http://localhost:8080/organiser/events', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else if (response.status === 401) {
        console.error('Authentication failed. Redirecting to login.');
        onLogout();
        navigate("/login");
        return;
      } else {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load event data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, onLogout]);

  const fetchRegistrations = useCallback(async (eventId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await fetch(`http://localhost:8080/organiser/events/${eventId}/registrations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data);
      } else if (response.status === 401) {
        console.error('Authentication failed. Redirecting to login.');
        onLogout();
        navigate("/login");
        return;
      } else {
        throw new Error(`Failed to fetch registrations: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError('Failed to load registration data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, onLogout]);

  const createEvent = useCallback(async (eventData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await fetch('http://localhost:8080/organiser/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const createdEvent = await response.json();
        setStatusMessage({
          type: 'success',
          text: 'Event created successfully!'
        });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchEvents();
        return createdEvent;
      } else if (response.status === 401) {
        onLogout();
        navigate("/login");
        return null;
      } else {
        throw new Error(`Failed to create event: ${response.status}`);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, onLogout, fetchEvents]);

  const updateEvent = useCallback(async (eventId, eventData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/login");
        return;
      }
      
      const dataToSend = {
        ...eventData,
        capacity: parseInt(eventData.capacity, 10) || 0
      };

      const response = await fetch(`http://localhost:8080/organiser/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setStatusMessage({
          type: 'success',
          text: 'Event updated successfully!'
        });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchEvents();
        setActiveTab('events');
        setEventToEdit(null);
        return updatedEvent;
      } else if (response.status === 401) {
        onLogout();
        navigate("/login");
        return null;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update event: ${response.status}`);
      }
    } catch (err) {
      console.error('Error updating event:', err);
      setError(err.message || 'Failed to update event. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, onLogout, fetchEvents]);

  const cancelEvent = useCallback(async (eventId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await fetch(`http://localhost:8080/organiser/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setStatusMessage({
          type: 'success',
          text: 'Event cancelled successfully!'
        });
        setTimeout(() => setStatusMessage(null), 3000);
        fetchEvents();
        return true;
      } else if (response.status === 401) {
        onLogout();
        navigate("/login");
        return false;
      } else {
        throw new Error(`Failed to cancel event: ${response.status}`);
      }
    } catch (err) {
      console.error('Error cancelling event:', err);
      setError('Failed to cancel event. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, onLogout, fetchEvents]);

  useEffect(() => {
    setError(null);
    
    if (user && user.role === 'organiser' && localStorage.getItem('token')) {
      fetchEvents();
    } else if (!localStorage.getItem('token')) {
      navigate("/login");
    } else if (user && user.role !== 'organiser') {
      setError('You do not have permission to access the organizer dashboard');
      setTimeout(() => navigate('/'), 2000);
    }

    if (activeTab !== 'event-form') {
      setEventToEdit(null);
      setFormData({
        name: '',
        date: '',
        location: '',
        capacity: '',
        description: ''
      });
    }
  }, [user, navigate, fetchEvents, activeTab]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    onLogout();
    navigate("/login");
  }, [navigate, onLogout]);

  const stats = useMemo(() => ({
    totalEvents: events.length,
    totalRegistrations: events.reduce((sum, event) => sum + event.registeredCount, 0),
    upcomingEvents: events.filter(event => new Date(event.date) > new Date()).length
  }), [events]);

  const handleViewRegistrations = useCallback((eventId) => {
    const event = events.find(e => e.id === eventId);
    setSelectedEvent(event);
    fetchRegistrations(eventId);
    setActiveTab('registrations');
  }, [events, fetchRegistrations]);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    capacity: '',
    description: ''
  });

  useEffect(() => {
    if (eventToEdit) {
      const eventDate = new Date(eventToEdit.date);
      const formattedDate = eventDate.toISOString().split('T')[0];
      setFormData({
        name: eventToEdit.name || '',
        date: formattedDate || '',
        location: eventToEdit.location || '',
        capacity: eventToEdit.capacity !== undefined ? String(eventToEdit.capacity) : '',
        description: eventToEdit.description || ''
      });
    } else {
      setFormData({
        name: '',
        date: '',
        location: '',
        capacity: '',
        description: ''
      });
    }
  }, [eventToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.date || !formData.location) {
      setError('Please fill out required fields: Name, Date, and Location.');
      return;
    }

    const eventData = {
      name: formData.name,
      description: formData.description,
      date: formData.date,
      location: formData.location,
      capacity: parseInt(formData.capacity, 10) // Parse capacity to integer, default to 0 if empty or invalid
    };

    console.log('Submitting event data:', eventData);

    let success = false;
    if (eventToEdit) {
      const result = await updateEvent(eventToEdit.id, eventData);
      if (result) success = true;
    } else {
      const result = await createEvent(eventData);
      if (result) success = true;
    }

    if (success && !eventToEdit) {
      setFormData({
        name: '',
        date: '',
        location: '',
        capacity: '',
        description: ''
      });
      setActiveTab('events');
    }
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setActiveTab('event-form');
  };

  const handleCancelEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to cancel this event?')) {
      await cancelEvent(eventId);
    }
  };

  if (!user || user.role !== 'organiser') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <h1>Event Management System</h1>
          <span className="admin-badge">Organizer Panel</span>
        </div>
        <div className="admin-controls">
          <div className="user-welcome">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span className="user-name">{user.name}</span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-panel-content">
        <div className="admin-sidebar">
          <ul className="sidebar-menu">
            <li>
              <a 
                href="#" 
                className={activeTab === 'dashboard' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('dashboard')}}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'events' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('events')}}
              >
                My Events
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'event-form' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('event-form'); setEventToEdit(null);}}
              >
                {eventToEdit ? 'Edit Event' : 'Create Event'}
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'registrations' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('registrations')}}
              >
                Registrations
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'profile' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('profile')}}
              >
                Profile
              </a>
            </li>
          </ul>
        </div>

        <div className="admin-main">
          {statusMessage && (
            <div className={`status-message ${statusMessage.type}-message`}>
              {statusMessage.text}
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'dashboard' && (
            <>
              <h2>Dashboard</h2>
              
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>My Events</h3>
                  <div className="stat-value">{stats.totalEvents}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Registrations</h3>
                  <div className="stat-value">{stats.totalRegistrations}</div>
                </div>
                <div className="stat-card">
                  <h3>Upcoming Events</h3>
                  <div className="stat-value">{stats.upcomingEvents}</div>
                </div>
              </div>

              <h3>Recent Events</h3>
              <div className="search-bar">
                <input type="text" placeholder="Search events..." />
                <span className="search-icon">🔍</span>
              </div>
              
              {isLoading ? (
                <div className="loading-message">Loading event data...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Registrations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="no-data">No events found</td>
                      </tr>
                    ) : (
                      events.slice(0, 5).map((event) => (
                        <tr key={event.id}>
                          <td>{event.name}</td>
                          <td>{new Date(event.date).toLocaleDateString()}</td>
                          <td>{event.location}</td>
                          <td>{event.registeredCount}/{event.capacity}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleViewRegistrations(event.id)}
                              >
                                View Registrations
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'events' && (
            <div>
              <h2>My Events</h2>
              {isLoading ? (
                <div className="loading-message">Loading event data...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  <div className="search-bar">
                    <input type="text" placeholder="Search events..." />
                    <span className="search-icon">🔍</span>
                  </div>
                  
                  <div className="user-count">
                    Showing {events.length} events
                  </div>
                  
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Registration</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="no-data">No events found</td>
                        </tr>
                      ) : (
                        events.map((event) => (
                          <tr key={event.id}>
                            <td>{event.name}</td>
                            <td>{new Date(event.date).toLocaleDateString()}</td>
                            <td>{event.location}</td>
                            <td>{event.registeredCount}/{event.capacity}</td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => handleViewRegistrations(event.id)}
                                >
                                  Registrations
                                </button>
                                <button 
                                  className="btn btn-danger"
                                  onClick={() => handleCancelEvent(event.id)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {activeTab === 'event-form' && (
            <div>
              <h2>{eventToEdit ? 'Edit Event' : 'Create New Event'}</h2>
              <form className="event-form" onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label>Event Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Enter event name" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Event Date *</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleInputChange} 
                    placeholder="Event venue" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input 
                    type="number" 
                    name="capacity" 
                    value={formData.capacity} 
                    onChange={handleInputChange} 
                    placeholder="Maximum number of attendees (optional)" 
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    rows="4" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    placeholder="Event description (optional)"
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }} disabled={isLoading}>
                  {isLoading ? 'Saving...' : (eventToEdit ? 'Update Event' : 'Create Event')}
                </button>
                {eventToEdit && (
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ marginTop: '20px', marginLeft: '10px' }} 
                        onClick={() => { setActiveTab('events'); setEventToEdit(null); }}
                        disabled={isLoading}
                    >
                        Cancel Edit
                    </button>
                )}
              </form>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div>
              <h2>
                {selectedEvent ? `Registrations for ${selectedEvent.name}` : 'Event Registrations'}
                {selectedEvent && <span className="stat-badge" style={{ marginLeft: '10px', fontSize: '0.8rem' }}>
                  ({selectedEvent.registeredCount}/{selectedEvent.capacity})
                </span>}
              </h2>

              {!selectedEvent && (
                <div className="message-box">
                  Please select an event from the Events tab to view its registrations.
                </div>
              )}

              {selectedEvent && (
                <>
                  <div className="search-bar">
                    <input type="text" placeholder="Search registrations..." />
                    <span className="search-icon">🔍</span>
                  </div>
                  
                  {isLoading ? (
                    <div className="loading-message">Loading registration data...</div>
                  ) : error ? (
                    <div className="error-message">{error}</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Registration Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="no-data">No registrations found</td>
                          </tr>
                        ) : (
                          registrations.map((registration) => (
                            <tr key={registration.id}>
                              <td>{registration.userName}</td>
                              <td>{registration.email}</td>
                              <td>{new Date(registration.registrationDate).toLocaleDateString()}</td>
                              <td>
                                <span className={`status-badge ${registration.status}`}>{registration.status}</span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button className="btn btn-secondary">Contact</button>
                                  <button className="btn btn-danger">Cancel</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2>Organizer Profile</h2>
              <div className="profile-info">
                <div className="profile-field">
                  <label>Name:</label>
                  <span>{user.name}</span>
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                <div className="profile-field">
                  <label>Role:</label>
                  <span>Event Organizer</span>
                </div>
              </div>
              
              <button className="btn btn-secondary" style={{ marginTop: '20px' }}>
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizerPanel;