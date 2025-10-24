package auth

import (
	"encoding/json"
	"event_management/backend/database"
	"event_management/backend/models"

	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		writeJSONError(w, "Invalid form data", http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
	email := r.FormValue("email")
	password := r.FormValue("password")
	phone := r.FormValue("phone")
	role := strings.ToLower(r.FormValue("role"))

	if name == "" || email == "" || password == "" || phone == "" || role == "" {
		writeJSONError(w, "All fields are required", http.StatusBadRequest)
		return
	}

	if role != "admin" && role != "organiser" && role != "attendee" {
		writeJSONError(w, "Invalid role specified", http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	user := models.User{
		Name:  name,
		Email: email,
		Phone: phone,
		Role:  role,
	}

	err = database.CreateUser(user, hashedPassword)
	if err != nil {
		writeJSONError(w, "Email already registered or DB error", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(models.AuthResponse{
		Message: "Signup successful!",
		Name:    name,
		Email:   email,
		Role:    role,
	})
}
