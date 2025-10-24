package models

type User struct {
	ID       int
	Name     string
	Email    string
	Phone    string
	Password string
	Role     string 
	Roles    []Role
}

type Role struct {
	ID          int
	Name        string
	Description string
}

type UserRole struct {
	UserID     int
	RoleID     int
	RoleName   string
	AssignedAt string
}
