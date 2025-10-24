package queries

func LoginQuery() string {
	return `
		SELECT u.user_id, u.name, u.email, u.phone, u.password, r.name as role
		FROM user u
		JOIN user_role ur ON u.user_id = ur.user_id
		JOIN role r ON ur.role_id = r.role_id
		WHERE u.email = ? AND u.isalive = 1
	`
}
