import { User, FAMILY_MEMBERS, AppState } from './types';

const STORAGE_KEY = 'fuertes_secret_santa_v1';

export const getInitialState = (): AppState => {
  // 1. Check URL for shared state (Priority)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedData = urlParams.get('data');
  
  if (sharedData) {
    try {
      const decodedState = JSON.parse(atob(decodeURIComponent(sharedData)));
      // Save immediately to local storage so future reloads work
      saveState(decodedState);
      // Clean URL to avoid clutter
      window.history.replaceState({}, document.title, window.location.pathname);
      return decodedState;
    } catch (e) {
      console.error("Failed to load shared state", e);
    }
  }

  // 2. Check Local Storage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // 3. Default Init
  const initialUsers: User[] = FAMILY_MEMBERS.map((name) => ({
    id: name.toLowerCase(),
    name,
    wishlist: '',
  }));

  return {
    users: initialUsers,
    isDrawDone: false,
  };
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const generateShareUrl = (state: AppState): string => {
  // We encode the state to Base64 to pass it via URL
  // We remove empty wishlists to save space if needed, but for simplicity we send full state
  // ideally password should be hashed but for a family game simple text is okay-ish
  const jsonString = JSON.stringify(state);
  const encoded = encodeURIComponent(btoa(jsonString));
  const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`;
  return url;
};

export const performDraw = (users: User[]): User[] => {
  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    const shuffled = [...users];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Check validity: no one assigned to themselves
    let isValid = true;
    const assignments: { [key: string]: string } = {};

    for (let i = 0; i < users.length; i++) {
      if (users[i].id === shuffled[i].id) {
        isValid = false;
        break;
      }
      assignments[users[i].id] = shuffled[i].id;
    }

    if (isValid) {
      // Apply assignments
      return users.map(u => ({
        ...u,
        assignedTo: assignments[u.id]
      }));
    }
    attempts++;
  }
  
  throw new Error("Could not find a valid draw after many attempts.");
};