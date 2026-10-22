import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ItemDetailsModal from "./ItemDetailsModal.jsx";
import "./Lost.css";

// Convert image paths from the backend into usable URLs.
const getImageUrl = (imageUrl) => {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return null;
  }

  const trimmedUrl = imageUrl.trim();

  if (/^(https?:\/\/|data:|blob:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `http://localhost:3000/${trimmedUrl.replace(/^\/+/, "")}`;
};

function Lost() {
  const [searchTerm, setSearchTerm] = useState("");
  const [lostItems, setLostItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // AI matching states
  const [matchingItemId, setMatchingItemId] = useState(null);
  const [matchResults, setMatchResults] = useState({});
  const [matchErrors, setMatchErrors] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLostItems() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:3000/api/lost-items",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(
            "Lost items load nahi ho paaye. Please try again."
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Backend se invalid response mila.");
        }

        setLostItems(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching lost items:", err);
          setError(err.message || "Backend se connect nahi ho paaya.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchLostItems();

    return () => controller.abort();
  }, []);

  // Request possible AI matches for a particular lost item.
  const findPossibleMatches = async (itemId) => {
    setMatchingItemId(itemId);

    setMatchErrors((previous) => ({
      ...previous,
      [itemId]: "",
    }));

    setMatchResults((previous) => ({
      ...previous,
      [itemId]: undefined,
    }));

    try {
      const response = await fetch(
        `http://localhost:3000/api/ai-matches/lost/${itemId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "AI matching failed. Please try again."
        );
      }

      setMatchResults((previous) => ({
        ...previous,
        [itemId]: data.matches || [],
      }));
    } catch (err) {
      console.error("AI matching error:", err);

      setMatchErrors((previous) => ({
        ...previous,
        [itemId]:
          err.message || "Could not connect to the AI service.",
      }));
    } finally {
      setMatchingItemId(null);
    }
  };

  const search = searchTerm.trim().toLowerCase();

  const filteredItems = lostItems.filter((item) => {
    const itemName = String(item.item_name || "");
    const category = String(item.category || "");
    const location = String(item.location || "");

    return (
      itemName.toLowerCase().includes(search) ||
      category.toLowerCase().includes(search) ||
      location.toLowerCase().includes(search)
    );
  });

  const formatDate = (value) => {
    if (!value) return "Date not available";

    const dateString = String(value).slice(0, 10);

    if (
      dateString === "0000-00-00" ||
      Number.isNaN(Date.parse(dateString))
    ) {
      return "Date not available";
    }

    return dateString;
  };

  return (
    <div className="lost-page">
      <main className="lost-main">
        <section className="lost-page-heading">
          <div className="lost-heading-glow"></div>

          <div className="lost-heading-content">
            <span className="lost-eyebrow">CAMPUS COMMUNITY</span>

            <h2>
              Lost <span>Items</span>
            </h2>

            <p>
              Browse items reported as lost by students and help reunite
              them with their owners.
            </p>
          </div>
        </section>

        <section className="lost-toolbar">
          <div className="lost-search-wrapper">
            <span className="lost-search-icon">🔍</span>

            <input
              type="text"
              placeholder="Search lost items..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search lost items"
            />
          </div>

          <Link to="/report-lost" className="lost-report-btn">
            <span className="lost-report-plus">+</span>
            Report Lost
          </Link>
        </section>

        <section className="lost-results-section">
          <div className="lost-results-header">
            <div>
              <h3>Recently Lost</h3>
              <p>
                {loading
                  ? "Loading items..."
                  : `${filteredItems.length} item(s) found`}
              </p>
            </div>
          </div>

          <div className="lost-items-grid">
            {loading ? (
              <div className="lost-no-items">
                <div className="lost-empty-icon">⏳</div>
                <h3>Loading Lost Items</h3>
                <p>Please wait while we fetch the reports.</p>
              </div>
            ) : error ? (
              <div className="lost-no-items">
                <div className="lost-empty-icon">⚠️</div>
                <h3>Unable to Load Items</h3>
                <p>{error}</p>

                <button
                  type="button"
                  className="lost-view-btn"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const itemName = item.item_name || "Unnamed Item";
                const date = formatDate(item.date_lost);
                const image = getImageUrl(item.image_url);
                const matches = matchResults[item.id];

                return (
                  <article
                    className="lost-item-card"
                    key={item.id ?? `${itemName}-${index}`}
                  >
                    <div className="lost-card-top">
                      <span className="lost-category">
                        {item.category || "Other"}
                      </span>

                      <span className="lost-date">{date}</span>
                    </div>

                    <div className="lost-item-image">
                      {image ? (
                        <>
                          <img
                            src={image}
                            alt={itemName}
                            className="lost-uploaded-image"
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
                            className="lost-no-image"
                            style={{ display: "none" }}
                          >
                            <div className="lost-package-icon">📦</div>
                            <span>Image unavailable</span>
                          </div>
                        </>
                      ) : (
                        <div className="lost-no-image">
                          <div className="lost-package-icon">📦</div>
                          <span>Lost Item</span>
                        </div>
                      )}
                    </div>

                    <div className="lost-card-content">
                      <h3>{itemName}</h3>

                      <p className="lost-item-description">
                        {item.description ||
                          "No description available for this item."}
                      </p>

                      <div className="lost-location">
                        <span className="lost-location-icon">📍</span>
                        <span>
                          {item.location || "Location not available"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="lost-view-btn"
                        onClick={() => setSelectedItem(item)}
                      >
                        View Item →
                      </button>

                      <button
                        type="button"
                        className="lost-view-btn"
                        onClick={() => findPossibleMatches(item.id)}
                        disabled={matchingItemId === item.id}
                      >
                        {matchingItemId === item.id
                          ? "Finding Matches..."
                          : "Find Possible Matches"}
                      </button>

                      {matchErrors[item.id] && (
                        <p role="alert">
                          {matchErrors[item.id]}
                        </p>
                      )}

                      {matches !== undefined && (
                        <div className="ai-match-results">
                          <h4>AI Match Results</h4>

                          {matches.length === 0 ? (
                            <p>No possible matches found.</p>
                          ) : (
                            matches.map((match) => (
                              <div
                                key={match.id}
                                className="ai-match-card"
                              >
                                <h5>{match.item_name}</h5>
                                <p>Category: {match.category}</p>
                                <p>
                                  Found at: {match.location || "Unknown"}
                                </p>
                                <p>
                                  <strong>AI reason:</strong>{" "}
                                  {match.reason}
                                </p>
                                <small>
                                  Possible match only. Please verify
                                  ownership.
                                </small>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="lost-no-items">
                <div className="lost-empty-icon">📦</div>
                <h3>No Lost Items Found</h3>

                <p>
                  {lostItems.length === 0
                    ? "No lost items have been reported yet."
                    : "No item matches your search."}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="lost-bottom-message">
          <div className="lost-bottom-icon">?</div>

          <div className="lost-bottom-content">
            <h3>Can't find your lost item?</h3>
            <p>
              Report your lost item with detailed information so the campus
              community can help you find it.
            </p>
          </div>

          <Link to="/report-lost" className="lost-bottom-link">
            Report Lost →
          </Link>
        </section>
      </main>

      <ItemDetailsModal
        item={selectedItem}
        type="lost"
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default Lost;



