import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMsg(data.message);
        setIsSuccess(true);

        localStorage.setItem('token', data.token);

        const userData = {
          email: data.email,
          name: data.name,
          role: data.role,
          token: data.token,
        };

        setTimeout(() => {
          onLoginSuccess(userData);
          if (data.role === 'admin') {
            navigate('/admin');
          } else if (data.role === 'organiser') {
            navigate('/organizer');
          } else {
            navigate('/');
          }
        }, 1000);
      } else {
        setMsg(data.message || "Login failed. Please check your credentials.");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMsg(error.message || "Connection error. Please try again.");
      setIsSuccess(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome</h2>
      <p>Enter your credentials to access your account</p>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="form-input"
          onChange={handleChange}
          value={form.email}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="form-input"
          onChange={handleChange}
          value={form.password}
          required
        />
        <button type="submit" className="submit-button">
          Login
        </button>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </form>
      {msg && (
        <div className={`message ${isSuccess ? "success-message" : "error-message"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}

export default Login;