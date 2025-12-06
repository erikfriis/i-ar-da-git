import questionsData from "@/assets/questions.json";
import { useCallback, useState } from "react";

// Type definition for a card/question
export interface Card {
  id: number;
  question: string;
  answer: string;
}

// State interface for the hook
interface UseCardsState {
  currentCard: Card | null;
  usedCards: number[];
  discardPile: number[]; // Prepared for future use
  allCardsUsed: boolean;
}

// Return type for the hook
interface UseCardsReturn extends UseCardsState {
  getNextCard: () => Card | null;
  resetRound: () => void;
  getRemainingCount: () => number;
  getTotalCount: () => number;
}

/**
 * Placeholder function for future database integration
 * Can be replaced with Supabase, Firebase, or custom API calls
 */
const loadQuestionsFromDatabase = async (): Promise<Card[]> => {
  // TODO: Replace with actual database call
  // Example implementations:
  //
  // Supabase:
  // const { data, error } = await supabase.from('questions').select('*');
  // return data as Card[];
  //
  // Firebase:
  // const snapshot = await firebase.firestore().collection('questions').get();
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  //
  // Custom API:
  // const response = await fetch('https://api.example.com/questions');
  // return response.json();

  // For now, return local JSON data
  return questionsData as Card[];
};

/**
 * Custom hook for managing trivia cards
 * Handles card selection, tracking used cards, and round management
 */
export const useCards = (): UseCardsReturn => {
  // Load questions from local JSON (or database in the future)
  const [questions] = useState<Card[]>(questionsData as Card[]);

  // Track the current card being displayed
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

  // Track which cards have been used in this round
  const [usedCards, setUsedCards] = useState<number[]>([]);

  // Discard pile for future functionality (e.g., removing cards from rotation)
  const [discardPile, setDiscardPile] = useState<number[]>([]);

  /**
   * Get the next unused card from the deck
   * Returns null if all cards have been used
   */
  const getNextCard = useCallback((): Card | null => {
    // Filter out used cards
    const availableCards = questions.filter(
      (card) => !usedCards.includes(card.id)
    );

    if (availableCards.length === 0) {
      setCurrentCard(null);
      return null;
    }

    // Pick a random card from available cards
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const nextCard = availableCards[randomIndex];

    // Update state
    setCurrentCard(nextCard);
    setUsedCards((prev) => [...prev, nextCard.id]);

    return nextCard;
  }, [questions, usedCards]);

  /**
   * Reset the round - clear used cards and current card
   */
  const resetRound = useCallback((): void => {
    setUsedCards([]);
    setCurrentCard(null);
    // Note: discardPile is NOT reset - cards there are permanently removed
  }, []);

  /**
   * Get the number of remaining cards in this round
   */
  const getRemainingCount = useCallback((): number => {
    return questions.length - usedCards.length;
  }, [questions.length, usedCards.length]);

  /**
   * Get the total number of cards
   */
  const getTotalCount = useCallback((): number => {
    return questions.length;
  }, [questions.length]);

  /**
   * Check if all cards have been used
   */
  const allCardsUsed = usedCards.length >= questions.length;

  return {
    currentCard,
    usedCards,
    discardPile,
    allCardsUsed,
    getNextCard,
    resetRound,
    getRemainingCount,
    getTotalCount,
  };
};

export default useCards;
