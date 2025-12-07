import { Category, categories, getCategoryById } from "@/constants/categories";
import questionsData from "@/data/questions.json";
import { useCallback, useState } from "react";

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
 * - "category": show category result screen, then question
 * - "choose": user or opponent picks category
 */
export type RandomOutcome =
  | { type: "category"; categoryId: string }
  | { type: "choose"; mode: "user" | "opponent" };

/**
 * The 6 possible outcomes with equal probability
 */
const OUTCOMES = [
  { type: "category", categoryId: "prylar" }, // Yellow
  { type: "category", categoryId: "personer" }, // Blue
  { type: "category", categoryId: "underhallning" }, // Purple
  { type: "category", categoryId: "blandat" }, // Green
  { type: "choose", mode: "user" }, // White - user chooses
  { type: "choose", mode: "opponent" }, // Black - opponent chooses
] as const;

/**
 * Minimum cards threshold before reshuffling category
 * When remaining cards < 5, reshuffle is triggered
 */
const MIN_CARDS_THRESHOLD = 5;

/**
 * Get the full answer date string (e.g., "17 juni 2025")
 */
export const getFullAnswerDate = (question: Question): string => {
  return `${question.date} ${question.answer}`;
};

/**
 * Game Engine Hook
 * Manages all game logic including questions, categories, and discard pile
 */
export const useGameEngine = () => {
  // All questions loaded from JSON
  const [allQuestions] = useState<Question[]>(questionsData as Question[]);

  // Current game state
  const [gameState, setGameState] = useState<GameState>("idle");

  // Currently selected category
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

  // Current question being displayed
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  // Per-category used questions tracking
  // Key: categoryId, Value: array of question IDs used in that category
  const [usedQuestionsByCategory, setUsedQuestionsByCategory] = useState<
    Record<string, number[]>
  >({
    prylar: [],
    personer: [],
    underhallning: [],
    blandat: [],
  });

  // IDs of questions in the discard pile (completed questions - NEVER resets during session)
  const [discardPile, setDiscardPile] = useState<number[]>([]);

  // Current index in discard pile for navigation
  const [discardIndex, setDiscardIndex] = useState<number>(0);

  /**
   * Start a new game - resets all state
   */
  const startNewGame = useCallback(() => {
    setUsedQuestionsByCategory({
      prylar: [],
      personer: [],
      underhallning: [],
      blandat: [],
    });
    setDiscardPile([]);
    setCurrentCategory(null);
    setCurrentQuestion(null);
    setDiscardIndex(0);
    setGameState("playing");
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
   * Draw a random outcome (1/6 each, equal probability)
   * Returns category to show result screen, or choose mode for user/opponent selection
   */
  const drawRandomOutcome = useCallback((): RandomOutcome => {
    const randomIndex = Math.floor(Math.random() * OUTCOMES.length);
    const outcome = OUTCOMES[randomIndex];

    if (outcome.type === "choose") {
      return { type: "choose", mode: outcome.mode };
    }

    return { type: "category", categoryId: outcome.categoryId };
  }, []);

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
   * Check if category needs reshuffling (less than 10 cards remaining)
   */
  const needsReshuffle = useCallback(
    (categoryId: string): boolean => {
      return getRemainingCards(categoryId) < MIN_CARDS_THRESHOLD;
    },
    [getRemainingCards]
  );

  /**
   * Reset used questions for a specific category only
   * Does NOT affect discard pile
   */
  const resetUsedQuestionsForCategory = useCallback((categoryId: string) => {
    setUsedQuestionsByCategory((prev) => ({
      ...prev,
      [categoryId]: [],
    }));
  }, []);

  /**
   * Get available questions for a category (not yet used in this category)
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
   * Returns null if no questions available
   */
  const drawRandomQuestion = useCallback(
    (categoryId: string): Question | null => {
      const available = getAvailableQuestions(categoryId);

      if (available.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * available.length);
      const question = available[randomIndex];

      setCurrentQuestion(question);
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
    // Update discard index to show the latest card
    setDiscardIndex(0);
  }, []);

  /**
   * Complete current question (mark as used and add to discard)
   * Clears current question and category after completion
   */
  const completeCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      markQuestionAsUsed(currentQuestion);
      addToDiscardPile(currentQuestion.id);
      setCurrentQuestion(null);
      setCurrentCategory(null);
    }
  }, [currentQuestion, markQuestionAsUsed, addToDiscardPile]);

  /**
   * Get a question from the discard pile by index
   * Index 0 = most recent, higher = older
   */
  const getDiscardCard = useCallback(
    (index: number): Question | null => {
      if (discardPile.length === 0) return null;

      // Reverse the pile so index 0 is most recent
      const reversedPile = [...discardPile].reverse();

      if (index < 0 || index >= reversedPile.length) return null;

      const questionId = reversedPile[index];
      return allQuestions.find((q) => q.id === questionId) || null;
    },
    [discardPile, allQuestions]
  );

  /**
   * Navigate through discard pile
   * direction: -1 for newer, 1 for older
   */
  const navigateDiscardPile = useCallback(
    (direction: -1 | 1): Question | null => {
      const newIndex = discardIndex + direction;

      if (newIndex < 0 || newIndex >= discardPile.length) {
        return getDiscardCard(discardIndex);
      }

      setDiscardIndex(newIndex);
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
   * Reset the round (clear all used questions but keep discard pile)
   */
  const resetRound = useCallback(() => {
    setUsedQuestionsByCategory({
      prylar: [],
      personer: [],
      underhallning: [],
      blandat: [],
    });
    setCurrentQuestion(null);
    setCurrentCategory(null);
  }, []);

  /**
   * End the game and return to idle state
   */
  const endGame = useCallback(() => {
    setGameState("idle");
    setCurrentQuestion(null);
    setCurrentCategory(null);
  }, []);

  /**
   * Check if all questions in a category are used
   */
  const isCategoryExhausted = useCallback(
    (categoryId: string): boolean => {
      return getAvailableQuestions(categoryId).length === 0;
    },
    [getAvailableQuestions]
  );

  /**
   * Check if all questions are used across all categories
   */
  const areAllQuestionsUsed = Object.keys(usedQuestionsByCategory).every(
    (categoryId) => isCategoryExhausted(categoryId)
  );

  /**
   * Get total question count
   */
  const getTotalQuestions = allQuestions.length;

  /**
   * Get total used question count across all categories
   */
  const getUsedCount = Object.values(usedQuestionsByCategory).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  /**
   * Get discard pile count
   */
  const getDiscardCount = discardPile.length;

  /**
   * Get all categories
   */
  const getAllCategories = categories;

  return {
    // State
    gameState,
    currentCategory,
    currentQuestion,
    usedQuestionsByCategory,
    discardPile,
    discardIndex,
    hasGameInProgress,
    areAllQuestionsUsed,

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
    resetRound,
    resetUsedQuestionsForCategory,

    // Utilities
    getAvailableQuestions,
    isCategoryExhausted,
    getRemainingCards,
    needsReshuffle,
    getTotalQuestionsInCategory,
    getTotalQuestions,
    getUsedCount,
    getDiscardCount,
    getFullAnswerDate,
    getAllCategories,
  };
};

export default useGameEngine;
