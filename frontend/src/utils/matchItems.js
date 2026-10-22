
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this",
  "that", "was", "were", "are", "has", "have",
  "item", "lost", "found", "near", "some"
]);

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function getWords(text = "") {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) => word.length > 2 && !STOP_WORDS.has(word)
    );
}

function getItemName(item) {
  return normalize(
    item.itemName || item.item || item.title || ""
  );
}

function getDate(item, type) {
  if (type === "lost") {
    return item.dateLost || item.date || "";
  }

  return item.dateFound || item.date || "";
}

function getMatchScore(lostItem, foundItem) {
  let score = 0;
  const reasons = [];

  // 1. ITEM NAME — maximum 30 points
  const lostName = getItemName(lostItem);
  const foundName = getItemName(foundItem);

  if (lostName && foundName) {
    if (lostName === foundName) {
      score += 30;
      reasons.push("Item names match exactly");
    } else {
      const lostWords = new Set(getWords(lostName));
      const foundWords = new Set(getWords(foundName));

      const common = [...lostWords].filter((word) =>
        foundWords.has(word)
      );

      const union = new Set([
        ...lostWords,
        ...foundWords
      ]);

      if (
        lostName.includes(foundName) ||
        foundName.includes(lostName)
      ) {
        score += 22;
        reasons.push("Item names are similar");
      } else if (union.size > 0 && common.length > 0) {
        const similarity = common.length / union.size;
        const points = Math.round(similarity * 20);

        score += points;

        if (points > 0) {
          reasons.push("Some item-name words match");
        }
      }
    }
  }

  // 2. CATEGORY — maximum 20 points
  const lostCategory = normalize(lostItem.category);
  const foundCategory = normalize(foundItem.category);

  if (lostCategory && foundCategory) {
    if (lostCategory === foundCategory) {
      score += 20;
      reasons.push("Categories match");
    }
  }

  // 3. DESCRIPTION + FEATURES — maximum 25 points
  const lostWords = new Set(
    getWords(
      `${lostItem.description || ""} ${lostItem.features || ""}`
    )
  );

  const foundWords = new Set(
    getWords(
      `${foundItem.description || ""} ${foundItem.features || ""}`
    )
  );

  const commonWords = [...lostWords].filter((word) =>
    foundWords.has(word)
  );

  const unionWords = new Set([
    ...lostWords,
    ...foundWords
  ]);

  if (unionWords.size > 0 && commonWords.length > 0) {
    const similarity = commonWords.length / unionWords.size;
    const points = Math.round(similarity * 25);

    score += points;

    reasons.push(
      `Descriptions share ${commonWords.length} keyword(s)`
    );
  }

  // 4. LOCATION — maximum 15 points
  const lostLocation = normalize(lostItem.location);
  const foundLocation = normalize(foundItem.location);

  if (lostLocation && foundLocation) {
    if (lostLocation === foundLocation) {
      score += 15;
      reasons.push("Locations match");
    } else if (
      lostLocation.includes(foundLocation) ||
      foundLocation.includes(lostLocation)
    ) {
      score += 8;
      reasons.push("Locations are similar");
    }
  }

  // 5. DATE — maximum 10 points
  const lostDateValue = getDate(lostItem, "lost");
  const foundDateValue = getDate(foundItem, "found");

  if (lostDateValue && foundDateValue) {
    const lostDate = new Date(lostDateValue);
    const foundDate = new Date(foundDateValue);

    if (
      !Number.isNaN(lostDate.getTime()) &&
      !Number.isNaN(foundDate.getTime())
    ) {
      const lostDay = Date.UTC(
        lostDate.getUTCFullYear(),
        lostDate.getUTCMonth(),
        lostDate.getUTCDate()
      );

      const foundDay = Date.UTC(
        foundDate.getUTCFullYear(),
        foundDate.getUTCMonth(),
        foundDate.getUTCDate()
      );

      const difference =
        Math.abs(foundDay - lostDay) /
        (1000 * 60 * 60 * 24);

      if (difference === 0) {
        score += 10;
        reasons.push("Dates match");
      } else if (difference <= 3) {
        score += 5;
        reasons.push("Dates are within 3 days");
      }
    }
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

export function findMatches(lostItems = [], foundItems = []) {
  if (
    !Array.isArray(lostItems) ||
    !Array.isArray(foundItems)
  ) {
    return [];
  }

  const matches = [];
  const seenPairs = new Set();

  for (const lostItem of lostItems) {
    for (const foundItem of foundItems) {
      if (!lostItem || !foundItem) continue;

      const { score, reasons } = getMatchScore(
        lostItem,
        foundItem
      );

      // Avoid duplicate pairs when both IDs are available
      if (lostItem.id != null && foundItem.id != null) {
        const pairKey = `${lostItem.id}:${foundItem.id}`;

        if (seenPairs.has(pairKey)) continue;

        seenPairs.add(pairKey);
      }

      // Only display candidates scoring 40 or more
      if (score >= 40) {
        matches.push({
          lostItem,
          foundItem,
          score,
          reasons
        });
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
