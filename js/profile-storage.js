// Persists Adri's generated profile locally.
// No profile information is sent outside the browser.

const PROFILE_KEY = "heartagram:profile";

export function saveProfile(profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getSavedProfile() {
  try {
    const value = window.localStorage.getItem(PROFILE_KEY);

    if (!value) return null;

    const profile = JSON.parse(value);

    if (
      typeof profile !== "object" ||
      profile === null ||
      !profile.vector ||
      !profile.archetypes
    ) {
      return null;
    }

    return profile;
  } catch {
    return null;
  }
}

export function clearSavedProfile() {
  window.localStorage.removeItem(PROFILE_KEY);
}
