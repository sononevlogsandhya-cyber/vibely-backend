// Simple bad-words / spam filter for comments.
// Isme common English + Hinglish gaaliyan/spam patterns hain.
// Zaroorat pade to yahan aur words add kar sakte ho.

const BAD_WORDS = [
  "madarchod",
  "behenchod",
  "bhosdike",
  "chutiya",
  "gandu",
  "randi",
  "lund",
  "chod",
  "harami",
  "kutte",
  "saala kutta",
  "fuck",
  "fucking",
  "bitch",
  "asshole",
  "bastard",
  "slut",
  "whore",
  "nigger",
  "cunt",
];

// Spam patterns - repeated links, excessive caps, repeated characters
const SPAM_PATTERNS = [
  /(https?:\/\/[^\s]+){2,}/i, // multiple links in one comment
  /(.)\1{6,}/i, // same character repeated 7+ times (e.g. "aaaaaaaa")
];

const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // strip special chars people use to bypass filter (e.g. f*ck, f.u.c.k)
    .replace(/\s+/g, " ")
    .trim();
};

const containsBadWords = (text) => {
  const normalized = normalize(text);
  return BAD_WORDS.some((word) => normalized.includes(word));
};

const isSpam = (text) => {
  return SPAM_PATTERNS.some((pattern) => pattern.test(text));
};

// Main check - throws-friendly, returns { blocked, reason }
const checkComment = (text) => {
  if (containsBadWords(text)) {
    return { blocked: true, reason: "Comment mein inappropriate language hai" };
  }
  if (isSpam(text)) {
    return { blocked: true, reason: "Comment spam jaisa lag raha hai" };
  }
  return { blocked: false, reason: null };
};

module.exports = { checkComment };
