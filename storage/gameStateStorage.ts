import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Storage key for game state - versioned for future migrations
 */
const STORAGE_KEY = "iar-da:gameState:v1";

/**
 * Flow step type - represents where we are in the game flow
 */
export type FlowStep =
  | "home"
  | "dice"
  | "category-result"
  | "choose-category"
  | "question"
  | "discard-pile";

/**
 * Active popup type
 */
export type ActivePopup =
  | null
  | "empty-category"
  | "all-cards-finished"
  | "menu";

/**
 * Choose category mode
 */
export type ChooseMode = "user" | "opponent" | null;

/**
 * Persisted game state schema
 * All IDs are numbers to keep storage minimal
 */
export interface PersistedGameState {
  // Schema version for future migrations
  schemaVersion: number;

  // Session info
  sessionId: string;
  createdAt: number;

  // Core game state
  selectedCategoryId: string | null;
  currentQuestionId: number | null;
  isFlipped: boolean;
  hasRevealedAnswer: boolean;

  // Per-category used question tracking
  usedQuestionsByCategory: Record<string, number[]>;

  // Discard pile (order: oldest first, newest last - matches current app behavior)
  discardPileIds: number[];
  discardActiveIndex: number;

  // Last outcome from dice (for resuming mid-flow)
  lastOutcome:
    | "prylar"
    | "personer"
    | "underhallning"
    | "blandat"
    | "choose-user"
    | "choose-opponent"
    | null;

  // Flow step (which screen we're on)
  flowStep: FlowStep;

  // For choose-category screen
  chooseCategoryMode: ChooseMode;

  // For category-result screen
  categoryResultId: string | null;

  // UI state
  menuVisible: boolean;
  activePopup: ActivePopup;
}

/**
 * Generate a random session ID
 */
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Get initial/default persisted state
 */
export const getInitialPersistedState = (): PersistedGameState => ({
  schemaVersion: 1,
  sessionId: generateSessionId(),
  createdAt: Date.now(),
  selectedCategoryId: null,
  currentQuestionId: null,
  isFlipped: false,
  hasRevealedAnswer: false,
  usedQuestionsByCategory: {
    prylar: [],
    personer: [],
    underhallning: [],
    blandat: [],
  },
  discardPileIds: [],
  discardActiveIndex: 0,
  lastOutcome: null,
  flowStep: "home",
  chooseCategoryMode: null,
  categoryResultId: null,
  menuVisible: false,
  activePopup: null,
});

/**
 * Validate the persisted state has required fields
 * Returns cleaned state or null if invalid
 */
const validatePersistedState = (
  data: unknown
): PersistedGameState | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const state = data as Record<string, unknown>;

  // Check required fields exist
  if (
    typeof state.sessionId !== "string" ||
    typeof state.schemaVersion !== "number" ||
    state.schemaVersion !== 1
  ) {
    return null;
  }

  // Ensure arrays are arrays
  if (!Array.isArray(state.discardPileIds)) {
    return null;
  }

  if (
    typeof state.usedQuestionsByCategory !== "object" ||
    state.usedQuestionsByCategory === null
  ) {
    return null;
  }

  // Return as properly typed (we've done basic validation)
  return state as unknown as PersistedGameState;
};

/**
 * Load persisted game state from storage
 * Returns null if no state exists or if state is invalid
 */
export const loadPersistedGameState =
  async (): Promise<PersistedGameState | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

      if (!jsonValue) {
        return null;
      }

      const parsed = JSON.parse(jsonValue);
      const validated = validatePersistedState(parsed);

      if (!validated) {
        // Invalid state - clear it
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return validated;
    } catch (error) {
      console.warn("Failed to load persisted game state:", error);
      // Clear potentially corrupted data
      try {
        await AsyncStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore cleanup errors
      }
      return null;
    }
  };

/**
 * Save game state to storage
 */
export const savePersistedGameState = async (
  state: PersistedGameState
): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (error) {
    console.warn("Failed to save persisted game state:", error);
  }
};

/**
 * Clear persisted game state from storage
 */
export const clearPersistedGameState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear persisted game state:", error);
  }
};

