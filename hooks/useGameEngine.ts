import {
  Category,
  categories,
  getCategoryById,
  getRandomCategory,
} from "@/constants/categories";
import questionsData from "@/data/questions.json";
import { useCallback, useState } from "react";

/**
 * Question type definition - updated with date and event fields
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
 * - "category": directly go to question with this category
 * - "choose": user picks category (svart or vit outcome)
 */
export type RandomOutcome =
  | { type: "category"; categoryId: string }
  | { type: "choose" };

/**
 * Category color outcomes (for direct category selection)
 */
const CATEGORY_COLORS = ["gul", "blå", "lila", "grön"] as const;

/**
 * Probability of "svart eller vitt" (choose mode)
 * 15% = 0.15
 */
const CHOOSE_PROBABILITY = 0.15;

/**
 * Map color outcomes to category IDs
 */
const COLOR_TO_CATEGORY: Record<string, string> = {
  gul: "prylar",
  blå: "personer",
  lila: "underhallning",
  grön: "blandat",
};

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

  // IDs of questions used in this game session (cannot be reused)
  const [usedQuestions, setUsedQuestions] = useState<number[]>([]);

  // IDs of questions in the discard pile (completed questions)
  const [discardPile, setDiscardPile] = useState<number[]>([]);

  // Current index in discard pile for navigation
  const [discardIndex, setDiscardIndex] = useState<number>(0);

  /**
   * Start a new game - resets all state
   */
  const startNewGame = useCallback(() => {
    setUsedQuestions([]);
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
  const hasGameInProgress = usedQuestions.length > 0 || discardPile.length > 0;

  /**
   * Draw a random outcome
   * ~15% chance for "svart eller vitt" (choose mode)
   * ~85% chance for a random category
   */
  const drawRandomOutcome = useCallback((): RandomOutcome => {
    // 15% chance for "choose" mode (svart eller vitt)
    if (Math.random() < CHOOSE_PROBABILITY) {
      return { type: "choose" };
    }

    // 85% chance - pick a random category color
    const randomIndex = Math.floor(Math.random() * CATEGORY_COLORS.length);
    const pick = CATEGORY_COLORS[randomIndex];
    const categoryId = COLOR_TO_CATEGORY[pick];

    return { type: "category", categoryId };
  }, []);

  /**
   * Draw a random category (legacy function, still available)
   */
  const drawRandomCategory = useCallback((): Category => {
    const category = getRandomCategory();
    setCurrentCategory(category);
    return category;
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
   * Get available questions for a category (not yet used)
   */
  const getAvailableQuestions = useCallback(
    (categoryId: string): Question[] => {
      return allQuestions.filter(
        (q) => q.category === categoryId && !usedQuestions.includes(q.id)
      );
    },
    [allQuestions, usedQuestions]
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
   * Mark a question as used (cannot be drawn again this session)
   */
  const markQuestionAsUsed = useCallback((questionId: number) => {
    setUsedQuestions((prev) => {
      if (prev.includes(questionId)) return prev;
      return [...prev, questionId];
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
      markQuestionAsUsed(currentQuestion.id);
      addToDiscardPile(currentQuestion.id);
      setCurrentQuestion(null);
      setCurrentCategory(null); // Clear category so next round starts fresh
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
   * direction: -1 for newer (left swipe), 1 for older (right swipe)
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
   * Reset the round (clear used questions but keep discard pile)
   */
  const resetRound = useCallback(() => {
    setUsedQuestions([]);
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
   * Check if all questions are used
   */
  const areAllQuestionsUsed = usedQuestions.length >= allQuestions.length;

  /**
   * Get count of remaining questions in a category
   */
  const getRemainingInCategory = useCallback(
    (categoryId: string): number => {
      return getAvailableQuestions(categoryId).length;
    },
    [getAvailableQuestions]
  );

  /**
   * Get total question count
   */
  const getTotalQuestions = allQuestions.length;

  /**
   * Get used question count
   */
  const getUsedCount = usedQuestions.length;

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
    usedQuestions,
    discardPile,
    discardIndex,
    hasGameInProgress,
    areAllQuestionsUsed,

    // Actions
    startNewGame,
    resumeGame,
    endGame,
    drawRandomCategory,
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

    // Utilities
    getAvailableQuestions,
    isCategoryExhausted,
    getRemainingInCategory,
    getTotalQuestions,
    getUsedCount,
    getDiscardCount,
    getFullAnswerDate,
    getAllCategories,
  };
};

export default useGameEngine;
