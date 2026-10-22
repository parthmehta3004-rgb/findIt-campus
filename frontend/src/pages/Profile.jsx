import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import BrandLogo from "./components/BrandLogo";
import "./Profile.css";
import Footer from './components/Footer';


const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const EMPTY_FORM = {
  full_name: "",
  username: "",
  roll_number: "",
  email: "",
};

function getImageUrl(imagePath) {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  return `${API_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

export default function Profile() {
  const navigate = useNavigate();

  // Keep navigate in a ref so the load effect runs only once on mount.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [originalData, setOriginalData] = useState({ ...EMPTY_FORM });
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Fetch the signed-in user's profile once when the page mounts.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await apiRequest("/api/auth/me");

        if (!response || !response.user) {
          throw new Error("Unable to load your profile.");
        }

        if (!active) return;

        const currentUser = response.user;
        const currentForm = {
          full_name: currentUser.full_name || "",
          username: currentUser.username || "",
          roll_number: currentUser.roll_number || "",
          email: currentUser.email || "",
        };

        setUser(currentUser);
        setFormData(currentForm);
        setOriginalData(currentForm);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (err) {
        if (!active) return;

        if (err.status === 401 || err.status === 403) {
          navigateRef.current("/login", {
            replace: true,
            state: { from: "/profile" },
          });
        } else {
          setError(err.message || "Could not load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Create a temporary preview of a newly selected photo.
  useEffect(() => {
    if (!profileImage) {
      setPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage]);

  const imageUrl = preview || getImageUrl(user?.profile_image);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSaved(false);
    setError("");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    setError("");
    setSaved(false);

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setProfileImage(file);
  }

  function handleEdit() {
    setOriginalData({ ...formData });
    setProfileImage(null);
    setError("");
    setSaved(false);
    setEditing(true);
  }

  function handleCancel() {
    setFormData({ ...originalData });
    setProfileImage(null);
    setError("");
    setSaved(false);
    setEditing(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!editing || saving) return;

    setError("");
    setSaved(false);

    const full_name = formData.full_name.trim();
    const username = formData.username.trim();
    const roll_number = formData.roll_number.trim();

    if (full_name.length < 2 || full_name.length > 100) {
      setError("Full name must be between 2 and 100 characters.");
      return;
    }

    if (username.length < 3 || username.length > 20) {
      setError("Username must be between 3 and 20 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
      setError("Username can contain letters, numbers, underscores and dots.");
      return;
    }

    if (!roll_number || roll_number.length > 30) {
      setError("Enter a valid roll number (maximum 30 characters).");
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();
      body.append("full_name", full_name);
      body.append("username", username);
      body.append("roll_number", roll_number);

      if (profileImage) {
        body.append("profile_image", profileImage);
      }

      const response = await apiRequest("/api/profile", {
        method: "PUT",
        body,
      });

      if (!response || !response.user) {
        throw new Error("Profile update response was invalid.");
      }

      const updatedUser = response.user;
      const updatedForm = {
        full_name: updatedUser.full_name || "",
        username: updatedUser.username || "",
        roll_number: updatedUser.roll_number || "",
        email: updatedUser.email || "",
      };

      setUser(updatedUser);
      setFormData(updatedForm);
      setOriginalData(updatedForm);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfileImage(null);
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="profile-page">Loading profile...</main>;
  }

  if (!user) {
    return (
      <main className="profile-page">
        <p role="alert">{error || "Unable to load your profile."}</p>
        <button type="button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </main>
    );
  }

  const inputClass = editing ? "is-editing" : "";

  return (
    <div className="profile-page">
      <div className="profile-circle profile-circle-one" />
      <div className="profile-circle profile-circle-two" />

      <main className="profile-main-container">
        <section className="profile-intro-section">
          <div className="profile-small-label">STUDENT PROFILE</div>

          <h2>
            Your
            <br />
            <span>Profile</span>
          </h2>

          <p className="profile-intro-description">
            View and manage your personal information.
          </p>

          <div className="profile-tips">
            <div className="profile-tip">
              <div className="profile-tip-icon">✓</div>
              <div>
                <h3>Student Details</h3>
                <p>Your signup information is shown here.</p>
              </div>
            </div>

            <div className="profile-tip">
              <div className="profile-tip-icon">✉</div>
              <div>
                <h3>Email Information</h3>
                <p>Your registered email address.</p>
              </div>
            </div>

            <div className="profile-tip">
              <div className="profile-tip-icon">⚡</div>
              <div>
                <h3>Profile Photo</h3>
                <p>Update your picture whenever you need.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-form-section">
          <div className="profile-form-card">
            <div className="profile-form-heading">
              <h2>Student Profile</h2>
              <p>
                {editing
                  ? "Edit your details and save your changes."
                  : "Your account and contact information."}
              </p>
            </div>

            {saved && (
              <div className="profile-success-message" role="status">
                ✓ Profile updated successfully!
              </div>
            )}

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="profile-photo-editor">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Your profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar profile-avatar-placeholder">
                    👤
                  </div>
                )}

                {editing && (
                  <div className="profile-input-group">
                    <label htmlFor="profile-image">
                      Change profile photo
                    </label>
                    <input
                      id="profile-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                    />
                    <small>JPG, PNG or WEBP · Maximum 5 MB</small>
                  </div>
                )}
              </div>

              <div className="profile-input-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  className={inputClass}
                  value={formData.full_name}
                  onChange={handleChange}
                  readOnly={!editing}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>

              <div className="profile-input-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  className={inputClass}
                  value={formData.username}
                  onChange={handleChange}
                  readOnly={!editing}
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_.]+"
                />
              </div>

              <div className="profile-input-group">
                <label htmlFor="roll_number">Roll Number</label>
                <input
                  id="roll_number"
                  name="roll_number"
                  className={inputClass}
                  value={formData.roll_number}
                  onChange={handleChange}
                  readOnly={!editing}
                  required
                  maxLength={30}
                />
              </div>

              <div className="profile-input-group">
                <label htmlFor="email">Registered Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                />
              </div>

              <div className="profile-buttons">
                {editing ? (
                  <>
                    <button
                      key="save"
                      type="submit"
                      className="profile-save-button"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      key="cancel"
                      type="button"
                      className="profile-cancel-button"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    key="edit"
                    type="button"
                    className="profile-edit-button"
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
