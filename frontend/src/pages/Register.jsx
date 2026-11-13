import "./Register.css";
import { Link } from "react-router-dom";
import { useState } from "react";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            window.location.href = "/login";

        } catch (error) {
            setMessage(error.message || "Something went wrong!");
        }
    };

return (
    <div className="register-page">
        <div className="register-card">

            <h1>Create Account</h1>

            <p className="register-subtitle">
                Join Cloud File Sharing System
            </p>

            <form onSubmit={handleRegister} className="register-form">

                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    Create Account
                </button>

            </form>

            <p className="register-message">{message}</p>

            <p className="register-footer">
                Already have an account? <Link to="/login">Login</Link>
            </p>

        </div>
    </div>
);
}

export default Register;
