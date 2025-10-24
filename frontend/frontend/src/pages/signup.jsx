import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Signup({ onSignupSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "attendee",
  });
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8080/signup", {
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

        setTimeout(() => {
          if (onSignupSuccess) {
            onSignupSuccess();
          }
          navigate("/login");
        }, 2000);
      } else {
        setMsg(data.message || "Signup failed. Please try again.");
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMsg(error.message || "Connection error. Please try again.");
      setIsSuccess(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      <p>Sign up to start managing events</p>
      <form onSubmit={handleSubmit} className="signup-form">
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          className="form-input"
          onChange={handleChange}
          value={form.name}
          required
        />
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
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          className="form-input"
          onChange={handleChange}
          value={form.phone}
          required
        />
        <select
          name="role"
          className="form-input"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="attendee">Attendee</option>
          <option value="organiser">Organiser</option>
          <option value="admin">Admin</option>

        </select>
        <button type="submit" className="submit-button">
          Sign Up
        </button>
        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
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

export default Signup;