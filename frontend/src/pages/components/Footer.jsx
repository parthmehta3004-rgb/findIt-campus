
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-logo" aria-label="FindIt home">
              <span className="site-footer-logo-mark">F</span>
              <span className="site-footer-logo-text">
                <strong>FINDIT</strong>
                <small>Campus Lost &amp; Found</small>
              </span>
            </Link>

            <p className="site-footer-about">
              A smart platform helping the campus community find, report and
              recover lost belongings easily. Connecting people with their
              belongings through a simple and accessible lost-and-found system.
            </p>

            <div className="site-footer-trust">
              <span>✓</span>
              <p>Built to bring the campus community together.</p>
            </div>
          </div>

          <nav className="site-footer-col" aria-label="Explore">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/lost">Lost Items</Link></li>
              <li><Link to="/found">Found Items</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Report">
            <h4>Report</h4>
            <ul>
              <li><Link to="/report-lost">Report Lost</Link></li>
              <li><Link to="/report-found">Report Found</Link></li>
              <li><Link to="/lost">Search Lost Items</Link></li>
              <li><Link to="/found">Search Found Items</Link></li>
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Help">
            <h4>Help &amp; Information</h4>
            <ul>
              <li><a href="mailto:info@finditcampus.com">Support</a></li>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>

            <div className="site-footer-note">
              <strong>Lost something?</strong>
              <p>Start by browsing reported lost and found items.</p>
              <Link to="/lost">Explore items →</Link>
            </div>
          </nav>

          <div className="site-footer-col">
            <h4>Contact</h4>
            <ul>
              <li className="site-footer-muted">Campus Lost &amp; Found</li>
              <li>
                <a href="mailto:info@finditcampus.com">
                  info@finditcampus.com
                </a>
              </li>
            </ul>

            <div className="site-footer-social">
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                X
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                f
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                in
              </a>
            </div>

            <p className="site-footer-contact-caption">
              Helping make campus lost and found simpler.
            </p>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} FINDIT</span>
          <span>Built for a smarter campus community.</span>
        </div>
      </div>
    </footer>
  );
}
