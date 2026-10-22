import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BrandLogo from "./components/BrandLogo";
import ItemDetailsModal from "./ItemDetailsModal.jsx";
import "./Found.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

function getItemName(item) {
  return (
    item.item_name ||
    item.item ||
    item.itemName ||
    item.title ||
    "Unnamed Item"
  );
}

function getImageUrl(image) {
  if (typeof image !== "string" || !image.trim()) {
    return "";
  }

  const trimmedImage = image.trim();

  if (/^(https?:\/\/|data:|blob:)/i.test(trimmedImage)) {
    return trimmedImage;
  }

  return `${API_URL}/${trimmedImage.replace(/^\/+/, "")}`;
}

function formatDate(value) {
  if (!value) return "Recently";

  const dateString = String(value).slice(0, 10);
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Found() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFoundItems() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/found-items`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load found items (${response.status})`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response received from the server.");
        }

        setFoundItems(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching found items:", err);
          setError(err.message || "Failed to load found items.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchFoundItems();

    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const search = searchTerm.toLowerCase().trim();

  const filteredItems = foundItems.filter((item) => {
    const searchableText = [
      getItemName(item),
      item.location,
      item.description,
      item.category,
    ]
      .filter((value) => typeof value === "string" || typeof value === "number")
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search);
  });

  return (
    <div className="found-page">
      

      <main className="found-main">
        <section className="found-page-heading">
          <span className="found-eyebrow">CAMPUS COMMUNITY</span>

          <h2>
            Found <span>Items</span>
          </h2>

          <p>
            Browse items found around campus and help reconnect
            them with their rightful owners.
          </p>
        </section>

        <section className="found-toolbar">
          <div className="found-search-wrapper">
            <span className="found-search-icon">🔍</span>

            <input
              type="text"
              placeholder="Search found items..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search found items"
            />
          </div>

          <Link to="/report-found" className="found-report-btn">
            <span className="found-report-plus">+</span>
            Report Found
          </Link>
        </section>

        <div className="found-results-header">
          <div>
            <h3>Recently Found</h3>
            <p>
              {loading
                ? "Loading items..."
                : `${filteredItems.length} item(s) available`}
            </p>
          </div>

          <div className="found-results-badge">
            🔎 Browse Items
          </div>
        </div>

        {error && (
          <div className="found-no-items" role="alert">
            <h3>Unable to load found items</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="found-no-items">
            <p>Loading found items from the database...</p>
          </div>
        )}

        {!loading && !error && (
          <section className="found-items-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const itemName = getItemName(item);
                const image = getImageUrl(
                  item.image_url || item.image || item.photo
                );
                const category = item.category || "Found Item";
                const date = formatDate(
                  item.date_found || item.dateFound || item.date
                );

                return (
                  <article
                    className="found-item-card"
                    key={item.id ?? index}
                  >
                    <div className="found-card-top">
                      <span className="found-category">
                        {category}
                      </span>

                      <span className="found-date">
                        {date}
                      </span>
                    </div>

                    <div className="found-item-image">
                      {image ? (
                        <>
                          <img
                            src={image}
                            alt={itemName}
                            className="found-uploaded-image"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";

                              const fallback =
                                event.currentTarget.nextElementSibling;

                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />

                          <div
                            className="found-no-image"
                            style={{ display: "none" }}
                          >
                            <div className="found-image-icon">📦</div>
                            <span>Image unavailable</span>
                          </div>
                        </>
                      ) : (
                        <div className="found-no-image">
                          <div className="found-image-icon">📦</div>
                          <span>Found Item</span>
                        </div>
                      )}
                    </div>

                    <div className="found-card-content">
                      <h3>{itemName}</h3>

                      <p className="found-item-description">
                        {item.description ||
                          "No description available for this item."}
                      </p>

                      <div className="found-location">
                        <span className="found-location-icon">📍</span>
                        <span>
                          {item.location || "Location not available"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="found-view-btn"
                        onClick={() => setSelectedItem(item)}
                      >
                        View Details <span>→</span>
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="found-no-items">
                <div className="found-empty-icon">🔎</div>

                <h3>
                  {foundItems.length === 0
                    ? "No Found Items Yet"
                    : "No Found Items"}
                </h3>

                <p>
                  {foundItems.length === 0
                    ? "No items have been reported as found yet."
                    : "No item matches your search. Try another keyword."}
                </p>
              </div>
            )}
          </section>
        )}

        <section className="found-bottom-message">
          <div className="found-bottom-icon">✓</div>

          <div className="found-bottom-content">
            <h3>Found something around campus?</h3>
            <p>
              Help someone recover their belongings by reporting
              the item you found.
            </p>
          </div>

          <Link to="/report-found" className="found-bottom-link">
            Report Found →
          </Link>
        </section>
      </main>

      <ItemDetailsModal
        item={selectedItem}
        type="found"
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default Found;
