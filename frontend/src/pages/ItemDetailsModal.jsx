// import { useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./ItemDetailsModal.css";

// const API_URL = (
//   import.meta.env.VITE_API_URL || "http://localhost:3000"
// ).replace(/\/$/, "");

// function getImageUrl(path) {
//   if (!path) return "";

//   if (/^(https?:|data:|blob:)/i.test(path)) return path;

//   return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
// }

// function formatDate(value) {
//   if (!value) return "Not provided";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return String(value);

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// }

// /**
//  * type: "lost" | "found"
//  * item: the lost/found item object from the API
//  */
// export default function ItemDetailsModal({ item, type = "lost", onClose }) {
//   useEffect(() => {
//     if (!item) return undefined;

//     const onKeyDown = (event) => {
//       if (event.key === "Escape") onClose();
//     };

//     document.body.style.overflow = "hidden";
//     window.addEventListener("keydown", onKeyDown);

//     return () => {
//       document.body.style.overflow = "";
//       window.removeEventListener("keydown", onKeyDown);
//     };
//   }, [item, onClose]);

//   if (!item) return null;

//   const isLost = type === "lost";

//   const name =
//     item.item_name || item.itemName || item.item || item.title || "Unnamed item";
//   const image = getImageUrl(
//     item.image || item.photo || item.image_url || item.imageUrl
//   );
//   const date = isLost
//     ? item.date_lost || item.dateLost || item.date
//     : item.date_found || item.dateFound || item.date;

//   // The backend stores "Distinguishing features: ..." inside the description.
//   // Split it so each part is shown separately.
//   const rawDescription = item.description || "";
//   const marker = "Distinguishing features:";
//   const markerIndex = rawDescription.indexOf(marker);

//   const description =
//     markerIndex >= 0
//       ? rawDescription.slice(0, markerIndex).trim()
//       : rawDescription.trim();

//   const features =
//     item.distinguishing_features ||
//     item.distinguishingFeatures ||
//     (markerIndex >= 0
//       ? rawDescription.slice(markerIndex + marker.length).trim()
//       : "");

//   return (
//     <div
//       className="item-modal-backdrop"
//       onClick={onClose}
//       role="presentation"
//     >
//       <section
//         className="item-modal"
//         role="dialog"
//         aria-modal="true"
//         aria-labelledby="item-modal-title"
//         onClick={(event) => event.stopPropagation()}
//       >
//         <button
//           type="button"
//           className="item-modal-close"
//           onClick={onClose}
//           aria-label="Close"
//         >
//           ×
//         </button>

//         <div className="item-modal-media">
//           {image ? (
//             <img src={image} alt={name} />
//           ) : (
//             <div className="item-modal-noimage">📦</div>
//           )}
//           <span
//             className={`item-modal-tag ${isLost ? "is-lost" : "is-found"}`}
//           >
//             {isLost ? "🔴 LOST ITEM" : "🟢 FOUND ITEM"}
//           </span>
//         </div>

//         <div className="item-modal-body">
//           <h2 id="item-modal-title">{name}</h2>

//           <div className="item-modal-chips">
//             {item.category && (
//               <span className="item-modal-chip">🏷️ {item.category}</span>
//             )}
//             <span className="item-modal-chip">
//               📅 {isLost ? "Lost" : "Found"} on {formatDate(date)}
//             </span>
//             {item.location && (
//               <span className="item-modal-chip">📍 {item.location}</span>
//             )}
//           </div>

//           <div className="item-modal-section">
//             <h3>Description</h3>
//             <p>{description || "No description provided."}</p>
//           </div>

//           {features && (
//             <div className="item-modal-section">
//               <h3>Distinguishing features</h3>
//               <p>{features}</p>
//             </div>
//           )}

//           <div className="item-modal-note">
//             🔒 Contact details are hidden to protect privacy. Ownership is
//             verified through the claim process.
//           </div>

//           <div className="item-modal-actions">
//             {isLost ? (
//               <Link to="/report-found" className="item-modal-primary">
//                 I Found This Item
//               </Link>
//             ) : (
//               <Link to="/matches" className="item-modal-primary">
//                 Check Matches to Claim
//               </Link>
//             )}

//             <button
//               type="button"
//               className="item-modal-secondary"
//               onClick={onClose}
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }



import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ItemDetailsModal.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

function getImageUrl(path) {
  if (!path) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(path)) return path;

  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * type: "lost" | "found"
 * item: the lost/found item object from the API
 */
export default function ItemDetailsModal({ item, type = "lost", onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!item) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const isLost = type === "lost";
  const name =
    item.item_name || item.itemName || item.item || item.title || "Unnamed item";
  const image = getImageUrl(
    item.image || item.photo || item.image_url || item.imageUrl
  );
  const date = isLost
    ? item.date_lost || item.dateLost || item.date
    : item.date_found || item.dateFound || item.date;

  const rawDescription = item.description || "";
  const marker = "Distinguishing features:";
  const markerIndex = rawDescription.indexOf(marker);

  const description =
    markerIndex >= 0
      ? rawDescription.slice(0, markerIndex).trim()
      : rawDescription.trim();

  const features =
    item.distinguishing_features ||
    item.distinguishingFeatures ||
    (markerIndex >= 0
      ? rawDescription.slice(markerIndex + marker.length).trim()
      : "");

  return (
    <div
      className="item-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="item-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="item-modal-media">
          {image ? (
            <img src={image} alt={name} />
          ) : (
            <div className="item-modal-noimage">📦</div>
          )}
          <span className={`item-modal-tag ${isLost ? "is-lost" : "is-found"}`}>
            {isLost ? "🔴 LOST ITEM" : "🟢 FOUND ITEM"}
          </span>
        </div>

        <div className="item-modal-body">
          <h2 id="item-modal-title">{name}</h2>

          <div className="item-modal-chips">
            {item.category && (
              <span className="item-modal-chip">🏷️ {item.category}</span>
            )}
            <span className="item-modal-chip">
              📅 {isLost ? "Lost" : "Found"} on {formatDate(date)}
            </span>
            {item.location && (
              <span className="item-modal-chip">📍 {item.location}</span>
            )}
          </div>

          <div className="item-modal-section">
            <h3>Description</h3>
            <p>{description || "No description provided."}</p>
          </div>

          {features && (
            <div className="item-modal-section">
              <h3>Distinguishing features</h3>
              <p>{features}</p>
            </div>
          )}

          <div className="item-modal-note">
            🔒 Contact details are hidden to protect privacy. Ownership is
            verified through the claim process.
          </div>

          <div className="item-modal-actions">
            {isLost ? (
              <Link to="/report-found" className="item-modal-primary">
                I Found This Item
              </Link>
            ) : (
              <button
                type="button"
                className="item-modal-primary"
                onClick={() => {
                  navigate("/matches", {
                    state: { selectedFoundItem: item },
                  });
                  onClose();
                }}
              >
                Check Matches to Claim
              </button>
            )}

            <button
              type="button"
              className="item-modal-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
