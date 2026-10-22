import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import BrandLogo from "./BrandLogo";
import "./Navbar.css";

const LINKS = [
  { label: "Home", path: "/" },
  { label: "Lost", path: "/lost" },
  { label: "Report Lost", path: "/report-lost" },
  { label: "Found", path: "/found" },
  { label: "Report Found", path: "/report-found" },
  { label: "Matches", path: "/matches" },
  { label: "Claims", path: "/claims" },
  { label: "Profile", path: "/profile" },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authStatus, setAuthStatus] = useState("checking");
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check login status on every route change.
  useEffect(() => {
    let active = true;

    apiRequest("/api/auth/me")
      .then((data) => {
        if (!active) return;

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
          setAuthStatus("unavailable");
        }
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Add a stronger shadow once the page is scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await apiRequest("/api/auth/logout", { method: "POST" });

      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");

      setAuthStatus("unauthenticated");
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      alert(error.message || "Unable to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  if (["/login", "/signup"].includes(location.pathname)) {
    return null;
  }

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path ||
        location.pathname.startsWith(`${path}/`);

  const actionButton =
    authStatus === "authenticated" ? (
      <button
        type="button"
        className="site-navbar-action"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing out..." : "Sign Out"}
      </button>
    ) : (
      <button
        type="button"
        className="site-navbar-action"
        onClick={() =>
          navigate("/login", { state: { from: location.pathname } })
        }
        disabled={
          authStatus === "checking" || authStatus === "unavailable"
        }
        title={
          authStatus === "unavailable"
            ? "Authentication server is unavailable"
            : ""
        }
      >
        {authStatus === "checking"
          ? "Checking..."
          : authStatus === "unavailable"
            ? "Server unavailable"
            : "Login"}
      </button>
    );

  return (
    <header className={`site-navbar ${scrolled ? "is-scrolled" : ""}`}>
      <div className="site-navbar-inner">
        <Link
          to="/"
          className="site-navbar-brand"
          aria-label="FindIt@Campus home"
        >
          <BrandLogo small />
        </Link>

        <nav
          id="site-navbar-menu"
          className={`site-navbar-links ${menuOpen ? "is-open" : ""}`}
          aria-label="Main navigation"
        >
          {LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? "active" : ""}
              aria-current={isActive(link.path) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}

          {/* Shown inside the dropdown on mobile only */}
          <div className="site-navbar-mobile-action">{actionButton}</div>
        </nav>

        <div className="site-navbar-desktop-action">{actionButton}</div>

        <button
          type="button"
          className={`site-navbar-toggle ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="site-navbar-menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
