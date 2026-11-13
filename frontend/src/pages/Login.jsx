
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message);
                return;
            }

            sessionStorage.setItem("token", data.token);

            const returnTo = location.state?.from;

            navigate(returnTo || "/dashboard");

        } catch (error) {
            setMessage("Something went wrong!");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <h1>Welcome Back!</h1>

                <p className="login-subtitle">
                    Login to your account
                </p>

                <form onSubmit={handleLogin} className="login-form">

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
                        Login
                    </button>

                </form>

                <p className="login-message">{message}</p>

                <p className="login-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>

            </div>
        </div>
    );
}

export default Login;
