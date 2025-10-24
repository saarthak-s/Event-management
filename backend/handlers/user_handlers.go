package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"event_management/backend/database"
	"event_management/backend/utils"
)

func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}

func GetAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	userRole, ok := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "admin" {
		http.Error(w, "Only admins can view all users", http.StatusForbidden)
		return
	}

	users, err := database.GetAllUserRoles()
	if err != nil {
		http.Error(w, "Failed to retrieve user data", http.StatusInternalServerError)
		log.Printf("Error retrieving users: %v", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func DeactivateUserHandler(w http.ResponseWriter, r *http.Request) {
	userRole, ok := r.Context().Value(utils.UserRoleKey).(string)
	if !ok || userRole != "admin" {
		http.Error(w, "Only admins can deactivate users", http.StatusForbidden)
		return
	}

	var requestData struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if requestData.Email == "" || requestData.Role == "" {
		http.Error(w, "Email and role are required", http.StatusBadRequest)
		return
	}

	err := database.DeactivateUser(requestData.Email, requestData.Role)
	if err != nil {
		if strings.Contains(err.Error(), "no user found") {
			http.Error(w, err.Error(), http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			log.Printf("Error deactivating user: %v", err)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User deactivated successfully",
		"email":   requestData.Email,
		"role":    requestData.Role,
	})
}

func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := database.GetUserByID(userID)
	if err != nil {
		http.Error(w, "Error retrieving user profile", http.StatusInternalServerError)
		log.Printf("Error retrieving user profile: %v", err)
		return
	}

	user.Password = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(user); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func UpdateUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var profileUpdate struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}

	if err := json.NewDecoder(r.Body).Decode(&profileUpdate); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := database.GetUserByID(userID)
	if err != nil {
		http.Error(w, "Error retrieving user profile", http.StatusInternalServerError)
		log.Printf("Error retrieving user profile: %v", err)
		return
	}

	if profileUpdate.Name != "" {
		user.Name = profileUpdate.Name
	}
	user.Phone = profileUpdate.Phone

	updatedUser, err := database.UpdateUser(user)
	if err != nil {
		http.Error(w, "Error updating user profile", http.StatusInternalServerError)
		log.Printf("Error updating user profile: %v", err)
		return
	}

	updatedUser.Password = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(updatedUser); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func GetUserRegistrationsHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("GetUserRegistrationsHandler called")
	userID, ok := r.Context().Value(utils.UserIDKey).(int)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	log.Printf("Fetching registrations for userID: %d", userID)

	registrations, err := database.GetRegistrationsByUserID(userID)
	if err != nil {
		http.Error(w, "Error retrieving registrations", http.StatusInternalServerError)
		log.Printf("Error retrieving registrations: %v", err)
		return
	}
	log.Printf("Found %d registrations for userID: %d", len(registrations), userID)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(registrations); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
