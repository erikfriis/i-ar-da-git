import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Category, getCategoryById, categories } from "@/constants/categories";
import questionsData from "@/data/questions.json";
import {
  PersistedGameState,
  FlowStep,
  ActivePopup,
  ChooseMode,
  loadPersistedGameState,
  savePersistedGameState,
  clearPersistedGameState,
  getInitialPersistedState,
  generateSessionId,
} from "@/storage/gameStateStorage";

/**
 * Question type definition
 */
export interface Question {
  id: number;
  category: string;
  date: string;
  event: string;
  answer: string;
}

/**
 * Game state type
 */
export type GameState = "idle" | "playing" | "finished";

/**
 * Outcome types for drawRandomOutcome
 */
export type RandomOutcome =
  | { type: "category"; categoryId: string }
  | { type: "choose"; mode: "user" | "opponent" };

/**
 * Get the full answer date string (e.g., "17 juni 2025")
 */
export const getFullAnswerDate = (question: Question): string => {
  return `${question.date} ${question.answer}`;
};

/**
 * Category IDs for the 4 colored categories
 */
const CATEGORY_IDS = ["prylar", "personer", "underhallning", "blandat"];

/**
 * Type for the game context value
 */
interface GameContextValue {
  // Hydration state
  isHydrated: boolean;

  // Flow state
  flowStep: FlowStep;
  setFlowStep: (step: FlowStep) => void;
  chooseCategoryMode: ChooseMode;
  setChooseCategoryMode: (mode: ChooseMode) => void;
  categoryResultId: string | null;
  setCategoryResultId: (id: string | null) => void;

  // Card state
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean) => void;
  hasRevealedAnswer: boolean;
  setHasRevealedAnswer: (revealed: boolean) => void;

  // Core game state
  gameState: GameState;
  currentCategory: Category | null;
  currentQuestion: Question | null;
  usedQuestionsByCategory: Record<string, number[]>;
  discardPile: number[];
  discardIndex: number;
  hasGameInProgress: boolean;
  areAllQuestionsUsed: boolean;

  // UI state
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  activePopup: ActivePopup;
  setActivePopup: (popup: ActivePopup) => void;

  // Actions
  startNewGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  drawRandomOutcome: () => RandomOutcome | null;
  selectCategory: (category: Category) => void;
  selectCategoryById: (categoryId: string) => void;
  drawRandomQuestion: (categoryId: string) => Question | null;
  markQuestionAsUsed: (question: Question) => void;
  addToDiscardPile: (questionId: number) => void;
  completeCurrentQuestion: () => void;
  navigateDiscardPile: (direction: -1 | 1) => Question | null;
  getCurrentDiscardCard: () => Question | null;
  getDiscardCard: (index: number) => Question | null;
  setDiscardIndex: (index: number) => void;
  resetRound: () => void;
  resetAllUsedQuestions: () => void;

  // Utilities
  getAvailableQuestions: (categoryId: string) => Question[];
  getAvailableOutcomes: () => RandomOutcome[];
  isCategoryExhausted: (categoryId: string) => boolean;
  isCategoryEmpty: (categoryId: string) => boolean;
  areAllCategoriesEmpty: () => boolean;
  getRemainingCards: (categoryId: string) => number;
  getTotalQuestionsInCategory: (categoryId: string) => number;
  getTotalQuestions: number;
  getUsedCount: number;
  getDiscardCount: number;
  getAllCategories: typeof categories;
}

// Create the context
const GameContext = createContext<GameContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface GameProviderProps {
  children: ReactNode;
}

/**
 * Debounce helper
 */
const useDebouncedCallback = <T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
};

/**
 * GameProvider - Provides game state to all screens with persistence
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // All questions loaded from JSON
  const allQuestions = questionsData as Question[];

  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  // Flow state
  const [flowStep, setFlowStepInternal] = useState<FlowStep>("home");
  const [chooseCategoryMode, setChooseCategoryModeInternal] =
    useState<ChooseMode>(null);
  const [categoryResultId, setCategoryResultIdInternal] = useState<
    string | null
  >(null);

  // Card state
  const [isFlipped, setIsFlippedInternal] = useState(false);
  const [hasRevealedAnswer, setHasRevealedAnswerInternal] = useState(false);

  // Current game state
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(
    null
  );

  // Per-category used questions tracking
  const [usedQuestionsByCategory, setUsedQuestionsByCategory] = useState<
    Record<string, number[]>
  >({
    prylar: [],
    personer: [],
    underhallning: [],
    blandat: [],
  });

  // Discard pile
  const [discardPile, setDiscardPile] = useState<number[]>([]);
  const [discardIndex, setDiscardIndexInternal] = useState(0);

  // Session
  const [sessionId, setSessionId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<number>(0);

  // Last outcome
  const [lastOutcome, setLastOutcome] = useState<
    | "prylar"
    | "personer"
    | "underhallning"
    | "blandat"
    | "choose-user"
    | "choose-opponent"
    | null
  >(null);

  // UI state
  const [menuVisible, setMenuVisibleInternal] = useState(false);
  const [activePopup, setActivePopupInternal] = useState<ActivePopup>(null);

  // Derive current question from ID
  const currentQuestion =
    currentQuestionId !== null
      ? allQuestions.find((q) => q.id === currentQuestionId) || null
      : null;

  // Build current persisted state
  const buildPersistedState = useCallback((): PersistedGameState => {
    return {
      schemaVersion: 1,
      sessionId,
      createdAt,
      selectedCategoryId: currentCategory?.id || null,
      currentQuestionId,
      isFlipped,
      hasRevealedAnswer,
      usedQuestionsByCategory,
      discardPileIds: discardPile,
      discardActiveIndex: discardIndex,
      lastOutcome,
      flowStep,
      chooseCategoryMode,
      categoryResultId,
      menuVisible,
      activePopup,
    };
  }, [
    sessionId,
    createdAt,
    currentCategory,
    currentQuestionId,
    isFlipped,
    hasRevealedAnswer,
    usedQuestionsByCategory,
    discardPile,
    discardIndex,
    lastOutcome,
    flowStep,
    chooseCategoryMode,
    categoryResultId,
    menuVisible,
    activePopup,
  ]);

  // Debounced save function
  const debouncedSave = useDebouncedCallback(
    (state: PersistedGameState) => {
      savePersistedGameState(state);
    },
    300
  );

  // Persist state changes (after hydration)
  useEffect(() => {
    if (isHydrated && sessionId) {
      const state = buildPersistedState();
      debouncedSave(state);
    }
  }, [
    isHydrated,
    sessionId,
    currentCategory,
    currentQuestionId,
    isFlipped,
    hasRevealedAnswer,
    usedQuestionsByCategory,
    discardPile,
    discardIndex,
    lastOutcome,
    flowStep,
    chooseCategoryMode,
    categoryResultId,
    menuVisible,
    activePopup,
    buildPersistedState,
    debouncedSave,
  ]);

  // Hydrate state on mount
  useEffect(() => {
    const hydrate = async () => {
      const persisted = await loadPersistedGameState();

      if (persisted) {
        // Validate question IDs still exist in the data
        const validQuestionIds = new Set(allQuestions.map((q) => q.id));

        // Clean usedQuestionsByCategory
        const cleanedUsedQuestions: Record<string, number[]> = {};
        for (const [cat, ids] of Object.entries(
          persisted.usedQuestionsByCategory
        )) {
          cleanedUsedQuestions[cat] = ids.filter((id) =>
            validQuestionIds.has(id)
          );
        }

        // Clean discardPile
        const cleanedDiscardPile = persisted.discardPileIds.filter((id) =>
          validQuestionIds.has(id)
        );

        // Validate currentQuestionId
        let validCurrentQuestionId = persisted.currentQuestionId;
        let validFlowStep = persisted.flowStep;
        if (
          validCurrentQuestionId !== null &&
          !validQuestionIds.has(validCurrentQuestionId)
        ) {
          validCurrentQuestionId = null;
          validFlowStep = "dice"; // Reset to dice if current question is invalid
        }

        // Restore state
        setSessionId(persisted.sessionId);
        setCreatedAt(persisted.createdAt);
        setCurrentQuestionId(validCurrentQuestionId);
        setIsFlippedInternal(persisted.isFlipped);
        setHasRevealedAnswerInternal(persisted.hasRevealedAnswer);
        setUsedQuestionsByCategory(cleanedUsedQuestions);
        setDiscardPile(cleanedDiscardPile);
        setDiscardIndexInternal(
          Math.min(persisted.discardActiveIndex, cleanedDiscardPile.length - 1)
        );
        setLastOutcome(persisted.lastOutcome);
        setFlowStepInternal(validFlowStep);
        setChooseCategoryModeInternal(persisted.chooseCategoryMode);
        setCategoryResultIdInternal(persisted.categoryResultId);
        setMenuVisibleInternal(false); // Don't restore menu visibility
        setActivePopupInternal(null); // Don't restore popup visibility

        // Restore category
        if (persisted.selectedCategoryId) {
          const cat = getCategoryById(persisted.selectedCategoryId);
          setCurrentCategory(cat || null);
        }

        // Set game state based on whether there's progress
        const hasProgress =
          cleanedDiscardPile.length > 0 ||
          Object.values(cleanedUsedQuestions).some((arr) => arr.length > 0);
        if (hasProgress || validFlowStep !== "home") {
          setGameState("playing");
        }

        // If we had cleaned data, save it back
        if (
          persisted.currentQuestionId !== validCurrentQuestionId ||
          persisted.flowStep !== validFlowStep
        ) {
          await savePersistedGameState({
            ...persisted,
            currentQuestionId: validCurrentQuestionId,
            flowStep: validFlowStep,
            usedQuestionsByCategory: cleanedUsedQuestions,
            discardPileIds: cleanedDiscardPile,
          });
        }
      }

      setIsHydrated(true);
    };

    hydrate();
  }, [allQuestions]);

  // Wrapped setters that persist
  const setFlowStep = useCallback((step: FlowStep) => {
    setFlowStepInternal(step);
  }, []);

  const setChooseCategoryMode = useCallback((mode: ChooseMode) => {
    setChooseCategoryModeInternal(mode);
  }, []);

  const setCategoryResultId = useCallback((id: string | null) => {
    setCategoryResultIdInternal(id);
  }, []);

  const setIsFlipped = useCallback((flipped: boolean) => {
    setIsFlippedInternal(flipped);
  }, []);

  const setHasRevealedAnswer = useCallback((revealed: boolean) => {
    setHasRevealedAnswerInternal(revealed);
  }, []);

  const setMenuVisible = useCallback((visible: boolean) => {
    setMenuVisibleInternal(visible);
  }, []);

  const setActivePopup = useCallback((popup: ActivePopup) => {
    setActivePopupInternal(popup);
  }, []);

  const setDiscardIndex = useCallback((index: number) => {
    setDiscardIndexInternal(index);
  }, []);

  /**
   * Start a new game - clears persisted state and resets everything
   */
  const startNewGame = useCallback(async () => {
    // Clear persisted state
    await clearPersistedGameState();

    // Generate new session
    const newSessionId = generateSessionId();
    const newCreatedAt = Date.now();

    // Reset all state
    setSessionId(newSessionId);
    setCreatedAt(newCreatedAt);
    setUsedQuestionsByCategory({
      prylar: [],
      personer: [],
      underhallning: [],
      blandat: [],
    });
    setDiscardPile([]);
    setCurrentCategory(null);
    setCurrentQuestionId(null);
    setDiscardIndexInternal(0);
    setIsFlippedInternal(false);
    setHasRevealedAnswerInternal(false);
    setLastOutcome(null);
    setFlowStepInternal("dice");
    setChooseCategoryModeInternal(null);
    setCategoryResultIdInternal(null);
    setMenuVisibleInternal(false);
    setActivePopupInternal(null);
    setGameState("playing");

    // Persist the new initial state immediately
    const newState = getInitialPersistedState();
    newState.sessionId = newSessionId;
    newState.createdAt = newCreatedAt;
    newState.flowStep = "dice";
    await savePersistedGameState(newState);
  }, []);

  /**
   * Resume an existing game (keeps current state)
   */
  const resumeGame = useCallback(() => {
    setGameState("playing");
  }, []);

  /**
   * Check if there's a game in progress
   */
  const hasGameInProgress =
    discardPile.length > 0 ||
    Object.values(usedQuestionsByCategory).some((arr) => arr.length > 0);

  /**
   * Get total questions in a category
   */
  const getTotalQuestionsInCategory = useCallback(
    (categoryId: string): number => {
      return allQuestions.filter((q) => q.category === categoryId).length;
    },
    [allQuestions]
  );

  /**
   * Get remaining (unused) cards count for a category
   */
  const getRemainingCards = useCallback(
    (categoryId: string): number => {
      const totalInCategory = allQuestions.filter(
        (q) => q.category === categoryId
      ).length;
      const usedInCategory = usedQuestionsByCategory[categoryId]?.length || 0;
      return totalInCategory - usedInCategory;
    },
    [allQuestions, usedQuestionsByCategory]
  );

  /**
   * Check if a category is empty (has 0 remaining cards)
   */
  const isCategoryEmpty = useCallback(
    (categoryId: string): boolean => {
      return getRemainingCards(categoryId) === 0;
    },
    [getRemainingCards]
  );

  /**
   * Check if ALL categories are empty (game is fully out of cards)
   */
  const areAllCategoriesEmpty = useCallback((): boolean => {
    return CATEGORY_IDS.every((id) => isCategoryEmpty(id));
  }, [isCategoryEmpty]);

  /**
   * Get list of available outcomes for the dice
   */
  const getAvailableOutcomes = useCallback((): RandomOutcome[] => {
    const outcomes: RandomOutcome[] = [];

    for (const categoryId of CATEGORY_IDS) {
      if (!isCategoryEmpty(categoryId)) {
        outcomes.push({ type: "category", categoryId });
      }
    }

    outcomes.push({ type: "choose", mode: "user" });
    outcomes.push({ type: "choose", mode: "opponent" });

    return outcomes;
  }, [isCategoryEmpty]);

  /**
   * Draw a random outcome from available outcomes
   */
  const drawRandomOutcome = useCallback((): RandomOutcome | null => {
    if (areAllCategoriesEmpty()) {
      return null;
    }

    const availableOutcomes = getAvailableOutcomes();

    if (availableOutcomes.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableOutcomes.length);
    const outcome = availableOutcomes[randomIndex];

    // Store the outcome for persistence
    if (outcome.type === "category") {
      setLastOutcome(
        outcome.categoryId as
          | "prylar"
          | "personer"
          | "underhallning"
          | "blandat"
      );
    } else {
      setLastOutcome(
        outcome.mode === "user" ? "choose-user" : "choose-opponent"
      );
    }

    return outcome;
  }, [areAllCategoriesEmpty, getAvailableOutcomes]);

  /**
   * Set a specific category by ID
   */
  const selectCategoryById = useCallback((categoryId: string) => {
    const category = getCategoryById(categoryId);
    if (category) {
      setCurrentCategory(category);
    }
  }, []);

  /**
   * Set a specific category
   */
  const selectCategory = useCallback((category: Category) => {
    setCurrentCategory(category);
  }, []);

  /**
   * Reset used questions for ALL categories
   */
  const resetAllUsedQuestions = useCallback(() => {
    setUsedQuestionsByCategory({
      prylar: [],
      personer: [],
      underhallning: [],
      blandat: [],
    });
    setCurrentQuestionId(null);
    setCurrentCategory(null);
    setIsFlippedInternal(false);
    setHasRevealedAnswerInternal(false);
  }, []);

  /**
   * Get available questions for a category
   */
  const getAvailableQuestions = useCallback(
    (categoryId: string): Question[] => {
      const usedIds = usedQuestionsByCategory[categoryId] || [];
      return allQuestions.filter(
        (q) => q.category === categoryId && !usedIds.includes(q.id)
      );
    },
    [allQuestions, usedQuestionsByCategory]
  );

  /**
   * Draw a random question from a category
   */
  const drawRandomQuestion = useCallback(
    (categoryId: string): Question | null => {
      const available = getAvailableQuestions(categoryId);

      if (available.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * available.length);
      const question = available[randomIndex];

      setCurrentQuestionId(question.id);
      setIsFlippedInternal(false);
      setHasRevealedAnswerInternal(false);
      return question;
    },
    [getAvailableQuestions]
  );

  /**
   * Mark a question as used in its category
   */
  const markQuestionAsUsed = useCallback((question: Question) => {
    setUsedQuestionsByCategory((prev) => {
      const categoryUsed = prev[question.category] || [];
      if (categoryUsed.includes(question.id)) return prev;
      return {
        ...prev,
        [question.category]: [...categoryUsed, question.id],
      };
    });
  }, []);

  /**
   * Add a question to the discard pile
   */
  const addToDiscardPile = useCallback((questionId: number) => {
    setDiscardPile((prev) => {
      if (prev.includes(questionId)) return prev;
      return [...prev, questionId];
    });
    setDiscardIndexInternal(0);
  }, []);

  /**
   * Complete current question
   */
  const completeCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      markQuestionAsUsed(currentQuestion);
      addToDiscardPile(currentQuestion.id);
      setCurrentQuestionId(null);
      setCurrentCategory(null);
      setIsFlippedInternal(false);
      setHasRevealedAnswerInternal(false);
    }
  }, [currentQuestion, markQuestionAsUsed, addToDiscardPile]);

  /**
   * Get a question from the discard pile by index
   */
  const getDiscardCard = useCallback(
    (index: number): Question | null => {
      if (discardPile.length === 0) return null;

      const reversedPile = [...discardPile].reverse();

      if (index < 0 || index >= reversedPile.length) return null;

      const questionId = reversedPile[index];
      return allQuestions.find((q) => q.id === questionId) || null;
    },
    [discardPile, allQuestions]
  );

  /**
   * Navigate through discard pile
   */
  const navigateDiscardPile = useCallback(
    (direction: -1 | 1): Question | null => {
      const newIndex = discardIndex + direction;

      if (newIndex < 0 || newIndex >= discardPile.length) {
        return getDiscardCard(discardIndex);
      }

      setDiscardIndexInternal(newIndex);
      return getDiscardCard(newIndex);
    },
    [discardIndex, discardPile.length, getDiscardCard]
  );

  /**
   * Get current discard card
   */
  const getCurrentDiscardCard = useCallback((): Question | null => {
    return getDiscardCard(discardIndex);
  }, [getDiscardCard, discardIndex]);

  /**
   * Reset the round
   */
  const resetRound = useCallback(() => {
    resetAllUsedQuestions();
  }, [resetAllUsedQuestions]);

  /**
   * End the game and return to idle state
   */
  const endGame = useCallback(async () => {
    await clearPersistedGameState();
    setGameState("idle");
    setCurrentQuestionId(null);
    setCurrentCategory(null);
    setIsFlippedInternal(false);
    setHasRevealedAnswerInternal(false);
    setDiscardPile([]);
    setUsedQuestionsByCategory({
      prylar: [],
      personer: [],
      underhallning: [],
      blandat: [],
    });
    setFlowStepInternal("home");
    setSessionId("");
  }, []);

  /**
   * Check if category is exhausted
   */
  const isCategoryExhausted = useCallback(
    (categoryId: string): boolean => {
      return isCategoryEmpty(categoryId);
    },
    [isCategoryEmpty]
  );

  const areAllQuestionsUsed = areAllCategoriesEmpty();
  const getTotalQuestions = allQuestions.length;
  const getUsedCount = Object.values(usedQuestionsByCategory).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const getDiscardCount = discardPile.length;
  const getAllCategories = categories;

  const value: GameContextValue = {
    // Hydration
    isHydrated,

    // Flow state
    flowStep,
    setFlowStep,
    chooseCategoryMode,
    setChooseCategoryMode,
    categoryResultId,
    setCategoryResultId,

    // Card state
    isFlipped,
    setIsFlipped,
    hasRevealedAnswer,
    setHasRevealedAnswer,

    // Core state
    gameState,
    currentCategory,
    currentQuestion,
    usedQuestionsByCategory,
    discardPile,
    discardIndex,
    hasGameInProgress,
    areAllQuestionsUsed,

    // UI state
    menuVisible,
    setMenuVisible,
    activePopup,
    setActivePopup,

    // Actions
    startNewGame,
    resumeGame,
    endGame,
    drawRandomOutcome,
    selectCategory,
    selectCategoryById,
    drawRandomQuestion,
    markQuestionAsUsed,
    addToDiscardPile,
    completeCurrentQuestion,
    navigateDiscardPile,
    getCurrentDiscardCard,
    getDiscardCard,
    setDiscardIndex,
    resetRound,
    resetAllUsedQuestions,

    // Utilities
    getAvailableQuestions,
    getAvailableOutcomes,
    isCategoryExhausted,
    isCategoryEmpty,
    areAllCategoriesEmpty,
    getRemainingCards,
    getTotalQuestionsInCategory,
    getTotalQuestions,
    getUsedCount,
    getDiscardCount,
    getAllCategories,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

/**
 * Hook to use the game context
 */
export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

export default GameContext;

// Re-export types from storage
export type { FlowStep, ActivePopup, ChooseMode } from "@/storage/gameStateStorage";
