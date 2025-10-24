# 📋 User Requirements Document

## 📌 Project Title:  
**EventEase** – An Event Management Web Application

## 🛠️ Tech Stack:
- **Frontend**: React.js  
- **Backend**: Go (Golang)  
- **Database**: MySQL  

## 👥 User Roles:
1. **Admin**
2. **Organizer**
3. **Attendee**

---

## 🔐 User Authentication & Authorization

- All users must be able to sign up and log in using email and password.
- Role-based access control should be implemented:
  - Admin has access to all features.
  - Organizers have access to manage their events and view attendees.
  - Attendees can view and register for events.

---

## 🎯 Functional Requirements

### 1. Admin
- ✅ Manage users (view, delete, change roles)
- ✅ View all events listed by all organizers
- ✅ Delete or disable inappropriate events
- ✅ Monitor user activities

### 2. Organizer
- ✅ Create and manage events
- ✅ View list of attendees for their events
- ✅ Edit or cancel their own events
- ✅ View analytics (optional: event registration stats)

### 3. Attendee
- ✅ Browse all available events
- ✅ Register for events
- ✅ View registered events
- ✅ Cancel event registration

---

## 🧾 Non-Functional Requirements

- ⚡ Fast and responsive UI (React)
- 🔐 Secure API endpoints with JWT
- 📈 Scalable backend (Go routines, efficient DB queries)
- 💾 Data persistence in MySQL with proper indexing
- 📱 Mobile-friendly design (responsive)

---

## 🔄 User Flow Summary

### Organizer Flow:
Login → Dashboard → Create Event → Manage Events → View Attendees

### Attendee Flow:
Login → Browse Events → Register → View Registered Events

### Admin Flow:
Login → Dashboard → Manage Users → Monitor Events