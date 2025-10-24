package main

import (
	"fmt"
	"log"
	"net/http"

	"event_management/backend/database"
	"event_management/backend/handlers"
	"event_management/backend/handlers/auth"

	"github.com/gorilla/mux"
)

func main() {
	fmt.Println("Starting the server...")
	database.InitDB()

	router := mux.NewRouter()

	router.HandleFunc("/signup", auth.SignupHandler).Methods("POST", "OPTIONS")
	router.HandleFunc("/login", auth.LoginHandler).Methods("POST", "OPTIONS")
	router.HandleFunc("/validate_token", auth.ValidateTokenHandler).Methods("GET", "OPTIONS")
	router.HandleFunc("/logout", auth.LogoutHandler).Methods("POST", "OPTIONS")

	adminRouter := router.PathPrefix("/admin").Subrouter()
	adminRouter.Use(auth.JWTMiddleware)
	adminRouter.HandleFunc("/users", handlers.GetAllUsersHandler).Methods("GET", "OPTIONS")
	adminRouter.HandleFunc("/users/deactivate", handlers.DeactivateUserHandler).Methods("POST", "OPTIONS")

	organiserRouter := router.PathPrefix("/organiser").Subrouter()
	organiserRouter.Use(auth.JWTMiddleware)
	organiserRouter.HandleFunc("/events", handlers.GetOrganizerEventsHandler).Methods("GET", "OPTIONS")
	organiserRouter.HandleFunc("/events/{id:[0-9]+}/registrations", handlers.GetEventRegistrationsHandler).Methods("GET", "OPTIONS")
	organiserRouter.HandleFunc("/events", handlers.CreateEventHandler).Methods("POST", "OPTIONS")
	organiserRouter.HandleFunc("/events/{id:[0-9]+}", handlers.UpdateEventHandler).Methods("PUT", "OPTIONS")
	organiserRouter.HandleFunc("/events/{id:[0-9]+}", handlers.CancelEventHandler).Methods("DELETE", "OPTIONS")

	userRouter := router.PathPrefix("").Subrouter()
	userRouter.Use(auth.JWTMiddleware)
	userRouter.HandleFunc("/events", handlers.GetEventsHandler).Methods("GET", "OPTIONS")
	userRouter.HandleFunc("/events/{id:[0-9]+}/register", handlers.RegisterForEventHandler).Methods("POST", "OPTIONS")
	userRouter.HandleFunc("/registrations/{id:[0-9]+}", handlers.CancelRegistrationHandler).Methods("DELETE", "OPTIONS")
	userRouter.HandleFunc("/user/profile", handlers.GetUserProfileHandler).Methods("GET", "OPTIONS")
	userRouter.HandleFunc("/user/profile", handlers.UpdateUserProfileHandler).Methods("PUT", "OPTIONS")
	userRouter.HandleFunc("/user/registrations", handlers.GetUserRegistrationsHandler).Methods("GET", "OPTIONS")

	cors := func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Max-Age", "86400")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusOK)
				return
			}
			h.ServeHTTP(w, r)
		})
	}

	server := &http.Server{
		Addr:    ":8080",
		Handler: cors(router),
	}

	log.Println("Server running on http://localhost:8080")
	log.Fatal(server.ListenAndServe())
}
