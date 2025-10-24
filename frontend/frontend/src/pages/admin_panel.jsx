import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin_panel.css';

function AdminPanel({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeUserTab, setActiveUserTab] = useState('all');
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await fetch('http://localhost:8080/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log("Error")
          onLogout();
          navigate("/login");
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load user data. Please try again later.');
      setIsLoading(false);
    }
  }, [navigate, onLogout]);

  useEffect(() => {
    if (user && user.role === 'admin' && localStorage.getItem('token')) {
      fetchUsers();
    } else if (!localStorage.getItem('token')) {
      navigate("/login");
    }
  }, [user, navigate, fetchUsers]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    onLogout();
    navigate("/login");
  }, [navigate, onLogout]);

  const stats = useMemo(() => ({
    totalEvents: 24,
    totalUsers: userData.length,
    totalRegistrations: 342,
  }), [userData.length]);

  const filteredUsers = useMemo(() => {
    return activeUserTab === 'all'
      ? userData
      : userData.filter(user => user.role === activeUserTab);
  }, [activeUserTab, userData]);

  const handleDelete = useCallback(async (email, role) => {
    if (email === user.email && role === user.role) {
      setDeleteStatus({
        success: false,
        message: "You cannot delete your own account."
      });
      
      setTimeout(() => setDeleteStatus(null), 3000);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/admin/users/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: email,
          role: role
        }),
      });

      if (response.ok) {
        setDeleteStatus({
          success: true,
          message: `User ${email} has been deleted successfully.`
        });
        
        fetchUsers();
      } else {
        const errorData = await response.json();
        setDeleteStatus({
          success: false,
          message: errorData.message || 'Failed to delete user.'
        });
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteStatus({
        success: false,
        message: 'Failed to delete user due to a network error.'
      });
    }

    setTimeout(() => setDeleteStatus(null), 3000);
  }, [user, fetchUsers]);

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <h1>Event Management System</h1>
          <span className="admin-badge">Admin Panel</span>
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
                className={activeTab === 'users' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('users')}}
              >
                User Management
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'events' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('events')}}
              >
                Event Management
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
                className={activeTab === 'settings' ? 'active' : ''} 
                onClick={(e) => {e.preventDefault(); setActiveTab('settings')}}
              >
                Settings
              </a>
            </li>
          </ul>
        </div>

        <div className="admin-main">
          {deleteStatus && (
            <div className={`status-message ${deleteStatus.success ? 'success-message' : 'error-message'}`}>
              {deleteStatus.message}
            </div>
          )}
          
          {activeTab === 'dashboard' && (
            <>
              <h2>Dashboard</h2>
              
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Total Events</h3>
                  <div className="stat-value">{stats.totalEvents}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <div className="stat-value">{stats.totalUsers}</div>
                </div>
                <div className="stat-card">
                  <h3>Total Registrations</h3>
                  <div className="stat-value">{stats.totalRegistrations}</div>
                </div>
              </div>

              <h3>User Management</h3>
              <div className="search-bar">
                <input type="text" placeholder="Search users..." />
                <span className="search-icon">🔍</span>
              </div>
              
              {isLoading ? (
                <div className="loading-message">Loading user data...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="no-data">No users found</td>
                      </tr>
                    ) : (
                      userData.map((userData, index) => (
                        <tr key={index}>
                          <td>{userData.name}</td>
                          <td>{userData.email}</td>
                          <td>{userData.role}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-secondary">Edit</button>
                              <button 
                                className="btn btn-danger"
                                onClick={() => handleDelete(userData.email, userData.role)}
                              >
                                Delete
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

          {activeTab === 'users' && (
            <div>
              <h2>User Management</h2>
              {isLoading ? (
                <div className="loading-message">Loading user data...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  <div className="user-tabs">
                    <button 
                      className={`tab-button ${activeUserTab === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveUserTab('all')}
                    >
                      All Users
                    </button>
                    <button 
                      className={`tab-button ${activeUserTab === 'admin' ? 'active' : ''}`}
                      onClick={() => setActiveUserTab('admin')}
                    >
                      Admins
                    </button>
                    <button 
                      className={`tab-button ${activeUserTab === 'organiser' ? 'active' : ''}`}
                      onClick={() => setActiveUserTab('organiser')}
                    >
                      Organisers
                    </button>
                    <button 
                      className={`tab-button ${activeUserTab === 'attendee' ? 'active' : ''}`}
                      onClick={() => setActiveUserTab('attendee')}
                    >
                      Attendees
                    </button>
                  </div>
                  
                  <div className="search-bar">
                    <input type="text" placeholder="Search users..." />
                    <span className="search-icon">🔍</span>
                  </div>
                  
                  <div className="user-count">
                    Showing {filteredUsers.length} {activeUserTab === 'all' ? 'users' : activeUserTab + 's'}
                  </div>
                  
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="no-data">No users found</td>
                        </tr>
                      ) : (
                        filteredUsers.map((uData, index) => (
                          <tr key={index}>
                            <td>{uData.name}</td>
                            <td>{uData.email}</td>
                            <td>{uData.role}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn btn-secondary">Edit</button>
                                <button 
                                  className="btn btn-danger"
                                  onClick={() => handleDelete(uData.email, uData.role)}
                                >
                                  Delete
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

          {activeTab === 'events' && (
            <div>
              <h2>Event Management</h2>
              <p>Event management interface will be implemented here.</p>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div>
              <h2>Registration Management</h2>
              <p>Registration management interface will be implemented here.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2>Settings</h2>
              <p>Settings interface will be implemented here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;