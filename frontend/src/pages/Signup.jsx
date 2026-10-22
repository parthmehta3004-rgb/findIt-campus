
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import "../styles/auth.css";

const initialForm = {
  full_name: "",
  email: "",
  username: "",
  roll_number: "",
  password: "",
  confirmPassword: "",
};

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileImage) {
      setPreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      setProfileImage(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      setProfileImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be 5 MB or less.");
      event.target.value = "";
      setProfileImage(null);
      return;
    }

    setProfileImage(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const full_name = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const username = form.username.trim();
    const roll_number = form.roll_number.trim();
    const password = form.password;

    if (full_name.length < 2 || full_name.length > 100) {
      setError("Full name must be between 2 and 100 characters.");
      return;
    }

    if (
      email.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (username && (username.length < 3 || username.length > 20)) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }

    if (username && !/^[a-zA-Z0-9_.]+$/.test(username)) {
      setError("Username can contain letters, numbers, underscores and dots.");
      return;
    }

    if (roll_number.length > 30) {
      setError("Roll number cannot exceed 30 characters.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!profileImage) {
      setError("Please select a profile photo.");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();

      data.append("full_name", full_name);
      data.append("email", email);
      data.append("username", username);
      data.append("roll_number", roll_number);
      data.append("password", password);
      data.append("profile_image", profileImage);

      await apiRequest("/api/auth/signup", {
        method: "POST",
        body: data,
      });

      // Server-side session verify karo.
      await apiRequest("/api/auth/me");

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your account.");
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
        <h1>Create Account</h1>
        <p>Join the FindIt@Campus community.</p>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <div className="signup-photo-section">
          <div className="signup-photo-preview">
            {preview ? (
              <img src={preview} alt="Profile preview" />
            ) : (
              <span aria-hidden="true">👤</span>
            )}
          </div>

          <label htmlFor="signup-profile-image">
            Profile Photo *
          </label>

          <input
            id="signup-profile-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            required
          />

          <small>JPG, PNG or WEBP · Maximum 5 MB</small>
        </div>

        <label htmlFor="signup-name">Full name</label>
        <input
          id="signup-name"
          name="full_name"
          autoComplete="name"
          value={form.full_name}
          onChange={handleChange}
          minLength={2}
          maxLength={100}
          required
        />

        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          maxLength={150}
          required
        />

        <label htmlFor="signup-username">Username (optional)</label>
        <input
          id="signup-username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_.]+"
        />

        <label htmlFor="signup-roll">Roll number (optional)</label>
        <input
          id="signup-roll"
          name="roll_number"
          value={form.roll_number}
          onChange={handleChange}
          maxLength={30}
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          maxLength={72}
          required
        />

        <label htmlFor="signup-confirm">Confirm password</label>
        <input
          id="signup-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          maxLength={72}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}

export default Signup;
