package models

type Event struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Date        string `json:"date"`
	Location    string `json:"location"`
	Capacity    int    `json:"capacity"`
	OrganizerID int    `json:"organizerId"`
	Status      string `json:"status"`
}

type EventWithRegistrationCount struct {
	Event
	RegisteredCount int `json:"registeredCount"`
}
