// Persists Adri's generated profile locally.
// No profile information is sent outside the browser.

import { DIMENSIONS } from "./profile.js";

const PROFILE_KEY = "heartagram:profile";

// Keeps the session working when storage is full or blocked (private mode).
let memoryProfile = null;

/**
 * A profile saved by an older build, or edited by hand, can miss fields the
 * recommender reads. Rejecting it here sends the user to the quiz instead of
 * leaving the app unable to start.
 */
export function isValidProfile(profile) {
  return Boolean(
    profile &&
      typeof profile === "object" &&
      profile.vector &&
      DIMENSIONS.every((dimension) => Number.isFinite(profile.vector[dimension])) &&
      typeof profile.archetypes?.primary === "string" &&
      typeof profile.archetypes?.secondary === "string" &&
      Array.isArray(profile.vibes) &&
      Number.isFinite(profile.horrorTolerance),
  );
}

export function saveProfile(profile) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    memoryProfile = null;
  } catch {
    memoryProfile = profile;
  }
}

export function getSavedProfile() {
  if (memoryProfile) return memoryProfile;

  try {
    const value = window.localStorage.getItem(PROFILE_KEY);

    if (!value) return null;

    const profile = JSON.parse(value);

    return isValidProfile(profile) ? profile : null;
  } catch {
    return null;
  }
}

export function clearSavedProfile() {
  memoryProfile = null;

  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // Nothing stored that could be removed.
  }
}
