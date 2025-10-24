package database

import (
	"event_management/backend/models"
	"fmt"
)

type UserData struct {
	Name  string
	Email string
}

func getUsersByRole(role string) ([]UserData, error) {
	query := `
		SELECT u.name, u.email 
		FROM user u
		JOIN user_role ur ON u.user_id = ur.user_id
		JOIN role r ON ur.role_id = r.role_id
		WHERE u.isalive = 1 AND r.name = ?
	`

	rows, err := DB.Query(query, role)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserData
	for rows.Next() {
		var user UserData
		if err := rows.Scan(&user.Name, &user.Email); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func GetAllAdmins() ([]UserData, error) {
	return getUsersByRole("admin")
}

func GetAllOrganisers() ([]UserData, error) {
	return getUsersByRole("organiser")
}

func GetAllAttendees() ([]UserData, error) {
	return getUsersByRole("attendee")
}

type UserWithRole struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func GetAllUserRoles() ([]UserWithRole, error) {
	query := `
		SELECT u.name, u.email, r.name as role
		FROM user u
		JOIN user_role ur ON u.user_id = ur.user_id
		JOIN role r ON ur.role_id = r.role_id
		WHERE u.isalive = 1
		ORDER BY u.name
	`

	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var allUsers []UserWithRole
	for rows.Next() {
		var user UserWithRole
		if err := rows.Scan(&user.Name, &user.Email, &user.Role); err != nil {
			return nil, err
		}
		allUsers = append(allUsers, user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return allUsers, nil
}

func DeactivateUser(email string, role string) error {
	var userID int
	err := DB.QueryRow("SELECT user_id FROM user WHERE email = ? AND isalive = 1", email).Scan(&userID)
	if err != nil {
		return fmt.Errorf("no user found with email %s", email)
	}

	var roleID int
	err = DB.QueryRow("SELECT role_id FROM role WHERE name = ?", role).Scan(&roleID)
	if err != nil {
		return fmt.Errorf("invalid role: %s", role)
	}

	var count int
	err = DB.QueryRow(
		"SELECT COUNT(*) FROM user_role WHERE user_id = ? AND role_id = ?",
		userID, roleID,
	).Scan(&count)

	if err != nil || count == 0 {
		return fmt.Errorf("no user found with email %s and role %s", email, role)
	}

	_, err = DB.Exec("UPDATE user SET isalive = 0 WHERE user_id = ?", userID)
	if err != nil {
		return err
	}

	return nil
}

func GetUserByID(userID int) (models.User, error) {
	var user models.User

	err := DB.QueryRow(`
		SELECT user_id, name, email, phone, password
		FROM user
		WHERE user_id = ? AND isalive = 1
	`, userID).Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.Password)

	if err != nil {
		return user, err
	}

	err = DB.QueryRow(`
		SELECT r.name
		FROM role r
		JOIN user_role ur ON r.role_id = ur.role_id
		WHERE ur.user_id = ?
		LIMIT 1
	`, userID).Scan(&user.Role)

	return user, err
}

func UpdateUser(user models.User) (models.User, error) {
	_, err := DB.Exec(`
		UPDATE user
		SET name = ?, phone = ?
		WHERE user_id = ? AND isalive = 1
	`, user.Name, user.Phone, user.ID)

	if err != nil {
		return user, err
	}

	return GetUserByID(user.ID)
}

func GetRegistrationsByUserID(userID int) ([]models.Registration, error) {
	var registrations []models.Registration

	rows, err := DB.Query(`
		SELECT registration_id, event_id, attendee_id, registration_date, status
		FROM registration
		WHERE attendee_id = ? AND isalive = 1
		ORDER BY registration_date DESC
	`, userID)
	if err != nil {
		return registrations, err
	}
	defer rows.Close()

	for rows.Next() {
		var reg models.Registration
		err := rows.Scan(
			&reg.ID,
			&reg.EventID,
			&reg.UserID,
			&reg.RegistrationDate,
			&reg.Status,
		)
		if err != nil {
			return registrations, err
		}
		registrations = append(registrations, reg)
	}

	return registrations, nil
}
