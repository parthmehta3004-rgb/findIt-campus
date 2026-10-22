
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";

function PublicRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    apiRequest("/api/auth/me")
      .then(() => {
        if (active) setStatus("authenticated");
      })
      .catch((error) => {
  if (!active) return;

  if (
    error.status === 401 ||
    error.status === 403 ||
    error.message === "Not logged in." ||
    error.message === "Please log in."
  ) {
    setStatus("unauthenticated");
  } else {
    setStatus("error");
  }
});

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <div className="auth-loading">Checking session...</div>;
  }

  if (status === "error") {
    return (
      <div className="auth-loading" role="alert">
        Unable to contact the authentication API. Check the backend and refresh.
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PublicRoute;
