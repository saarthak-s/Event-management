package models

type Registration struct {
	ID               int    `json:"id"`
	EventID          int    `json:"eventId"`
	UserID           int    `json:"userId"`
	RegistrationDate string `json:"registrationDate"`
	Status           string `json:"status"` 
}

type RegistrationWithUserDetails struct {
	Registration
	UserName string `json:"userName"`
	Email    string `json:"email"`
}
