
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { apiRequest } from "../utils/api";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email.
    if (
      normalizedEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Login using the backend API.
      const loginResult = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      // Confirm that the server-side session is valid.
      const session = await apiRequest("/api/auth/me");

      if (!session?.user) {
        throw new Error(
          "Login succeeded, but the session could not be verified. Please try again."
        );
      }

      // Store user details for display only.
      // The backend session remains the source of authentication.
      localStorage.setItem(
        "user",
        JSON.stringify(session.user)
      );
      localStorage.setItem("isLoggedIn", "true");

      // Return to the page the user originally wanted.
      const from = location.state?.from;

      const destination =
        typeof from === "string"
          ? from
          : from?.pathname
            ? `${from.pathname}${from.search || ""}${from.hash || ""}`
            : "/";

      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <h1>Welcome Back</h1>

        <p>Log in to your FindIt@Campus account.</p>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="login-email">
          Email
        </label>

        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          maxLength={150}
          required
        />

        <label htmlFor="login-password">
          Password
        </label>

        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          maxLength={72}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p>
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            state={{ from: location.state?.from || "/" }}
            style={{textDecoration:"none"}}
          >
            Sign up
          </Link>
        </p>

        <p>
          <Link to="/" style={{textDecoration:"none"}} >
            ← Back to Home
          </Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
