// import { useCallback, useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import "./Claims.css";

// const API_URL = (
//   import.meta.env.VITE_API_URL || "http://localhost:3000"
// ).replace(/\/$/, "");

// const STATUS_LABELS = {
//   pending: "Pending",
//   approved: "Approved",
//   rejected: "Rejected",
// };

// function parseAnswers(value) {
//   if (!value) return [];

//   let parsed = value;

//   if (typeof value === "string") {
//     try {
//       parsed = JSON.parse(value);
//     } catch {
//       return [];
//     }
//   }

//   return Array.isArray(parsed) ? parsed : [];
// }

// function formatDate(value) {
//   if (!value) return "—";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return String(value);

//   return date.toLocaleString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// async function request(path, options = {}) {
//   const response = await fetch(`${API_URL}${path}`, {
//     credentials: "include",
//     ...options,
//   });

//   const data = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     const error = new Error(data.message || "Request failed.");
//     error.status = response.status;
//     throw error;
//   }

//   return data;
// }

// export default function Claims() {
//   const [claims, setClaims] = useState([]);
//   const [userId, setUserId] = useState(null);
//   const [tab, setTab] = useState("mine");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [notice, setNotice] = useState("");
//   const [busyId, setBusyId] = useState(null);

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const [me, claimList] = await Promise.all([
//         request("/api/auth/me"),
//         request("/api/claims"),
//       ]);

//       setUserId(me?.user?.id ?? me?.user?.user_id ?? null);
//       setClaims(Array.isArray(claimList) ? claimList : []);
//     } catch (err) {
//       setError(err.message || "Could not load your claims.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const myClaims = claims.filter(
//     (claim) => Number(claim.claimant_user_id) === Number(userId)
//   );

//   const reviewClaims = claims.filter(
//     (claim) => Number(claim.found_owner_id) === Number(userId)
//   );

//   const visibleClaims = tab === "mine" ? myClaims : reviewClaims;

//   const pendingReviewCount = reviewClaims.filter(
//     (claim) => String(claim.status).toLowerCase() === "pending"
//   ).length;

//   async function handleDecision(claimId, status) {
//     if (busyId) return;

//     const label = status === "approved" ? "approve" : "reject";

//     if (!window.confirm(`Are you sure you want to ${label} this claim?`)) {
//       return;
//     }

//     setBusyId(claimId);
//     setError("");
//     setNotice("");

//     try {
//       await request(`/api/claims/${claimId}/decision`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status }),
//       });

//       setClaims((previous) =>
//         previous.map((claim) =>
//           claim.id === claimId ? { ...claim, status } : claim
//         )
//       );

//       setNotice(`Claim ${status} successfully.`);
//     } catch (err) {
//       setError(err.message || "Could not update the claim.");
//     } finally {
//       setBusyId(null);
//     }
//   }

//   return (
//     <div className="claims-page">
//       <main className="claims-main">
//         <section className="claims-hero">
//           <div className="claims-badge">🛡️ CLAIM VERIFICATION</div>
//           <h1>
//             Your <span>Claims</span>
//           </h1>
//           <p>
//             Track the claims you have made and review claims on items you
//             found.
//           </p>
//         </section>

//         <div className="claims-tabs" role="tablist">
//           <button
//             type="button"
//             role="tab"
//             aria-selected={tab === "mine"}
//             className={tab === "mine" ? "active" : ""}
//             onClick={() => setTab("mine")}
//           >
//             My Claims
//             <span className="claims-count">{myClaims.length}</span>
//           </button>

//           <button
//             type="button"
//             role="tab"
//             aria-selected={tab === "review"}
//             className={tab === "review" ? "active" : ""}
//             onClick={() => setTab("review")}
//           >
//             Review Requests
//             <span
//               className={`claims-count ${
//                 pendingReviewCount > 0 ? "is-alert" : ""
//               }`}
//             >
//               {pendingReviewCount > 0 ? pendingReviewCount : reviewClaims.length}
//             </span>
//           </button>
//         </div>

//         {notice && (
//           <div className="claims-alert claims-alert-success" role="status">
//             <span>✅ {notice}</span>
//             <button type="button" onClick={() => setNotice("")}>
//               ×
//             </button>
//           </div>
//         )}

//         {error && (
//           <div className="claims-alert claims-alert-error" role="alert">
//             <span>⚠️ {error}</span>
//             <button type="button" onClick={() => setError("")}>
//               ×
//             </button>
//           </div>
//         )}

//         {loading ? (
//           <div className="claims-empty">
//             <div className="claims-empty-icon">🔄</div>
//             <h2>Loading claims...</h2>
//           </div>
//         ) : visibleClaims.length === 0 ? (
//           <div className="claims-empty">
//             <div className="claims-empty-icon">
//               {tab === "mine" ? "📭" : "📥"}
//             </div>
//             <h2>
//               {tab === "mine"
//                 ? "You haven't made any claims yet"
//                 : "No claims to review"}
//             </h2>
//             <p>
//               {tab === "mine"
//                 ? "Open Matches and claim an item that looks like yours."
//                 : "When someone claims an item you found, it will show up here."}
//             </p>
//             {tab === "mine" && (
//               <Link to="/matches" className="claims-primary-link">
//                 View Matches
//               </Link>
//             )}
//           </div>
//         ) : (
//           <section className="claims-list">
//             {visibleClaims.map((claim) => {
//               const status = String(claim.status || "pending").toLowerCase();
//               const answers = parseAnswers(claim.answers);
//               const isReview = tab === "review";

//               return (
//                 <article className="claim-card" key={claim.id}>
//                   <header className="claim-card-header">
//                     <div>
//                       <span className="claim-card-id">CLAIM #{claim.id}</span>
//                       <h2>
//                         {claim.found_item_name || "Found item"}
//                       </h2>
//                       <p className="claim-card-sub">
//                         For lost item:{" "}
//                         <strong>{claim.lost_item_name || "—"}</strong>
//                       </p>
//                     </div>

//                     <span className={`claim-status claim-status-${status}`}>
//                       {STATUS_LABELS[status] || status}
//                     </span>
//                   </header>

//                   <div className="claim-meta">
//                     <div>
//                       <span>{isReview ? "Claimed by" : "Reported by"}</span>
//                       <strong>
//                         {isReview
//                           ? claim.claimant_name || "Unknown user"
//                           : claim.found_owner_name || "Unknown user"}
//                       </strong>
//                     </div>
//                     <div>
//                       <span>Submitted</span>
//                       <strong>{formatDate(claim.created_at)}</strong>
//                     </div>
//                   </div>

//                   {isReview && (
//                     <div className="claim-answers">
//                       <h3>Ownership answers</h3>

//                       {answers.length === 0 ? (
//                         <p className="claim-no-answers">
//                           No answers were provided.
//                         </p>
//                       ) : (
//                         answers.map((item, index) => (
//                           <div className="claim-answer" key={index}>
//                             <span className="claim-question">
//                               {item.question}
//                             </span>
//                             <p>{item.answer}</p>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   )}

//                   {!isReview && status === "pending" && (
//                     <p className="claim-hint">
//                       ⏳ Waiting for the finder to verify your answers.
//                     </p>
//                   )}

//                   {!isReview && status === "approved" && (
//                     <p className="claim-hint claim-hint-success">
//                       🎉 Your claim was approved. Coordinate the handover
//                       with the finder.
//                     </p>
//                   )}

//                   {!isReview && status === "rejected" && (
//                     <p className="claim-hint claim-hint-danger">
//                       Your claim was rejected. Check the details and try
//                       again if you think this is your item.
//                     </p>
//                   )}

//                   {isReview && status === "pending" && (
//                     <div className="claim-actions">
//                       <button
//                         type="button"
//                         className="claim-approve"
//                         disabled={busyId === claim.id}
//                         onClick={() => handleDecision(claim.id, "approved")}
//                       >
//                         {busyId === claim.id ? "Please wait..." : "✓ Approve"}
//                       </button>

//                       <button
//                         type="button"
//                         className="claim-reject"
//                         disabled={busyId === claim.id}
//                         onClick={() => handleDecision(claim.id, "rejected")}
//                       >
//                         ✕ Reject
//                       </button>
//                     </div>
//                   )}
//                 </article>
//               );
//             })}
//           </section>
//         )}
//       </main>
//     </div>
//   );
// }




import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Claims.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned",
};

function parseAnswers(value) {
  if (!value) return [];

  let parsed = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  return Array.isArray(parsed) ? parsed : [];
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState("mine");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [me, claimList] = await Promise.all([
        request("/api/auth/me"),
        request("/api/claims"),
      ]);

      const currentUserId =
        me?.user?.id ?? me?.user?.user_id ?? null;

      setUserId(currentUserId);
      setClaims(Array.isArray(claimList) ? claimList : []);
    } catch (err) {
      setError(err.message || "Could not load your claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myClaims = claims.filter(
    (claim) => Number(claim.claimant_user_id) === Number(userId)
  );

  const reviewClaims = claims.filter(
    (claim) => Number(claim.found_owner_id) === Number(userId)
  );

  const visibleClaims = tab === "mine" ? myClaims : reviewClaims;

  const pendingReviewCount = reviewClaims.filter(
    (claim) => String(claim.status).toLowerCase() === "pending"
  ).length;

  async function handleDecision(claimId, status) {
    if (busyId !== null) return;

    const label = status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${label} this claim?`
    );

    if (!confirmed) return;

    const updatedClaimId = Number(claimId);

    setBusyId(updatedClaimId);
    setError("");
    setNotice("");

    try {
      await request(`/api/claims/${updatedClaimId}/decision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      setClaims((previous) =>
        previous.map((claim) =>
          Number(claim.id) === updatedClaimId
            ? { ...claim, status }
            : claim
        )
      );

      setNotice(
        `Claim ${status === "approved" ? "approved" : "rejected"} successfully.`
      );
    } catch (err) {
      setError(err.message || "Could not update the claim.");
    } finally {
      setBusyId(null);
    }
  }


async function handleReturned(claimId) {
  if (busyId !== null) return;

  const confirmed = window.confirm(
    "Confirm that the item has been handed over to the claimant?"
  );

  if (!confirmed) return;

  const updatedClaimId = Number(claimId);

  setBusyId(updatedClaimId);
  setError("");
  setNotice("");

  try {
    await request(`/api/claims/${updatedClaimId}/returned`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    setClaims((previous) =>
      previous.map((claim) =>
        Number(claim.id) === updatedClaimId
          ? { ...claim, status: "returned" }
          : claim
      )
    );

    setNotice("Item marked as returned successfully.");
  } catch (err) {
    setError(err.message || "Could not mark the item as returned.");
  } finally {
    setBusyId(null);
  }
}


  return (
    <div className="claims-page">
      <main className="claims-main">
        <section className="claims-hero">
          <div className="claims-badge">
            🛡️ CLAIM VERIFICATION
          </div>

          <h1>
            Your <span>Claims</span>
          </h1>

          <p>
            Track the claims you have made and review claims on items you
            found.
          </p>
        </section>

        <div className="claims-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "mine"}
            className={tab === "mine" ? "active" : ""}
            onClick={() => {
              setTab("mine");
              setError("");
              setNotice("");
            }}
          >
            My Claims
            <span className="claims-count">{myClaims.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "review"}
            className={tab === "review" ? "active" : ""}
            onClick={() => {
              setTab("review");
              setError("");
              setNotice("");
            }}
          >
            Review Requests
            <span
              className={`claims-count ${
                pendingReviewCount > 0 ? "is-alert" : ""
              }`}
            >
              {pendingReviewCount > 0
                ? pendingReviewCount
                : reviewClaims.length}
            </span>
          </button>
        </div>

        {notice && (
          <div
            className="claims-alert claims-alert-success"
            role="status"
          >
            <span>✅ {notice}</span>
            <button
              type="button"
              aria-label="Dismiss success message"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            className="claims-alert claims-alert-error"
            role="alert"
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              aria-label="Dismiss error message"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="claims-empty">
            <div className="claims-empty-icon">🔄</div>
            <h2>Loading claims...</h2>
          </div>
        ) : visibleClaims.length === 0 ? (
          <div className="claims-empty">
            <div className="claims-empty-icon">
              {tab === "mine" ? "📭" : "📥"}
            </div>

            <h2>
              {tab === "mine"
                ? "You haven't made any claims yet"
                : "No claims to review"}
            </h2>

            <p>
              {tab === "mine"
                ? "Open Matches and claim an item that looks like yours."
                : "When someone claims an item you found, it will show up here."}
            </p>

            {tab === "mine" && (
              <Link to="/matches" className="claims-primary-link">
                View Matches
              </Link>
            )}
          </div>
        ) : (
          <section className="claims-list">
            {visibleClaims.map((claim) => {
              const status = String(
                claim.status || "pending"
              ).toLowerCase();

              const answers = parseAnswers(claim.answers);
              const isReview = tab === "review";
              const isBusy = Number(busyId) === Number(claim.id);

              return (
                <article className="claim-card" key={claim.id}>
                  <header className="claim-card-header">
                    <div>
                      <span className="claim-card-id">
                        CLAIM #{claim.id}
                      </span>

                      <h2>
                        {claim.found_item_name || "Found item"}
                      </h2>

                      <p className="claim-card-sub">
                        For lost item:{" "}
                        <strong>
                          {claim.lost_item_name || "—"}
                        </strong>
                      </p>
                    </div>

                    <span
                      className={`claim-status claim-status-${status}`}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>
                  </header>

                  <div className="claim-meta">
                    <div>
                      <span>
                        {isReview ? "Claimed by" : "Reported by"}
                      </span>

                      <strong>
                        {isReview
                          ? claim.claimant_name || "Unknown user"
                          : claim.found_owner_name || "Unknown user"}
                      </strong>
                    </div>

                    <div>
                      <span>Submitted</span>
                      <strong>{formatDate(claim.created_at)}</strong>
                    </div>
                  </div>

                  {isReview && (
                    <div className="claim-answers">
                      <h3>Ownership answers</h3>

                      {answers.length === 0 ? (
                        <p className="claim-no-answers">
                          No answers were provided.
                        </p>
                      ) : (
                        answers.map((item, index) => (
                          <div className="claim-answer" key={index}>
                            <span className="claim-question">
                              {item.question || `Question ${index + 1}`}
                            </span>

                            <p>{item.answer || "No answer provided."}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {!isReview && status === "pending" && (
                    <p className="claim-hint">
                      ⏳ Waiting for the finder to verify your answers.
                    </p>
                  )}

                  {!isReview && status === "approved" && (
                    <p className="claim-hint claim-hint-success">
                      🎉 Your claim was approved. Coordinate the handover
                      with the finder.
                    </p>
                  )}

                  {!isReview && status === "rejected" && (
                    <p className="claim-hint claim-hint-danger">
                      Your claim was rejected. Check the details and try
                      again if you think this is your item.
                    </p>
                  )}

                  {isReview && status === "pending" && (
                    <div className="claim-actions">
                      <button
                        type="button"
                        className="claim-approve"
                        disabled={isBusy || busyId !== null}
                        onClick={() =>
                          handleDecision(claim.id, "approved")
                        }
                      >
                        {isBusy ? "Please wait..." : "✓ Approve"}
                      </button>

                      <button
                        type="button"
                        className="claim-reject"
                        disabled={isBusy || busyId !== null}
                        onClick={() =>
                          handleDecision(claim.id, "rejected")
                        }
                      >
                        {isBusy ? "Please wait..." : "✕ Reject"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
