
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [authStatus, setAuthStatus] = useState("checking");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    apiRequest("/api/auth/me")
      .then((data) => {
        if (!active) return;

        // A successful /me response means the session is valid.
        setAuthStatus("authenticated");
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      })
      .catch((error) => {
        if (!active) return;

        if (error.status === 401 || error.status === 403) {
          setAuthStatus("unauthenticated");
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("user");
        } else {
          // Do not assume the user is logged out when the backend is down.
          setAuthStatus("unavailable");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await apiRequest("/api/auth/logout", { method: "POST" });

      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");

      setAuthStatus("unauthenticated");
      navigate("/", { replace: true });
    } catch (error) {
      alert(error.message || "Unable to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="home-page">
      

      <main className="home-main">
        <section className="home-hero-section">
          <div className="home-badge">SMART CAMPUS LOST &amp; FOUND</div>

          <div className="home-hero-content">
            <h2>
              Smart Campus
              <br />
              <span>Lost &amp; Found</span>
            </h2>

            <p className="home-description">
              Find what&apos;s lost.
              <br />
              Return what&apos;s found.
            </p>
          </div>

          <div className="home-features">
            <div className="home-feature">
              <div className="home-feature-icon home-secure-icon">♢</div>
              <div className="home-feature-content">
                <h3>Secure &amp; Reliable</h3>
                <p>Your information and reports stay safe and protected.</p>
              </div>
            </div>

            <div className="home-feature">
              <div className="home-feature-icon home-community-icon">♧</div>
              <div className="home-feature-content">
                <h3>Community Driven</h3>
                <p>Helping students reconnect with their belongings.</p>
              </div>
            </div>

            <div className="home-feature">
              <div className="home-feature-icon home-quick-icon">⚡</div>
              <div className="home-feature-content">
                <h3>Quick &amp; Easy</h3>
                <p>Report, search and recover items in minutes.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-action-panel">
          <h2>Find &amp; Recover</h2>

          <p className="home-action-description">
            Helping the campus community reconnect with their lost belongings.
          </p>

          <div className="home-action-buttons">
            <Link
              to="/report-lost"
              className="home-action-card home-lost-card"
            >
              <div>
                <span className="home-small-text">Looking for something?</span>
                <h3>Lost</h3>
                <p>Report your lost item</p>
              </div>
              <div className="home-action-icon">📦</div>
            </Link>

            <Link
              to="/report-found"
              className="home-action-card home-found-card"
            >
              <div>
                <span className="home-small-text">Found something?</span>
                <h3>Found</h3>
                <p>Help someone get it back</p>
              </div>
              <div className="home-action-icon">🔎</div>
            </Link>
          </div>

          <div className="home-quick-links">
            <Link to="/lost">Browse Lost Items →</Link>
            <Link to="/found">Browse Found Items →</Link>
          </div>
        </section>
      </main>

    </div>
  );
}

export default Home;
