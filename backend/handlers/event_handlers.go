package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"event_management/backend/database"
	"event_management/backend/models"
	"event_management/backend/utils"

	"github.com/gorilla/mux"
)



type eventRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Date        string `json:"date"`
	Location    string `json:"location"`
	Capacity    int    `json:"capacity"`
}

func GetEventsHandler(w http.ResponseWriter, r *http.Request) {
	events, err := database.GetAllEvents()
	if err != nil {
		http.Error(w, "Error retrieving events", http.StatusInternalServerError)
		log.Printf("Error retrieving events: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(events)
}

func RegisterForEventHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	userRole, _ := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "attendee" {
		http.Error(w, "Only attendees can register", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	eventIDStr, ok := vars["id"]
	if !ok {
		http.Error(w, "Missing event ID", http.StatusBadRequest)
		return
	}

	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	if _, err := database.GetEventByID(eventID); err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	isRegistered, err := database.IsUserRegisteredForEvent(userID, eventID)
	if err != nil {
		http.Error(w, "Error checking registration status", http.StatusInternalServerError)
		return
	}

	if isRegistered {
		http.Error(w, "Already registered for this event", http.StatusConflict)
		return
	}

	reg := models.Registration{
		UserID:           userID,
		EventID:          eventID,
		RegistrationDate: time.Now().Format("2006-01-02 15:04:05"),
		Status:           "confirmed",
	}

	registrationID, err := database.CreateRegistration(reg)
	if err != nil {
		if err.Error() == "event is full" {
			http.Error(w, "Event at full capacity", http.StatusBadRequest)
		} else {
			http.Error(w, "Error creating registration", http.StatusInternalServerError)
			log.Printf("Error creating registration: %v", err)
		}
		return
	}

	reg.ID = registrationID

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reg)
}

func CancelRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	regIDStr, ok := vars["id"]
	if !ok {
		http.Error(w, "Missing registration ID", http.StatusBadRequest)
		return
	}

	regID, err := strconv.Atoi(regIDStr)
	if err != nil {
		http.Error(w, "Invalid registration ID", http.StatusBadRequest)
		return
	}

	isOwner, err := database.IsRegistrationOwner(regID, userID)
	if err != nil {
		http.Error(w, "Error verifying ownership", http.StatusInternalServerError)
		return
	}
	if !isOwner {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := database.CancelRegistration(regID); err != nil {
		http.Error(w, "Error cancelling registration", http.StatusInternalServerError)
		log.Printf("Error cancelling registration: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Registration cancelled"})
}

func GetOrganizerEventsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	userRole, _ := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "organiser" {
		http.Error(w, "Only organisers can view their events", http.StatusForbidden)
		return
	}

	events, err := database.GetEventsByOrganizerID(userID)
	if err != nil {
		http.Error(w, "Error retrieving events", http.StatusInternalServerError)
		log.Printf("Error retrieving events: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func GetEventRegistrationsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	userRole, _ := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "organiser" {
		http.Error(w, "Only organisers can view registrations", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	eventIDStr, ok := vars["id"]
	if !ok {
		http.Error(w, "Missing event ID", http.StatusBadRequest)
		return
	}

	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	isOwner, err := database.IsEventOrganizer(eventID, userID)
	if err != nil {
		http.Error(w, "Error verifying ownership", http.StatusInternalServerError)
		return
	}
	if !isOwner {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	regs, err := database.GetRegistrationsByEventID(eventID)
	if err != nil {
		http.Error(w, "Error retrieving registrations", http.StatusInternalServerError)
		log.Printf("Error: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(regs)
}

func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	userRole, _ := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "organiser" {
		writeJSONError(w, "Only organisers can create events", http.StatusForbidden)
		return
	}

	var req eventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if req.Name == "" || req.Date == "" || req.Location == "" {
		writeJSONError(w, "Name, date, location required", http.StatusBadRequest)
		return
	}
		eventDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		writeJSONError(w, "Date must be YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	e := models.Event{
		OrganizerID: userID,
		Name:        req.Name,
		Description: req.Description,
		Date:        eventDate.Format("2006-01-02"),
		Location:    req.Location,
		Capacity:    req.Capacity,
	}

	created, err := database.CreateEvent(e)
	if err != nil {
		log.Printf("Error: %v", err)
		writeJSONError(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

func UpdateEventHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr, ok := vars["id"]
	if !ok {
		writeJSONError(w, "Event ID required", http.StatusBadRequest)
		return
	}
	eventID, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSONError(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	userRole, _ := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "organiser" {
		writeJSONError(w, "Only organisers can update events", http.StatusForbidden)
		return
	}

	var req eventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "Invalid body format", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if req.Name == "" || req.Date == "" || req.Location == "" {
		writeJSONError(w, "Name, date, location required", http.StatusBadRequest)
		return
	}

	eDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		writeJSONError(w, "Date must be YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	e := models.Event{
		ID:          eventID,
		OrganizerID: userID,
		Name:        req.Name,
		Description: req.Description,
		Date:        eDate.Format("2006-01-02"),
		Location:    req.Location,
		Capacity:    req.Capacity,
	}

	updated, err := database.UpdateEvent(e)
	if err != nil {
		switch err.Error() {
		case "event not found":
			writeJSONError(w, "Not found", http.StatusNotFound)
		case "no permission or event not found":
			writeJSONError(w, "Forbidden", http.StatusForbidden)
		default:
			writeJSONError(w, "Failed to update", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}

func CancelEventHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	userRole, _ := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "organiser" {
		http.Error(w, "Only organisers can cancel events", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	eventIDStr, ok := vars["id"]
	if !ok {
		http.Error(w, "Missing event ID", http.StatusBadRequest)
		return
	}

	eventID, err := strconv.Atoi(eventIDStr)
	if err != nil {
		http.Error(w, "Invalid event ID", http.StatusBadRequest)
		return
	}

	isOwner, err := database.IsEventOrganizer(eventID, userID)
	if err != nil {
		http.Error(w, "Error verifying ownership", http.StatusInternalServerError)
		return
	}
	if !isOwner {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	if err := database.CancelEvent(eventID); err != nil {
		http.Error(w, "Error cancelling event", http.StatusInternalServerError)
		log.Printf("Error cancelling event: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Event cancelled"})
}
