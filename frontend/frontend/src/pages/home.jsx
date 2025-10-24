import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import './home.css';

function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });

  const showStatusMessage = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const fetchAvailableEvents = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:8080/events', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAvailableEvents(data || []);
    } catch (err) {
      console.error("Failed to fetch available events:", err);
      setError('Could not load available events. Please try again later.');
      setAvailableEvents([]);
    }
  }, []);

  const fetchMyRegistrations = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:8080/user/registrations', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Fetched registrations from backend:", data); // <-- Add this log
      setMyRegistrations(data || []);
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
      setError('Could not load your registrations. Please try again later.');
      setMyRegistrations([]);
    }
  }, []);

  const registerForEvent = useCallback(async (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `Failed to register: ${response.status}`);
      }
      showStatusMessage('success', 'Successfully registered for the event!');
      await Promise.all([fetchAvailableEvents(token), fetchMyRegistrations(token)]);
    } catch (err) {
      console.error("Failed to register:", err);
      setError(err.message || 'Registration failed. The event might be full or an error occurred.');
      showStatusMessage('error', err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, fetchAvailableEvents, fetchMyRegistrations]);

  const cancelRegistration = useCallback(async (registrationId) => {
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/registrations/${registrationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `Failed to cancel registration: ${response.status}`);
      }
      showStatusMessage('success', 'Successfully cancelled registration.');
      await Promise.all([fetchAvailableEvents(token), fetchMyRegistrations(token)]);
    } catch (err) {
      console.error("Failed to cancel registration:", err);
      setError(err.message || 'Failed to cancel registration.');
      showStatusMessage('error', err.message || 'Cancellation failed.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, fetchAvailableEvents, fetchMyRegistrations]);

  const fetchUserProfile = useCallback(async (token) => {
    try {
      const response = await fetch('http://localhost:8080/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || ''
        });
      } else {
        console.warn("Failed to fetch profile from API, using initial user data.");
        setProfileData({
          name: user?.name || '',
          email: user?.email || '',
          phone: ''
        });
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setProfileData({
        name: user?.name || '',
        email: user?.email || '',
        phone: ''
      });
    }
  }, [user]);

  const updateUserProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return navigate("/login");
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: profileData.name, phone: profileData.phone }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
      }

      const updatedProfile = await response.json();
      setProfileData({
        name: updatedProfile.name || profileData.name,
        email: profileData.email,
        phone: updatedProfile.phone || profileData.phone
      });

      showStatusMessage('success', 'Profile updated successfully!');
    } catch (err) {
      console.error("Failed to update profile:", err);
      showStatusMessage('error', err.message || 'Failed to update profile. Please try again.');
      setError(err.message || 'Failed to update profile.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError(null);

    const minLoadingTime = 600;
    const startTime = Date.now();

    Promise.all([
      fetchAvailableEvents(token),
      fetchMyRegistrations(token),
      fetchUserProfile(token)
    ])
      .catch(err => {
        console.error("Error during initial data fetch:", err);
        if (!error) {
          setError("An error occurred while loading initial data.");
        }
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);
        setTimeout(() => setIsLoading(false), remainingTime);
      });

  }, [navigate, fetchAvailableEvents, fetchMyRegistrations, fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    navigate("/login");
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filterEvents = (events) => {
    if (!searchTerm) return events;
    return events.filter(event =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const registeredEventIds = new Set(myRegistrations.map(reg => reg.eventId)); // <-- changed from reg.eventID
  const registrationMap = new Map(myRegistrations.map(reg => [reg.eventId, reg.id])); // <-- changed from reg.eventID

  const myEvents = availableEvents.filter(event => registeredEventIds.has(event.id));
  const otherEvents = availableEvents.filter(event => !registeredEventIds.has(event.id));

  const filteredMyEvents = filterEvents(myEvents);
  const filteredOtherEvents = filterEvents(otherEvents);

  if (!user && !localStorage.getItem('token')) return <div>Redirecting...</div>;

  const renderEventCard = (event, isRegistered) => {
    const registrationId = registrationMap.get(event.id);
    const isFull = event.registeredCount >= event.capacity;
    const eventDate = new Date(event.date);
    const isPastEvent = eventDate < new Date();

    return (
      <div key={event.id} className="event-card">
        <div className="event-header">
          <h3>{event.name}</h3>
          {isPastEvent && <span className="event-badge past">Past</span>}
          {isFull && !isRegistered && <span className="event-badge full">Full</span>}
          {isRegistered && <span className="event-badge registered">Registered</span>}
        </div>
        <p className="event-description">{event.description}</p>
        <div className="event-details">
          <div className="event-detail">
            <i className="event-icon date-icon">📅</i>
            <span>{eventDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="event-detail">
            <i className="event-icon location-icon">📍</i>
            <span>{event.location}</span>
          </div>
          <div className="event-detail">
            <i className="event-icon capacity-icon">👥</i>
            <span>{event.registeredCount} / {event.capacity}</span>
          </div>
        </div>
        <div className="event-actions">
          {isRegistered ? (
            <button
              className="btn btn-cancel"
              onClick={() => cancelRegistration(registrationId)}
              disabled={isLoading || isPastEvent}
            >
              {isLoading ? 'Cancelling...' : (isPastEvent ? 'Event Ended' : 'Cancel Registration')}
            </button>
          ) : (
            <button
              className={`btn btn-register ${(isFull || isPastEvent) ? 'btn-disabled' : ''}`}
              onClick={() => registerForEvent(event.id)}
              disabled={isLoading || isFull || isPastEvent}
            >
              {isLoading ? 'Registering...' : (isFull ? 'Event Full' : (isPastEvent ? 'Event Ended' : 'Register'))}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="homepage">
      <div className="homepage-header">
        <div className="system-title">
          <h1>Event Management System</h1>
        </div>
        <div className="navigation-tabs">
          <button
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            All Events
          </button>
          <button
            className={`nav-tab ${activeTab === 'my-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-events')}
          >
            My Events
          </button>
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
        </div>
        <div className="user-info">
          <span>Welcome, {profileData.name || user?.name || 'User'}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`status-message ${statusMessage.type}-message`}>
          {statusMessage.text}
        </div>
      )}
      {error && !statusMessage && <div className="error-message">{error}</div>}

      <div className="homepage-content">
        {isLoading ? (
          <div className="loading-skeleton">
            <div className="content-header">
              <div className="skeleton-title"></div>
              <div className="skeleton-search"></div>
            </div>
            <div className="event-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-description"></div>
                  <div className="skeleton-details"></div>
                  <div className="skeleton-button"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'events' && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>Discover Events</h2>
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search events by name, description or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchTerm('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {filteredOtherEvents.length > 0 ? (
                  <div className="event-grid">
                    {filteredOtherEvents.map(event => renderEventCard(event, false))}
                  </div>
                ) : (
                  <div className="no-events-message">
                    {searchTerm ? 'No events match your search criteria.' : 'No events available at the moment.'}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'my-events' && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>My Registered Events</h2>
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search your events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button
                        className="clear-search"
                        onClick={() => setSearchTerm('')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {filteredMyEvents.length > 0 ? (
                  <div className="event-grid">
                    {filteredMyEvents.map(event => renderEventCard(event, true))}
                  </div>
                ) : (
                  <div className="no-events-message">
                    {searchTerm ? 'None of your registered events match your search.' : 'You haven&apos;t registered for any events yet.'}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="tab-content">
                <div className="content-header">
                  <h2>My Profile</h2>
                </div>

                <div className="profile-container">
                  <form className="profile-form" onSubmit={updateUserProfile}>
                    <div className="profile-section">
                      <div className="profile-avatar">
                        <div className="avatar-placeholder">
                          {(profileData.name || '?').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="profile-fields">
                        <div className="form-group">
                          <label htmlFor="name">Full Name</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={profileData.name}
                            onChange={handleProfileChange}
                            className="profile-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="email">Email Address</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            className="profile-input"
                            disabled
                          />
                          <small>Email cannot be changed</small>
                        </div>

                        <div className="form-group">
                          <label htmlFor="phone">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={profileData.phone || ''}
                            onChange={handleProfileChange}
                            className="profile-input"
                            placeholder="Your phone number"
                          />
                        </div>

                        <div className="form-group">
                          <button type="submit" className="btn btn-primary">
                            Update Profile
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="profile-section">
                      <h3>Account Statistics</h3>
                      <div className="stats-container">
                        <div className="stat-box">
                          <div className="stat-value">{myEvents.length}</div>
                          <div className="stat-label">Registered Events</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">
                            {myEvents.filter(event => new Date(event.date) > new Date()).length}
                          </div>
                          <div className="stat-label">Upcoming Events</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value">
                            {myEvents.filter(event => new Date(event.date) < new Date()).length}
                          </div>
                          <div className="stat-label">Past Events</div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;