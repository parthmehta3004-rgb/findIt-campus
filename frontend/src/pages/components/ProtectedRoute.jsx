
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiRequest } from "../../utils/api";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");
  const location = useLocation();

  useEffect(() => {
    let active = true;

    apiRequest("/api/auth/me")
      .then(() => {
        if (active) setStatus("authenticated");
      })
      .catch((error) => {
        if (active) {
          setStatus(
            error.message === "Please log in."
              ? "unauthenticated"
              : "error"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <div className="auth-loading">Verifying your session...</div>;
  }

  if (status === "error") {
    return (
      <div className="auth-loading" role="alert">
        Could not verify your session. Check that the backend is running, then
        refresh the page.
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
