
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import "./ReportLost.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const initialFormData = {
  itemName: "",
  category: "",
  dateLost: "",
  location: "",
  description: "",
  features: "",
  contact: "",
};

function ReportLost() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const checkSession = async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      return true;
    }

    if (response.status === 401 || response.status === 403) {
      return false;
    }

    throw new Error(result.message || "Unable to verify login session.");
  };

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const authenticated = await checkSession();

        if (cancelled) return;

        setIsAuthenticated(authenticated);
        setShowLoginModal(!authenticated);
      } catch (err) {
        if (!cancelled) {
          setError("Backend se connection nahi ho raha. Server check karo.");
          setShowLoginModal(false);
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setImageFile(null);
    setImagePreview("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openLogin = () => {
    navigate("/login", { state: { from: location } });
  };

  const openSignup = () => {
    navigate("/signup", { state: { from: location } });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || checkingAuth) return;

    setError("");
    setSubmitted(false);

    try {
      const authenticated = await checkSession();

      if (!authenticated) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        return;
      }

      setIsAuthenticated(true);
      setShowLoginModal(false);
    } catch {
      setError("Backend se connection nahi ho raha. Please try again.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();

      const description = [
        formData.description.trim(),
        formData.features.trim()
          ? `Distinguishing features: ${formData.features.trim()}`
          : "",
      ].filter(Boolean).join("\n\n");

      payload.append("item_name", formData.itemName.trim());
      payload.append("category", formData.category);
      payload.append("date_lost", formData.dateLost);
      payload.append("location", formData.location.trim());
      payload.append("description", description);
      payload.append("contact", formData.contact.trim());

      if (imageFile) payload.append("image", imageFile);

      const response = await fetch(`${API_URL}/api/lost-items`, {
        method: "POST",
        credentials: "include",
        body: payload,
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(result.message || "Failed to save lost item.");
      }

      setSubmitted(true);
      setFormData(initialFormData);
      setImageFile(null);
      setImagePreview("");

      const input = document.getElementById("lost-image");
      if (input) input.value = "";

      window.setTimeout(() => navigate("/lost"), 1000);
    } catch (err) {
      setError(err.message || "Unable to submit the lost item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reportlost-page">

      <main className="reportlost-main">
        <section className="reportlost-intro-section">
          <div className="reportlost-search-icon-container">🔍</div>
          <span className="reportlost-small-label">LOST SOMETHING?</span>

          <h2>
            List Your
            <br />
            <span>Lost Item</span>
          </h2>

          <p className="reportlost-intro-description">
            Tell us about the item you lost and help the campus community
            get it back to you.
          </p>

          <div className="reportlost-tips">
            <div className="reportlost-tip">
              <div className="reportlost-tip-icon">✓</div>
              <div>
                <h3>Be Specific</h3>
                <p>Add details that make your item easy to identify.</p>
              </div>
            </div>

            <div className="reportlost-tip">
              <div className="reportlost-tip-icon">📍</div>
              <div>
                <h3>Add Location</h3>
                <p>Mention where you last remember having it.</p>
              </div>
            </div>

            <div className="reportlost-tip">
              <div className="reportlost-tip-icon">⚡</div>
              <div>
                <h3>Act Quickly</h3>
                <p>The sooner you report it, the better.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="reportlost-form-section">
          <div className="reportlost-form-card">
            <div className="reportlost-form-heading">
              <h2>Report Lost Item</h2>
              <p>Provide the details below to create your listing.</p>
            </div>

            {checkingAuth && (
              <p className="reportlost-auth-loading" role="status">
                Checking your login session...
              </p>
            )}

            {submitted && (
              <div className="reportlost-success-message" role="status">
                ✓ Lost item saved successfully!
              </div>
            )}

            {error && (
              <div className="reportlost-error-message" role="alert">
                {error}
              </div>
            )}

            <form className="reportlost-form" onSubmit={handleSubmit}>
              <div className="reportlost-input-group">
                <label htmlFor="itemName">Item Name</label>
                <div className="reportlost-input-wrapper">
                  <span className="reportlost-input-icon">📦</span>
                  <input
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    placeholder="e.g. Black Wallet"
                    maxLength={150}
                    required
                  />
                </div>
              </div>

              <div className="reportlost-input-group">
                <label htmlFor="category">Category</label>
                <div className="reportlost-input-wrapper">
                  <span className="reportlost-input-icon">🏷️</span>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    <option>Electronics</option>
                    <option>Wallet / Money</option>
                    <option>ID / Documents</option>
                    <option>Keys</option>
                    <option>Clothing</option>
                    <option>Books / Stationery</option>
                    <option>Accessories</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="reportlost-two-column">
                <div className="reportlost-input-group">
                  <label htmlFor="dateLost">Date Lost</label>
                  <input
                    id="dateLost"
                    name="dateLost"
                    type="date"
                    value={formData.dateLost}
                    onChange={handleChange}
                    max={new Date().toLocaleDateString("en-CA")}
                    required
                  />
                </div>

                <div className="reportlost-input-group">
                  <label htmlFor="location">Location Lost</label>
                  <input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Central Library"
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <div className="reportlost-input-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the item..."
                  rows={3}
                  required
                />
              </div>

              <div className="reportlost-input-group">
                <label htmlFor="features">Distinguishing Features</label>
                <textarea
                  id="features"
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  placeholder="Color, brand, stickers, scratches..."
                  rows={2}
                />
              </div>

              <div className="reportlost-input-group">
                <label htmlFor="contact">Contact Information</label>
                <input
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Email or phone number"
                  maxLength={255}
                  required
                />
              </div>

              <div className="reportlost-input-group">
                <label htmlFor="lost-image">
                  Item Image <span>(Optional)</span>
                </label>

                <label htmlFor="lost-image" className="reportlost-upload-box">
                  <input
                    id="lost-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                  <div className="reportlost-upload-icon">↑</div>
                  <div>
                    <strong>
                      {imageFile ? "Image selected ✓" : "Upload an image"}
                    </strong>
                    <p>PNG, JPG or WEBP — max 5 MB</p>
                  </div>
                </label>

                {imagePreview && (
                  <img
                    className="reportlost-preview"
                    src={imagePreview}
                    alt="Selected lost item"
                  />
                )}
              </div>

              <button
                type="submit"
                className="reportlost-submit-button"
                disabled={submitting || checkingAuth || !isAuthenticated}
              >
                {checkingAuth
                  ? "Checking login..."
                  : submitting
                    ? "Saving..."
                    : "List Lost Item →"}
              </button>
            </form>
          </div>
        </section>
      </main>

      {showLoginModal && !checkingAuth && (
        <div className="reportlost-modal-overlay" role="presentation">
          <div
            className="reportlost-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reportlost-modal-title"
          >
            <button
              type="button"
              className="reportlost-modal-close"
              aria-label="Close login dialog"
              onClick={() => navigate("/")}
            >
              ×
            </button>

            <div className="reportlost-modal-icon">🔐</div>
            <h2 id="reportlost-modal-title">Login Required</h2>
            <p>
              Please log in to report your lost item. After login, you can
              return to this page.
            </p>

            <button
              type="button"
              className="reportlost-submit-button"
              onClick={openLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="reportlost-modal-signup"
              onClick={openSignup}
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportLost;
