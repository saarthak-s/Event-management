package database

import (
	"database/sql"
	"event_management/backend/database/queries"
	"event_management/backend/models"
	"time"
)

func AuthenticateUser(email string) (*models.User, error) {
	var user models.User

	err := DB.QueryRow(queries.LoginQuery(), email).
		Scan(&user.ID, &user.Name, &user.Email, &user.Phone, &user.Password, &user.Role)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, err
	}

	return &user, nil
}

func CreateUser(user models.User, hashedPassword []byte) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
			return
		}
		err = tx.Commit()
	}()

	createdAt := time.Now()
	isAlive := true

	userInsertQuery := `
		INSERT INTO user (name, email, phone, password, isalive, created_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	userResult, err := tx.Exec(userInsertQuery,
		user.Name, user.Email, user.Phone, hashedPassword, isAlive, createdAt,
	)
	if err != nil {
		return err
	}

	userID, err := userResult.LastInsertId()
	if err != nil {
		return err
	}

	var roleID int
	err = tx.QueryRow("SELECT role_id FROM role WHERE name = ?", user.Role).Scan(&roleID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO user_role (user_id, role_id)
		VALUES (?, ?)
	`, userID, roleID)

	return err
}

func GetUserRoles(userID int) ([]models.Role, error) {
	roles := []models.Role{}

	rows, err := DB.Query(`
		SELECT r.role_id, r.name, r.description 
		FROM role r
		JOIN user_role ur ON r.role_id = ur.role_id
		WHERE ur.user_id = ?
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var role models.Role
		if err := rows.Scan(&role.ID, &role.Name, &role.Description); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}

	return roles, rows.Err()
}
