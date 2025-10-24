# 🎪 EventEase - Event Management System

A full-stack event management web application built with **React.js** frontend, **Go (Golang)** backend, and **MySQL** database. EventEase provides a comprehensive platform for managing events with role-based access control for admins, organizers, and attendees.

## 🌟 Features

### 🔐 Authentication & Authorization
- Secure user registration and login with JWT tokens
- Role-based access control (Admin, Organizer, Attendee)
- Protected routes and API endpoints

### 👑 Admin Features
- Manage all users (view, deactivate, change roles)
- Monitor all events across the platform
- Delete or disable inappropriate events
- User activity monitoring

### 🎯 Organizer Features
- Create and manage events
- View attendee lists for their events
- Edit or cancel their own events
- Event analytics and registration stats

### 🎫 Attendee Features
- Browse all available events
- Register for events
- View registered events
- Cancel event registrations

## 🛠️ Tech Stack

### Frontend
- **React.js 19** - Modern UI library
- **React Router DOM** - Client-side routing
- **Vite** - Fast build tool and development server
- **CSS3** - Responsive styling

### Backend
- **Go 1.24.2** - High-performance backend
- **Gorilla Mux** - HTTP router and URL matcher
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Database
- **MySQL 8.0** - Relational database
- **Database migrations** - Structured schema management

### DevOps
- **Docker & Docker Compose** - Containerization
- **Multi-stage builds** - Optimized container images

## 🏗️ Project Structure

```
event_management/
├── backend/                    # Go backend application
│   ├── cmd/
│   │   └── main.go            # Application entry point
│   ├── database/              # Database operations
│   │   ├── init.go           # Database initialization
│   │   ├── user_operations.go
│   │   ├── event_operations.go
│   │   ├── user_auth_operations.go
│   │   └── queries/          # SQL queries
│   ├── handlers/             # HTTP handlers
│   │   ├── auth/             # Authentication handlers
│   │   ├── user_handlers.go
│   │   └── event_handlers.go
│   ├── models/               # Data models
│   │   ├── user.go
│   │   ├── event.go
│   │   ├── registration.go
│   │   └── auth_response.go
│   ├── utils/                # Utility functions
│   │   ├── jwt.go
│   │   └── context_keys.go
│   ├── Dockerfile            # Backend container
│   └── go.mod                # Go dependencies
├── frontend/frontend/          # React frontend application
│   ├── src/
│   │   ├── pages/            # React components
│   │   │   ├── home.jsx
│   │   │   ├── login.jsx
│   │   │   ├── signup.jsx
│   │   │   ├── admin_panel.jsx
│   │   │   └── organizer_panel.jsx
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Application entry point
│   ├── public/               # Static assets
│   ├── Dockerfile            # Frontend container
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
├── docker-compose.yaml        # Multi-container setup
└── README.md                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- **Docker** and **Docker Compose** installed
- **Git** for cloning the repository

### Quick Start with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/saarthak-s/Event-management.git
   cd Event-management
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - MySQL Database: localhost:3306

### Manual Setup (Development)

#### Backend Setup
1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Go dependencies**
   ```bash
   go mod download
   ```

3. **Set up environment variables**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=3306
   export DB_USER=root
   export DB_PASSWORD=1234
   export DB_NAME=event_management
   export FRONTEND_URL=http://localhost:3000
   ```

4. **Start MySQL database**
   ```bash
   docker run --name event-mysql -e MYSQL_ROOT_PASSWORD=1234 -e MYSQL_DATABASE=event_management -p 3306:3306 -d mysql:lts
   ```

5. **Run the backend server**
   ```bash
   go run cmd/main.go
   ```

#### Frontend Setup
1. **Navigate to frontend directory**
   ```bash
   cd frontend/frontend
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   echo "REACT_APP_BACKEND_URL=http://localhost:8080" > .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /validate_token` - Token validation
- `POST /logout` - User logout

### Admin Routes (`/admin/*`)
- `GET /admin/users` - Get all users
- `POST /admin/users/deactivate` - Deactivate user
- `GET /admin/events` - Get all events
- `DELETE /admin/events/{id}` - Delete event

### Organizer Routes (`/organizer/*`)
- `POST /organizer/events` - Create event
- `GET /organizer/events` - Get organizer's events
- `PUT /organizer/events/{id}` - Update event
- `DELETE /organizer/events/{id}` - Delete event
- `GET /organizer/events/{id}/attendees` - Get event attendees

### Public Routes
- `GET /events` - Get all public events
- `POST /events/{id}/register` - Register for event
- `DELETE /events/{id}/unregister` - Unregister from event
- `GET /user/events` - Get user's registered events

## 🐳 Docker Configuration

The application uses Docker Compose for easy deployment:

### Services
- **MySQL**: Database service with persistent volume
- **Backend**: Go application container
- **Frontend**: React application container

### Health Checks
- MySQL health check ensures database is ready before starting backend
- Dependency management between services

### Environment Variables
- Database credentials
- Service URLs
- CORS configuration

## 🧪 Testing

### Backend Testing
```bash
cd backend
go test ./...
```

### Frontend Testing
```bash
cd frontend/frontend
npm test
```

## 🔧 Configuration

### Database Configuration
- **Host**: MySQL container (event-mysql)
- **Port**: 3306
- **Database**: event_management
- **Credentials**: root/1234 (development only)

### Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Role-based access control
- Input validation and sanitization

## 📱 User Flows

### Organizer Workflow
1. Sign up/Login → Dashboard
2. Create Event → Set details, date, location
3. Manage Events → View/Edit/Delete
4. View Attendees → Track registrations

### Attendee Workflow
1. Sign up/Login → Browse Events
2. Register for Events → Secure registration
3. View Registered Events → Manage participation
4. Cancel Registration → Easy opt-out

### Admin Workflow
1. Login → Admin Dashboard
2. Manage Users → View/Deactivate users
3. Monitor Events → Oversee all events
4. Content Moderation → Remove inappropriate content

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Saarthak** - *Initial work* - [saarthak-s](https://github.com/saarthak-s)

## 🙏 Acknowledgments

- React.js community for excellent documentation
- Go community for robust libraries
- Docker for containerization made easy
- MySQL for reliable database management

## 📞 Support

For support, email your-email@domain.com or create an issue in the GitHub repository.

---

**EventEase** - Making event management simple and efficient! 🎉