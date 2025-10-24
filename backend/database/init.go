package database

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB() {
	dsnWithoutDb := "root:1234@tcp(mysql:3306)/"

	db, err := sql.Open("mysql", dsnWithoutDb)
	if err != nil {
		log.Fatalf("Error connecting to MySQL server: %v", err)
	}
	defer db.Close()

	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS event_management")
	if err != nil {
		log.Fatalf("Error creating database: %v", err)
	}
	log.Println("Database 'event_management' created")

	dsnWithDB := "root:1234@tcp(mysql:3306)/event_management"

	DB, err = sql.Open("mysql", dsnWithDB)
	if err != nil {
		log.Fatalf("Failed to connect to event_management database: %v", err)
	}

	DB.SetMaxOpenConns(100)
	DB.SetMaxIdleConns(25)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err := DB.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS role (
			role_id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(50) UNIQUE NOT NULL,
			description VARCHAR(255),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		log.Fatalf("Error creating 'role' table: %v", err)
	}

	_, err = DB.Exec(`
		INSERT IGNORE INTO role (name) 
		VALUES ('admin'), ('organiser'), ('attendee');
	`)
	if err != nil {
		log.Fatalf("Error inserting default roles: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS user (
			user_id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(100) UNIQUE NOT NULL,
			phone VARCHAR(20),
			password VARCHAR(255) NOT NULL,
			isalive BOOLEAN DEFAULT TRUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_user_email (email)
		);
	`)
	if err != nil {
		log.Fatalf("Error creating 'user' table: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS user_role (
			user_id INT NOT NULL,
			role_id INT NOT NULL,
			assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, role_id),
			FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
			FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE CASCADE,
			INDEX idx_user_role_user (user_id),
			INDEX idx_user_role_role (role_id)
		);
	`)
	if err != nil {
		log.Fatalf("Error creating 'user_role' table: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS event_category (
			category_id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(50) UNIQUE NOT NULL,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		);
	`)
	if err != nil {
		log.Fatalf("Error creating 'event_category' table: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS event (
			event_id INT AUTO_INCREMENT PRIMARY KEY,
			organiser_id INT NOT NULL,
			title VARCHAR(100) NOT NULL,
			description TEXT,
			date DATETIME NOT NULL,
			location VARCHAR(255) NOT NULL,
			max_capacity INT,
			category_id INT,
			isalive BOOLEAN DEFAULT TRUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (organiser_id) REFERENCES user(user_id),
			FOREIGN KEY (category_id) REFERENCES event_category(category_id),
			INDEX idx_event_date (date),
			INDEX idx_event_organiser (organiser_id)
		);
	`)
	if err != nil {
		log.Fatalf("Error creating 'event' table: %v", err)
	}

	_, err = DB.Exec(`
		CREATE TABLE IF NOT EXISTS registration (
			registration_id INT AUTO_INCREMENT PRIMARY KEY,
			event_id INT NOT NULL,
			attendee_id INT NOT NULL,
			registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			status VARCHAR(50) NOT NULL DEFAULT 'pending',
			isalive BOOLEAN DEFAULT TRUE,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (event_id) REFERENCES event(event_id),
			FOREIGN KEY (attendee_id) REFERENCES user(user_id),
			UNIQUE KEY unique_event_attendee (event_id, attendee_id),
			INDEX idx_registration_event (event_id),
			INDEX idx_registration_attendee (attendee_id)
		);
	`)
	if err != nil {
		log.Fatalf("Error creating 'registration' table: %v", err)
	}

	log.Println("All tables created successfully.")
}
