import Navbar from "./pages/components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import Footer from "./pages/components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Lost from "./pages/Lost";
import Found from "./pages/Found";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Claims from "./pages/Claims";

import ProtectedRoute from "./pages/components/ProtectedRoute";
import PublicRoute from "./pages/components/PublicRoute";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Home is always accessible */}
        <Route path="/" element={<Home />} />

        {/* Authentication pages */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* These pages handle their own login-required modal */}
        <Route path="/lost" element={<Lost />} />
        <Route path="/found" element={<Found />} />
        <Route path="/report-lost" element={<ReportLost />} />
        <Route path="/report-found" element={<ReportFound />} />

        {/* Protected pages */}
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />

        <Route
          path="/claims"
          element={
            <ProtectedRoute>
              <Claims />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
