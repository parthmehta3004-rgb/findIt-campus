// import { useEffect, useState } from "react";

// import { Link, useLocation, useNavigate } from "react-router-dom";

// import "./Matches.css";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// const CLAIM_QUESTIONS = [

//   "What unique details can help identify this item as yours?",

//   "Where and approximately when did you lose this item?",

//   "Do you have any additional details or proof of ownership?",

// ];

// const normalizeText = (value) =>

//   String(value ?? "")

//     .toLowerCase()

//     .replace(/[^a-z0-9\s]/g, " ")

//     .replace(/\s+/g, " ")

//     .trim();

// function calculateMatch(lost, found) {

//   const lostName = normalizeText(lost.itemName);

//   const foundName = normalizeText(found.itemName);

//   // Names are essential: don't match items using location alone.

//   if (!lostName || !foundName) return null;

//   const lostWords = new Set(lostName.split(" "));

//   const foundWords = new Set(foundName.split(" "));

//   const commonNameWords = [...lostWords].filter((word) =>

//     foundWords.has(word)

//   );

//   const exactName = lostName === foundName;

//   const nameOverlap =

//     commonNameWords.length / Math.max(lostWords.size, foundWords.size);

//   // Reject unrelated item names.

//   if (!exactName && nameOverlap < 0.5) return null;

//   let score = exactName ? 50 : Math.round(40 * nameOverlap);

//   const reasons = [

//     exactName ? "Item names match exactly" : "Item names are similar",

//   ];

//   const lostCategory = normalizeText(lost.category);

//   const foundCategory = normalizeText(found.category);

//   if (

//     lostCategory &&

//     foundCategory &&

//     lostCategory === foundCategory

//   ) {

//     score += 15;

//     reasons.push("Categories match");

//   }

//   const lostLocation = normalizeText(lost.location);

//   const foundLocation = normalizeText(found.location);

//   if (lostLocation && foundLocation) {

//     if (lostLocation === foundLocation) {

//       score += 20;

//       reasons.push("Locations match");

//     } else if (

//       lostLocation.includes(foundLocation) ||

//       foundLocation.includes(lostLocation)

//     ) {

//       score += 10;

//       reasons.push("Locations are similar");

//     }

//   }

//   const stopWords = new Set([

//     "the", "and", "for", "with", "from", "this", "that",

//     "item", "found", "lost", "name", "written", "features",

//     "distinguishing", "color", "colour",

//   ]);

//   const descriptionWords = (value) =>

//     new Set(

//       normalizeText(value)

//         .split(" ")

//         .filter((word) => word.length > 2 && !stopWords.has(word))

//     );

//   const lostDescription = descriptionWords(lost.description);

//   const foundDescription = descriptionWords(found.description);

//   const commonDescription = [...lostDescription].filter((word) =>

//     foundDescription.has(word)

//   );

//   if (commonDescription.length > 0) {

//     const descriptionOverlap =

//       commonDescription.length /

//       Math.max(lostDescription.size, foundDescription.size);

//     score += Math.round(15 * descriptionOverlap);

//     reasons.push("Descriptions share details");

//   }

//   return { score: Math.min(score, 100), reasons };

// }

// function findMatches(lostItems, foundItems) {

//   const results = [];

//   for (const lostItem of lostItems) {

//     for (const foundItem of foundItems) {

//       const result = calculateMatch(lostItem, foundItem);

//       if (!result || result.score < 50) continue;

//       results.push({

//         lostItem,

//         foundItem,

//         score: result.score,

//         reasons: result.reasons,

//       });

//     }

//   }

//   return results.sort((a, b) => b.score - a.score);

// }

// function getItemName(item) {

//   return (

//     item?.itemName ||

//     item?.item_name ||

//     item?.item ||

//     item?.title ||

//     "Unnamed Item"

//   );

// }

// function getItemImage(item) {

//   const image =

//     item?.image ||

//     item?.photo ||

//     item?.imageUrl ||

//     item?.image_url ||

//     "";

//   if (

//     !image ||

//     image.startsWith("data:") ||

//     image.startsWith("blob:") ||

//     /^https?:\/\//i.test(image)

//   ) {

//     return image;

//   }

//   return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;

// }

// function normalizeLostItem(item) {

//   return {

//     ...item,

//     itemName: item.item_name ?? item.itemName ?? item.item,

//     dateLost: item.date_lost ?? item.dateLost ?? item.date,

//     image: getItemImage(item),

//   };

// }

// function normalizeFoundItem(item) {

//   return {

//     ...item,

//     itemName: item.item_name ?? item.itemName ?? item.item,

//     dateFound: item.date_found ?? item.dateFound ?? item.date,

//     image: getItemImage(item),

//   };

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

// function Matches() {

//   const location = useLocation();

//   const navigate = useNavigate();

//   const [matches, setMatches] = useState([]);

//   const [loading, setLoading] = useState(true);

//   const [loadError, setLoadError] = useState("");

//   const [claimingMatch, setClaimingMatch] = useState(null);

//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   const [currentAnswer, setCurrentAnswer] = useState("");

//   const [claimAnswers, setClaimAnswers] = useState([]);

//   const [claimMessage, setClaimMessage] = useState("");

//   const [claimLoading, setClaimLoading] = useState(false);

//   const [successMessage, setSuccessMessage] = useState("");

//   useEffect(() => {

//     const controller = new AbortController();

//     async function loadMatches() {

//       setLoading(true);

//       setLoadError("");

//       try {

//         const [lostResponse, foundResponse] = await Promise.all([

//           fetch(`${API_URL}/api/lost-items`, {

//             signal: controller.signal,

//           }),

//           fetch(`${API_URL}/api/found-items`, {

//             signal: controller.signal,

//           }),

//         ]);

//         if (!lostResponse.ok || !foundResponse.ok) {

//           throw new Error("Could not fetch Lost/Found items. Check the backend.");

//         }

//         const [lostData, foundData] = await Promise.all([

//           lostResponse.json(),

//           foundResponse.json(),

//         ]);

//         if (!Array.isArray(lostData) || !Array.isArray(foundData)) {

//           throw new Error("Backend did not return valid item lists.");

//         }

//         const lostItems = lostData.map(normalizeLostItem);

//         const foundItems = foundData.map(normalizeFoundItem);

//         if (!controller.signal.aborted) {

//           setMatches(findMatches(lostItems, foundItems));

//         }

//       } catch (error) {

//         if (error.name === "AbortError") return;

//         console.error("Error loading matches:", error);

//         if (!controller.signal.aborted) {

//           setMatches([]);

//           setLoadError(error.message || "Unable to connect to the backend.");

//         }

//       } finally {

//         if (!controller.signal.aborted) setLoading(false);

//       }

//     }

//     loadMatches();

//     return () => controller.abort();

//   }, []);

//   function resetClaimForm() {

//     setClaimingMatch(null);

//     setCurrentQuestion(0);

//     setCurrentAnswer("");

//     setClaimAnswers([]);

//     setClaimMessage("");

//     setClaimLoading(false);

//   }

//   function openClaimForm(match) {

//     setSuccessMessage("");

//     setClaimingMatch(match);

//     setCurrentQuestion(0);

//     setCurrentAnswer("");

//     setClaimAnswers([]);

//     setClaimMessage("");

//   }

//   useEffect(() => {

//     const aiMatch = location.state?.aiClaimMatch;

//     if (aiMatch?.lostItem?.id == null || aiMatch?.foundItem?.id == null) {

//       return;

//     }

//     openClaimForm({

//       lostItem: normalizeLostItem(aiMatch.lostItem),

//       foundItem: normalizeFoundItem(aiMatch.foundItem),

//       score: 0,

//       reasons: ["Suggested by AI matching"],

//     });

//     navigate(location.pathname, { replace: true, state: null });

//   }, [location.state, location.pathname, navigate]);

//   async function handleClaimSubmit(event) {

//     event.preventDefault();

//     if (claimLoading) return;

//     if (!claimingMatch || !currentAnswer.trim()) {

//       setClaimMessage("Please answer this question before continuing.");

//       return;

//     }

//     const updatedAnswers = [...claimAnswers];

//     updatedAnswers[currentQuestion] = currentAnswer.trim();

//     if (currentQuestion < CLAIM_QUESTIONS.length - 1) {

//       setClaimAnswers(updatedAnswers);

//       setCurrentQuestion((previous) => previous + 1);

//       setCurrentAnswer("");

//       setClaimMessage("");

//       return;

//     }

//     const { lostItem, foundItem } = claimingMatch;

//     if (lostItem?.id == null || foundItem?.id == null) {

//       setClaimMessage("Item ID is missing. Refresh the page and try again.");

//       return;

//     }

//     let claimantUserId = null;

//     try {

//       const user = JSON.parse(localStorage.getItem("user") || "null");

//       claimantUserId = user?.id ?? user?.user_id ?? null;

//     } catch {

//       claimantUserId = null;

//     }

//     const answers = updatedAnswers.map((answer, index) => ({

//       question: CLAIM_QUESTIONS[index],

//       answer,

//     }));

//     try {

//       setClaimLoading(true);

//       setClaimMessage("");

// const response = await fetch(`${API_URL}/api/claims`, {

//   method: "POST",

//   credentials: "include",

//   headers: { "Content-Type": "application/json" },

//   body: JSON.stringify({

//     claimant_user_id: claimantUserId,

//     lost_item_id: lostItem.id,

//     found_item_id: foundItem.id,

//     answers,

//   }),

// });

//       const result = await response.json().catch(() => ({}));

//       if (!response.ok) {

//         throw new Error(result.message || "Unable to submit the claim.");

//       }

//       resetClaimForm();

//       setSuccessMessage("Claim saved successfully! Status: Pending verification.");

//     } catch (error) {

//       console.error("Claim submission failed:", error);

//       setClaimMessage(error.message || "Could not save the claim.");

//     } finally {

//       setClaimLoading(false);

//     }

//   }

//   return (

//     <div className="matches-page">

//       <main className="matches-main">

//         {successMessage && (

//           <div className="claim-success-message" role="status">

//             <span>✅ {successMessage}</span>

//             <button type="button" onClick={() => setSuccessMessage("")}>

//               ×

//             </button>

//           </div>

//         )}

//         <section className="matches-hero">

//           <div className="matches-hero-badge">🔍 SMART MATCHING SYSTEM</div>

//           <h1>Possible <span>Matches</span></h1>

//           <p>

//             We compare lost and found reports to help reconnect people with

//             their belongings.

//           </p>

//           <div className="matches-stats">

//             <div className="matches-stat">

//               <strong>{loading ? "…" : matches.length}</strong>

//               <span>Possible Matches</span>

//             </div>

//             <div className="matches-stat">

//               <strong>🔒</strong>

//               <span>Privacy Protected</span>

//             </div>

//             <div className="matches-stat">

//               <strong>⚡</strong>

//               <span>Smart Comparison</span>

//             </div>

//           </div>

//         </section>

//         {loading ? (

//           <section className="premium-no-matches">

//             <div className="empty-icon">🔄</div>

//             <h2>Loading Matches...</h2>

//             <p>Fetching reports from the database.</p>

//           </section>

//         ) : loadError ? (

//           <section className="premium-no-matches">

//             <div className="empty-icon">⚠️</div>

//             <h2>Could Not Load Matches</h2>

//             <p>{loadError}</p>

//             <button

//               type="button"

//               className="claim-item-btn"

//               onClick={() => window.location.reload()}

//             >

//               Try Again

//             </button>

//           </section>

//         ) : matches.length > 0 ? (

//           <section className="matches-container">

//             {matches.map((match, index) => {

//               const { lostItem, foundItem, score, reasons } = match;

//               const lostName = getItemName(lostItem);

//               const foundName = getItemName(foundItem);

//               return (

//                 <article

//                   className="premium-match-card"

//                   key={`${lostItem.id}-${foundItem.id}`}

//                 >

//                   <div className="match-card-header">

//                     <div>

//                       <span className="match-number">MATCH #{index + 1}</span>

//                       <h2>Possible Item Connection</h2>

//                     </div>

//                     <div className="match-confidence">

//                       <span>Match Score</span>

//                       <strong>{score}%</strong>

//                     </div>

//                   </div>

//                   <div className="match-reasons">

//                     <strong>Why this match?</strong>

//                     <ul>

//                       {reasons.map((reason, i) => <li key={i}>{reason}</li>)}

//                     </ul>

//                   </div>

//                   <div className="match-comparison">

//                     <div className="premium-item-card lost-item-card">

//                       <div className="item-status lost-status">🔴 LOST ITEM</div>

//                       <div className="premium-image-box">

//                         {lostItem.image ? (

//                           <img src={lostItem.image} alt={lostName} />

//                         ) : (

//                           <div className="no-image-placeholder">📦</div>

//                         )}

//                       </div>

//                       <div className="premium-item-content">

//                         <h3>{lostName}</h3>

//                         <p className="item-description">

//                           {lostItem.description || "No description provided."}

//                         </p>

//                         <div className="item-details">

//                           <div className="detail-chip">

//                             📍 {lostItem.location || "Location not provided"}

//                           </div>

//                           <div className="detail-chip">

//                             📅 {formatDate(lostItem.dateLost)}

//                           </div>

//                           {lostItem.category && (

//                             <div className="detail-chip">🏷️ {lostItem.category}</div>

//                           )}

//                         </div>

//                       </div>

//                     </div>

//                     <div className="match-center">

//                       <div className="match-line" />

//                       <div className="match-circle">

//                         <div className="match-circle-inner">

//                           <strong>{score}%</strong>

//                           <span>MATCH SCORE</span>

//                         </div>

//                       </div>

//                       <div className="match-label">POSSIBLE MATCH</div>

//                       <div className="match-line" />

//                     </div>

//                     <div className="premium-item-card found-item-card">

//                       <div className="item-status found-status">🟢 FOUND ITEM</div>

//                       <div className="premium-image-box">

//                         {foundItem.image ? (

//                           <img src={foundItem.image} alt={foundName} />

//                         ) : (

//                           <div className="no-image-placeholder">📦</div>

//                         )}

//                       </div>

//                       <div className="premium-item-content">

//                         <h3>{foundName}</h3>

//                         <p className="item-description">

//                           {foundItem.description || "No description provided."}

//                         </p>

//                         <div className="item-details">

//                           <div className="detail-chip">

//                             📍 {foundItem.location || "Location not provided"}

//                           </div>

//                           <div className="detail-chip">

//                             📅 {formatDate(foundItem.dateFound)}

//                           </div>

//                           {foundItem.category && (

//                             <div className="detail-chip">🏷️ {foundItem.category}</div>

//                           )}

//                         </div>

//                       </div>

//                     </div>

//                   </div>

//                   <div className="match-privacy">

//                     🔒 Contact information is hidden to protect user privacy.

//                     A matching score is only a suggestion, not proof of ownership.

//                     Verify the item before arranging its return.

//                   </div>

//                   <button

//                     type="button"

//                     className="claim-item-btn"

//                     onClick={() => openClaimForm(match)}

//                   >

//                     Claim This Item →

//                   </button>

//                 </article>

//               );

//             })}

//           </section>

//         ) : (

//           <section className="premium-no-matches">

//             <div className="empty-icon">🔍</div>

//             <h2>No Possible Matches Yet</h2>

//             <p>

//               No sufficiently similar item names were found. Add accurate item

//               names and descriptions to improve matching.

//             </p>

//             <div className="empty-actions">

//               <Link to="/lost" className="empty-lost-btn">View Lost Items</Link>

//               <Link to="/found" className="empty-found-btn">View Found Items</Link>

//             </div>

//           </section>

//         )}

//         {claimingMatch && (

//           <div className="claim-modal-backdrop">

//             <section

//               className="claim-modal"

//               role="dialog"

//               aria-modal="true"

//               aria-labelledby="claim-modal-title"

//             >

//               <button

//                 type="button"

//                 className="claim-modal-close"

//                 onClick={resetClaimForm}

//                 aria-label="Close claim form"

//               >

//                 ×

//               </button>

//               <h2 id="claim-modal-title">Claim This Item</h2>

//               <p>Item: {getItemName(claimingMatch.foundItem)}</p>

//               <div className="claim-progress">

//                 Question {currentQuestion + 1} of {CLAIM_QUESTIONS.length}

//               </div>

//               <form onSubmit={handleClaimSubmit}>

//                 <label htmlFor="claim-answer">

//                   {CLAIM_QUESTIONS[currentQuestion]}

//                 </label>

//                 <textarea

//                   id="claim-answer"

//                   value={currentAnswer}

//                   onChange={(event) => setCurrentAnswer(event.target.value)}

//                   placeholder="Enter your answer..."

//                   rows={4}

//                   required

//                   autoFocus

//                 />

//                 {claimMessage && (

//                   <p role="alert" className="claim-message">{claimMessage}</p>

//                 )}

//                 <button

//                   type="submit"

//                   className="claim-item-btn"

//                   disabled={claimLoading}

//                 >

//                   {claimLoading

//                     ? "Submitting..."

//                     : currentQuestion < CLAIM_QUESTIONS.length - 1

//                       ? "Next Question →"

//                       : "Submit Claim"}

//                 </button>

//               </form>

//             </section>

//           </div>

//         )}

//       </main>

//     </div>

//   );

// }

// export default Matches;


import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import "./Matches.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const CLAIM_QUESTIONS = [

  "What unique details can help identify this item as yours?",

  "Where and approximately when did you lose this item?",

  "Do you have any additional details or proof of ownership?",

];

const normalizeText = (value) =>

  String(value ?? "")

    .toLowerCase()

    .replace(/[^a-z0-9\s]/g, " ")

    .replace(/\s+/g, " ")

    .trim();

function calculateMatch(lost, found) {

  const lostName = normalizeText(lost.itemName);

  const foundName = normalizeText(found.itemName);

  // Names are essential: don't match items using location alone.

  if (!lostName || !foundName) return null;

  const lostWords = new Set(lostName.split(" "));

  const foundWords = new Set(foundName.split(" "));

  const commonNameWords = [...lostWords].filter((word) =>

    foundWords.has(word)

  );

  const exactName = lostName === foundName;

  const nameOverlap =

    commonNameWords.length / Math.max(lostWords.size, foundWords.size);

  // Reject unrelated item names.

  if (!exactName && nameOverlap < 0.5) return null;

  let score = exactName ? 50 : Math.round(40 * nameOverlap);

  const reasons = [

    exactName ? "Item names match exactly" : "Item names are similar",

  ];

  const lostCategory = normalizeText(lost.category);

  const foundCategory = normalizeText(found.category);

  if (

    lostCategory &&

    foundCategory &&

    lostCategory === foundCategory

  ) {

    score += 15;

    reasons.push("Categories match");

  }

  const lostLocation = normalizeText(lost.location);

  const foundLocation = normalizeText(found.location);

  if (lostLocation && foundLocation) {

    if (lostLocation === foundLocation) {

      score += 20;

      reasons.push("Locations match");

    } else if (

      lostLocation.includes(foundLocation) ||

      foundLocation.includes(lostLocation)

    ) {

      score += 10;

      reasons.push("Locations are similar");

    }

  }

  const stopWords = new Set([

    "the", "and", "for", "with", "from", "this", "that",

    "item", "found", "lost", "name", "written", "features",

    "distinguishing", "color", "colour",

  ]);

  const descriptionWords = (value) =>

    new Set(

      normalizeText(value)

        .split(" ")

        .filter((word) => word.length > 2 && !stopWords.has(word))

    );

  const lostDescription = descriptionWords(lost.description);

  const foundDescription = descriptionWords(found.description);

  const commonDescription = [...lostDescription].filter((word) =>

    foundDescription.has(word)

  );

  if (commonDescription.length > 0) {

    const descriptionOverlap =

      commonDescription.length /

      Math.max(lostDescription.size, foundDescription.size);

    score += Math.round(15 * descriptionOverlap);

    reasons.push("Descriptions share details");

  }

  return { score: Math.min(score, 100), reasons };

}

function findMatches(lostItems, foundItems) {

  const results = [];

  for (const lostItem of lostItems) {

    for (const foundItem of foundItems) {

      const result = calculateMatch(lostItem, foundItem);

      if (!result || result.score < 50) continue;

      results.push({

        lostItem,

        foundItem,

        score: result.score,

        reasons: result.reasons,

      });

    }

  }

  return results.sort((a, b) => b.score - a.score);

}

function getItemName(item) {

  return (

    item?.itemName ||

    item?.item_name ||

    item?.item ||

    item?.title ||

    "Unnamed Item"

  );

}

function getItemImage(item) {

  const image =

    item?.image ||

    item?.photo ||

    item?.imageUrl ||

    item?.image_url ||

    "";

  if (

    !image ||

    image.startsWith("data:") ||

    image.startsWith("blob:") ||

    /^https?:\/\//i.test(image)

  ) {

    return image;

  }

  return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;

}

function normalizeLostItem(item) {

  return {

    ...item,

    itemName: item.item_name ?? item.itemName ?? item.item,

    dateLost: item.date_lost ?? item.dateLost ?? item.date,

    image: getItemImage(item),

  };

}

function normalizeFoundItem(item) {

  return {

    ...item,

    itemName: item.item_name ?? item.itemName ?? item.item,

    dateFound: item.date_found ?? item.dateFound ?? item.date,

    image: getItemImage(item),

  };

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

function Matches() {

  const location = useLocation();

  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [selectedFoundItem, setSelectedFoundItem] = useState(null);
  const [selectedAiMatches, setSelectedAiMatches] = useState([]);
  const [selectedMatchLoading, setSelectedMatchLoading] = useState(false);
  const [selectedMatchError, setSelectedMatchError] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [claimingMatch, setClaimingMatch] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [currentAnswer, setCurrentAnswer] = useState("");

  const [claimAnswers, setClaimAnswers] = useState([]);

  const [claimMessage, setClaimMessage] = useState("");

  const [claimLoading, setClaimLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {

    const controller = new AbortController();

    async function loadMatches() {

      setLoading(true);

      setLoadError("");

      try {

        const [lostResponse, foundResponse] = await Promise.all([

          fetch(`${API_URL}/api/lost-items`, {

            signal: controller.signal,

          }),

          fetch(`${API_URL}/api/found-items`, {

            signal: controller.signal,

          }),

        ]);

        if (!lostResponse.ok || !foundResponse.ok) {

          throw new Error("Could not fetch Lost/Found items. Check the backend.");

        }

        const [lostData, foundData] = await Promise.all([

          lostResponse.json(),

          foundResponse.json(),

        ]);

        if (!Array.isArray(lostData) || !Array.isArray(foundData)) {

          throw new Error("Backend did not return valid item lists.");

        }

        const lostItems = lostData.map(normalizeLostItem);

        const foundItems = foundData.map(normalizeFoundItem);

        if (!controller.signal.aborted) {

          setMatches(findMatches(lostItems, foundItems));

        }

      } catch (error) {

        if (error.name === "AbortError") return;

        console.error("Error loading matches:", error);

        if (!controller.signal.aborted) {

          setMatches([]);

          setLoadError(error.message || "Unable to connect to the backend.");

        }

      } finally {

        if (!controller.signal.aborted) setLoading(false);

      }

    }

    loadMatches();

    return () => controller.abort();

  }, []);

  useEffect(() => {
    const foundItem = location.state?.selectedFoundItem;

    if (!foundItem || foundItem.id == null) return;

    setSelectedFoundItem(normalizeFoundItem(foundItem));
    setSelectedAiMatches([]);
    setSelectedMatchError("");

    // Clear navigation state so refreshing does not reapply the selection.
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!selectedFoundItem?.id) return;

    const controller = new AbortController();

    async function findAiMatchesForSelectedFoundItem() {
      setSelectedMatchLoading(true);
      setSelectedMatchError("");
      setSelectedAiMatches([]);

      try {
        const response = await fetch(`${API_URL}/api/lost-items`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Could not load lost items for AI matching.");
        }

        const lostData = await response.json();

        if (!Array.isArray(lostData)) {
          throw new Error("Backend returned an invalid lost-items list.");
        }

        // The AI endpoint is keyed by lost-item ID. Query relevant lost reports,
        // then keep only results that refer to the found item selected by the user.
        const candidateLostItems = lostData
          .map(normalizeLostItem)
          .filter((lostItem) => {
            const lostCategory = String(lostItem.category || "").trim().toLowerCase();
            const foundCategory = String(selectedFoundItem.category || "").trim().toLowerCase();
            return !lostCategory || !foundCategory || lostCategory === foundCategory;
          });

        const aiResponses = await Promise.all(
          candidateLostItems.map(async (lostItem) => {
            try {
              const aiResponse = await fetch(
                `${API_URL}/api/ai-matches/lost/${lostItem.id}`,
                { signal: controller.signal }
              );

              if (!aiResponse.ok) return [];

              const aiData = await aiResponse.json();
              if (!aiData.success || !Array.isArray(aiData.matches)) return [];

              return aiData.matches
                .filter(
                  (match) => String(match.id) === String(selectedFoundItem.id)
                )
                .map((match) => ({
                  lostItem,
                  foundItem: normalizeFoundItem({
                    ...selectedFoundItem,
                    ...match,
                  }),
                  score: 90,
                  reasons: [match.reason || "Suggested by AI matching"],
                }));
            } catch (error) {
              if (error.name === "AbortError") throw error;
              console.error("AI match request failed:", error);
              return [];
            }
          })
        );

        if (!controller.signal.aborted) {
          const uniqueMatches = new Map();
          aiResponses.flat().forEach((match) => {
            uniqueMatches.set(
              `${match.lostItem.id}-${match.foundItem.id}`,
              match
            );
          });
          setSelectedAiMatches([...uniqueMatches.values()]);
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Could not find AI matches for selected item:", error);
        if (!controller.signal.aborted) {
          setSelectedMatchError(error.message || "AI matching could not be completed.");
        }
      } finally {
        if (!controller.signal.aborted) setSelectedMatchLoading(false);
      }
    }

    findAiMatchesForSelectedFoundItem();
    return () => controller.abort();
  }, [selectedFoundItem]);

  const displayedMatches = selectedFoundItem
    ? selectedAiMatches
    : matches;

  function resetClaimForm() {

    setClaimingMatch(null);

    setCurrentQuestion(0);

    setCurrentAnswer("");

    setClaimAnswers([]);

    setClaimMessage("");

    setClaimLoading(false);

  }

  function openClaimForm(match) {

    setSuccessMessage("");

    setClaimingMatch(match);

    setCurrentQuestion(0);

    setCurrentAnswer("");

    setClaimAnswers([]);

    setClaimMessage("");

  }

  useEffect(() => {

    const aiMatch = location.state?.aiClaimMatch;

    if (aiMatch?.lostItem?.id == null || aiMatch?.foundItem?.id == null) {

      return;

    }

    openClaimForm({

      lostItem: normalizeLostItem(aiMatch.lostItem),

      foundItem: normalizeFoundItem(aiMatch.foundItem),

      score: 0,

      reasons: ["Suggested by AI matching"],

    });

    navigate(location.pathname, { replace: true, state: null });

  }, [location.state, location.pathname, navigate]);

  async function handleClaimSubmit(event) {

    event.preventDefault();

    if (claimLoading) return;

    if (!claimingMatch || !currentAnswer.trim()) {

      setClaimMessage("Please answer this question before continuing.");

      return;

    }

    const updatedAnswers = [...claimAnswers];

    updatedAnswers[currentQuestion] = currentAnswer.trim();

    if (currentQuestion < CLAIM_QUESTIONS.length - 1) {

      setClaimAnswers(updatedAnswers);

      setCurrentQuestion((previous) => previous + 1);

      setCurrentAnswer("");

      setClaimMessage("");

      return;

    }

    const { lostItem, foundItem } = claimingMatch;

    if (lostItem?.id == null || foundItem?.id == null) {

      setClaimMessage("Item ID is missing. Refresh the page and try again.");

      return;

    }

    let claimantUserId = null;

    try {

      const user = JSON.parse(localStorage.getItem("user") || "null");

      claimantUserId = user?.id ?? user?.user_id ?? null;

    } catch {

      claimantUserId = null;

    }

    const answers = updatedAnswers.map((answer, index) => ({

      question: CLAIM_QUESTIONS[index],

      answer,

    }));

    try {

      setClaimLoading(true);

      setClaimMessage("");

const response = await fetch(`${API_URL}/api/claims`, {

  method: "POST",

  credentials: "include",

  headers: { "Content-Type": "application/json" },

  body: JSON.stringify({

    claimant_user_id: claimantUserId,

    lost_item_id: lostItem.id,

    found_item_id: foundItem.id,

    answers,

  }),

});

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {

        throw new Error(result.message || "Unable to submit the claim.");

      }

      resetClaimForm();

      setSuccessMessage("Claim saved successfully! Status: Pending verification.");

    } catch (error) {

      console.error("Claim submission failed:", error);

      setClaimMessage(error.message || "Could not save the claim.");

    } finally {

      setClaimLoading(false);

    }

  }

  return (

    <div className="matches-page">

      <main className="matches-main">

        {successMessage && (

          <div className="claim-success-message" role="status">

            <span>✅ {successMessage}</span>

            <button type="button" onClick={() => setSuccessMessage("")}>

              ×

            </button>

          </div>

        )}

        <section className="matches-hero">

          <div className="matches-hero-badge">🔍 SMART MATCHING SYSTEM</div>

          <h1>Possible <span>Matches</span></h1>

          <p>

            We compare lost and found reports to help reconnect people with

            their belongings.

          </p>

          <div className="matches-stats">

            <div className="matches-stat">

              <strong>{loading ? "…" : displayedMatches.length}</strong>

              <span>Possible Matches</span>

            </div>

            <div className="matches-stat">

              <strong>🔒</strong>

              <span>Privacy Protected</span>

            </div>

            <div className="matches-stat">

              <strong>⚡</strong>

              <span>Smart Comparison</span>

            </div>

          </div>

        </section>

        {(loading || selectedMatchLoading) ? (

          <section className="premium-no-matches">

            <div className="empty-icon">🔄</div>

            <h2>Loading Matches...</h2>

            <p>{selectedFoundItem ? "Using AI to find lost reports matching this found item." : "Fetching reports from the database."}</p>

          </section>

        ) : (loadError || selectedMatchError) ? (

          <section className="premium-no-matches">

            <div className="empty-icon">⚠️</div>

            <h2>Could Not Load Matches</h2>

            <p>{selectedMatchError || loadError}</p>

            <button

              type="button"

              className="claim-item-btn"

              onClick={() => window.location.reload()}

            >

              Try Again

            </button>

          </section>

        ) : displayedMatches.length > 0 ? (

          <section className="matches-container">

            {displayedMatches.map((match, index) => {

              const { lostItem, foundItem, score, reasons } = match;

              const lostName = getItemName(lostItem);

              const foundName = getItemName(foundItem);

              return (

                <article

                  className="premium-match-card"

                  key={`${lostItem.id}-${foundItem.id}`}

                >

                  <div className="match-card-header">

                    <div>

                      <span className="match-number">MATCH #{index + 1}</span>

                      <h2>Possible Item Connection</h2>

                    </div>

                    <div className="match-confidence">

                      <span>Match Score</span>

                      <strong>{score}%</strong>

                    </div>

                  </div>

                  <div className="match-reasons">

                    <strong>Why this match?</strong>

                    <ul>

                      {reasons.map((reason, i) => <li key={i}>{reason}</li>)}

                    </ul>

                  </div>

                  <div className="match-comparison">

                    <div className="premium-item-card lost-item-card">

                      <div className="item-status lost-status">🔴 LOST ITEM</div>

                      <div className="premium-image-box">

                        {lostItem.image ? (

                          <img src={lostItem.image} alt={lostName} />

                        ) : (

                          <div className="no-image-placeholder">📦</div>

                        )}

                      </div>

                      <div className="premium-item-content">

                        <h3>{lostName}</h3>

                        <p className="item-description">

                          {lostItem.description || "No description provided."}

                        </p>

                        <div className="item-details">

                          <div className="detail-chip">

                            📍 {lostItem.location || "Location not provided"}

                          </div>

                          <div className="detail-chip">

                            📅 {formatDate(lostItem.dateLost)}

                          </div>

                          {lostItem.category && (

                            <div className="detail-chip">🏷️ {lostItem.category}</div>

                          )}

                        </div>

                      </div>

                    </div>

                    <div className="match-center">

                      <div className="match-line" />

                      <div className="match-circle">

                        <div className="match-circle-inner">

                          <strong>{score}%</strong>

                          <span>MATCH SCORE</span>

                        </div>

                      </div>

                      <div className="match-label">POSSIBLE MATCH</div>

                      <div className="match-line" />

                    </div>

                    <div className="premium-item-card found-item-card">

                      <div className="item-status found-status">🟢 FOUND ITEM</div>

                      <div className="premium-image-box">

                        {foundItem.image ? (

                          <img src={foundItem.image} alt={foundName} />

                        ) : (

                          <div className="no-image-placeholder">📦</div>

                        )}

                      </div>

                      <div className="premium-item-content">

                        <h3>{foundName}</h3>

                        <p className="item-description">

                          {foundItem.description || "No description provided."}

                        </p>

                        <div className="item-details">

                          <div className="detail-chip">

                            📍 {foundItem.location || "Location not provided"}

                          </div>

                          <div className="detail-chip">

                            📅 {formatDate(foundItem.dateFound)}

                          </div>

                          {foundItem.category && (

                            <div className="detail-chip">🏷️ {foundItem.category}</div>

                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                  <div className="match-privacy">

                    🔒 Contact information is hidden to protect user privacy.

                    A matching score is only a suggestion, not proof of ownership.

                    Verify the item before arranging its return.

                  </div>

                  <button

                    type="button"

                    className="claim-item-btn"

                    onClick={() => openClaimForm(match)}

                  >

                    Claim This Item →

                  </button>

                </article>

              );

            })}

          </section>

        ) : (

          <section className="premium-no-matches">

            <div className="empty-icon">🔍</div>

            <h2>{selectedFoundItem ? `No Possible Matches for ${getItemName(selectedFoundItem)}` : "No Possible Matches Yet"}</h2>

            <p>

              No sufficiently similar item names were found. Add accurate item

              names and descriptions to improve matching.

            </p>

            <div className="empty-actions">

              <Link to="/lost" className="empty-lost-btn">View Lost Items</Link>

              <Link to="/found" className="empty-found-btn">View Found Items</Link>

            </div>

          </section>

        )}

        {claimingMatch && (

          <div className="claim-modal-backdrop">

            <section

              className="claim-modal"

              role="dialog"

              aria-modal="true"

              aria-labelledby="claim-modal-title"

            >

              <button

                type="button"

                className="claim-modal-close"

                onClick={resetClaimForm}

                aria-label="Close claim form"

              >

                ×

              </button>

              <h2 id="claim-modal-title">Claim This Item</h2>

              <p>Item: {getItemName(claimingMatch.foundItem)}</p>

              <div className="claim-progress">

                Question {currentQuestion + 1} of {CLAIM_QUESTIONS.length}

              </div>

              <form onSubmit={handleClaimSubmit}>

                <label htmlFor="claim-answer">

                  {CLAIM_QUESTIONS[currentQuestion]}

                </label>

                <textarea

                  id="claim-answer"

                  value={currentAnswer}

                  onChange={(event) => setCurrentAnswer(event.target.value)}

                  placeholder="Enter your answer..."

                  rows={4}

                  required

                  autoFocus

                />

                {claimMessage && (

                  <p role="alert" className="claim-message">{claimMessage}</p>

                )}

                <button

                  type="submit"

                  className="claim-item-btn"

                  disabled={claimLoading}

                >

                  {claimLoading

                    ? "Submitting..."

                    : currentQuestion < CLAIM_QUESTIONS.length - 1

                      ? "Next Question →"

                      : "Submit Claim"}

                </button>

              </form>

            </section>

          </div>

        )}

      </main>

    </div>

  );

}

export default Matches;