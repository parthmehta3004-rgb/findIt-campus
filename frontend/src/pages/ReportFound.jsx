
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import "./ReportFound.css";
import Footer from './components/Footer';

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const initialFormData = {
  itemName: "",
  category: "",
  dateFound: "",
  location: "",
  description: "",
  features: "",
  contact: "",
};

const isValidContact = (value) => {
  const contact = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const indianMobileRegex = /^[6-9]\d{9}$/;

  return (
    emailRegex.test(contact) ||
    indianMobileRegex.test(contact)
  );
};

function ReportFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const redirectTimer = useRef(null);

  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------
  // CHECK BACKEND LOGIN SESSION
  // ---------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (cancelled) return;

        if (response.ok) {
          setIsAuthenticated(true);
          setShowLoginModal(false);
          setError("");
        } else if (
          response.status === 401 ||
          response.status === 403
        ) {
          setIsAuthenticated(false);
          setShowLoginModal(true);
        } else {
          setIsAuthenticated(false);
          setShowLoginModal(false);
          setError(
            "Unable to verify your login session. Please try again."
          );
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Session check failed:", err);
        setIsAuthenticated(false);
        setShowLoginModal(false);
        setError(
          "Backend se connection nahi ho raha. Server check karo."
        );
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------------------------------
  // CLEAN UP IMAGE PREVIEW AND TIMER
  // ---------------------------------------

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  // ---------------------------------------
  // FORM INPUTS
  // ---------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ---------------------------------------
  // IMAGE VALIDATION
  // ---------------------------------------

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setImageFile(null);
    setImagePreview("");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, PNG and WEBP images are allowed."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be 5 MB or less."
      );
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ---------------------------------------
  // LOGIN / SIGNUP NAVIGATION
  // ---------------------------------------

  const openLogin = () => {
    navigate("/login", {
      state: {
        from: location,
      },
    });
  };

  const openSignup = () => {
    navigate("/signup", {
      state: {
        from: location,
      },
    });
  };

  // ---------------------------------------
  // RECHECK AUTHENTICATION BEFORE SUBMIT
  // ---------------------------------------

  const verifySession = async () => {
    const response = await fetch(
      `${API_URL}/api/auth/me`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (response.ok) {
      return true;
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return false;
    }

    throw new Error(
      "Unable to verify login session."
    );
  };

  // ---------------------------------------
  // SUBMIT FOUND ITEM
  // ---------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading || checkingAuth) return;

    setError("");
    setSubmitted(false);

    // Verify login before submitting.
    try {
      const authenticated = await verifySession();

      if (!authenticated) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        return;
      }

      setIsAuthenticated(true);
      setShowLoginModal(false);
    } catch (err) {
      setError(
        err.message ||
          "Backend se connection nahi ho raha."
      );
      return;
    }

    if (!isValidContact(formData.contact)) {
      setError(
        "Enter a valid email address or a 10-digit Indian mobile number."
      );
      return;
    }

    const description = [
      formData.description.trim(),
      formData.features.trim()
        ? `Distinguishing features: ${formData.features.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const payload = new FormData();

    payload.append(
      "item_name",
      formData.itemName.trim()
    );

    payload.append(
      "category",
      formData.category
    );

    payload.append(
      "date_found",
      formData.dateFound
    );

    payload.append(
      "location",
      formData.location.trim()
    );

    payload.append(
      "description",
      description
    );

    payload.append(
      "contact",
      formData.contact.trim()
    );

    if (imageFile) {
      payload.append("image", imageFile);
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/found-items`,
        {
          method: "POST",
          credentials: "include",
          body: payload,
        }
      );

      const result = await response
        .json()
        .catch(() => ({}));

      // Session expired or user logged out.
      if (
        response.status === 401 ||
        response.status === 403
      ) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to save the found item."
        );
      }

      setSubmitted(true);
      setFormData(initialFormData);
      setImageFile(null);
      setImagePreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      redirectTimer.current = setTimeout(() => {
        navigate("/found");
      }, 1000);
    } catch (err) {
      console.error(
        "Found item submission failed:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------
  // JSX
  // ---------------------------------------

  return (
    <div className="reportfound-page">
      <div className="reportfound-circle reportfound-circle-one" />
      <div className="reportfound-circle reportfound-circle-two" />

      <main className="reportfound-main">
        {/* INTRO */}
        <section className="reportfound-intro-section">
          <div className="reportfound-search-icon-container">
            ✨
          </div>

          <div className="reportfound-intro-content">
            <div className="reportfound-small-label">
              FOUND SOMETHING?
            </div>

            <h2>
              Help Return
              <br />
              <span>Found Items</span>
            </h2>

            <p>
              Report the item you found and help someone
              in the campus community get their
              belongings back.
            </p>
          </div>

          <div className="reportfound-tips">
            <div className="reportfound-tip">
              <div className="reportfound-tip-icon">
                ✓
              </div>

              <div>
                <h3>Be Specific</h3>
                <p>
                  Add clear details to help identify
                  the owner.
                </p>
              </div>
            </div>

            <div className="reportfound-tip">
              <div className="reportfound-tip-icon reportfound-cyan">
                📍
              </div>

              <div>
                <h3>Add Location</h3>
                <p>
                  Tell us exactly where you found
                  the item.
                </p>
              </div>
            </div>

            <div className="reportfound-tip">
              <div className="reportfound-tip-icon reportfound-amber">
                🤝
              </div>

              <div>
                <h3>Help Someone</h3>
                <p>
                  Your report could reunite someone
                  with their item.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="reportfound-form-section">
          <div className="reportfound-form-card">
            <div className="reportfound-form-heading">
              <h2>Report Found Item</h2>
              <p>
                Provide the details below to create
                a found listing.
              </p>
            </div>

            {checkingAuth && (
              <p role="status">
                Checking your login session...
              </p>
            )}

            {submitted && (
              <div
                className="reportfound-success-message"
                role="status"
              >
                ✓ Found item saved successfully!
              </div>
            )}

            {error && (
              <div
                className="reportfound-error-message"
                role="alert"
              >
                {error}
              </div>
            )}

            <form
              className="reportfound-form"
              onSubmit={handleSubmit}
            >
              {/* ITEM NAME */}
              <div className="reportfound-input-group">
                <label htmlFor="itemName">
                  Item Name
                </label>

                <div className="reportfound-input-wrapper">
                  <span className="reportfound-input-icon">
                    📦
                  </span>

                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    placeholder="e.g. Black Wallet"
                    value={formData.itemName}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div className="reportfound-input-group">
                <label htmlFor="category">
                  Category
                </label>

                <div className="reportfound-input-wrapper">
                  <span className="reportfound-input-icon">
                    🏷️
                  </span>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select a category
                    </option>
                    <option value="Electronics">
                      Electronics
                    </option>
                    <option value="Wallet / Money">
                      Wallet / Money
                    </option>
                    <option value="ID / Documents">
                      ID / Documents
                    </option>
                    <option value="Keys">Keys</option>
                    <option value="Clothing">
                      Clothing
                    </option>
                    <option value="Books / Stationery">
                      Books / Stationery
                    </option>
                    <option value="Accessories">
                      Accessories
                    </option>
                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>
              </div>

              {/* DATE AND LOCATION */}
              <div className="reportfound-two-column">
                <div className="reportfound-input-group">
                  <label htmlFor="dateFound">
                    Date Found
                  </label>

                  <div className="reportfound-input-wrapper">
                    <span className="reportfound-input-icon">
                      📅
                    </span>

                    <input
                      type="date"
                      id="dateFound"
                      name="dateFound"
                      value={formData.dateFound}
                      onChange={handleChange}
                      max={new Date().toLocaleDateString("en-CA")}
                      required
                    />
                  </div>
                </div>

                <div className="reportfound-input-group">
                  <label htmlFor="location">
                    Location Found
                  </label>

                  <div className="reportfound-input-wrapper">
                    <span className="reportfound-input-icon">
                      📍
                    </span>

                    <input
                      type="text"
                      id="location"
                      name="location"
                      placeholder="e.g. Central Library"
                      value={formData.location}
                      onChange={handleChange}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="reportfound-input-group">
                <label htmlFor="description">
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe the item..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>

              {/* FEATURES */}
              <div className="reportfound-input-group">
                <label htmlFor="features">
                  Distinguishing Features
                </label>

                <textarea
                  id="features"
                  name="features"
                  placeholder="Color, brand, stickers, scratches, etc."
                  value={formData.features}
                  onChange={handleChange}
                  rows={2}
                />
              </div>

              {/* CONTACT */}
              <div className="reportfound-input-group">
                <label htmlFor="contact">
                  Contact Information
                </label>

                <div className="reportfound-input-wrapper">
                  <span className="reportfound-input-icon">
                    📞
                  </span>

                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    placeholder="Email or 10-digit mobile number"
                    value={formData.contact}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className="reportfound-input-group">
                <label htmlFor="image">
                  Item Image <span>(Optional)</span>
                </label>

                <label
                  htmlFor="image"
                  className="reportfound-upload-box"
                >
                  <input
                    type="file"
                    id="image"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />

                  <div className="reportfound-upload-icon">
                    ↑
                  </div>

                  <div>
                    <strong>
                      {imageFile
                        ? "Image selected ✓"
                        : "Upload an image"}
                    </strong>

                    <p>
                      PNG, JPG or WEBP — max 5 MB
                    </p>
                  </div>
                </label>

                {imagePreview && (
                  <img
                    className="reportfound-preview"
                    src={imagePreview}
                    alt="Selected item preview"
                  />
                )}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="reportfound-submit-button"
                disabled={
                  loading ||
                  checkingAuth ||
                  !isAuthenticated
                }
              >
                <span>
                  {checkingAuth
                    ? "Checking login..."
                    : loading
                      ? "Saving..."
                      : "List Found Item"}
                </span>
                <span>→</span>
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* LOGIN REQUIRED MODAL */}
      {showLoginModal && !checkingAuth && (
        <div
          className="reportfound-modal-overlay"
          role="presentation"
        >
          <div
            className="reportfound-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="found-login-title"
          >
            <button
              type="button"
              className="reportfound-modal-close"
              aria-label="Close login dialog"
              onClick={() => navigate("/")}
            >
              ×
            </button>

            <div className="reportfound-modal-icon">
              🔐
            </div>

            <h2 id="found-login-title">
              Login Required
            </h2>

            <p>
              Please log in to report your found
              item. After login, you can return
              to this page.
            </p>

            <button
              type="button"
              className="reportfound-submit-button"
              onClick={openLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="reportfound-modal-signup"
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

export default ReportFound;
