import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { GameCard } from "@/components/game/GameCard";
import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { getFullAnswerDate, useGame } from "@/context/GameContext";

/**
 * Question Screen
 * Displays the current question/answer with tap-to-flip interaction
 *
 * Flow:
 * 1. Card starts showing QUESTION side with disabled "nytt kort" button
 * 2. User taps card to flip to ANSWER side - button becomes enabled
 * 3. User can tap to flip back/forth freely
 * 4. Once answer has been revealed, "nytt kort" button stays enabled
 * 5. Pressing "nytt kort" completes the card and navigates back to /game
 *
 * Persistence:
 * - On refresh, restores the same card, flipped state, and button enabled state
 * - If no valid question found after hydration, redirects to /game
 */
export default function QuestionScreen() {
  const router = useRouter();
  const {
    isHydrated,
    currentQuestion,
    currentCategory,
    completeCurrentQuestion,
    getDiscardCount,
    endGame,
    isFlipped,
    setIsFlipped,
    hasRevealedAnswer,
    setHasRevealedAnswer,
    menuVisible,
    setMenuVisible,
    setFlowStep,
  } = useGame();

  const discardCount = getDiscardCount;

  // Update flow step when screen mounts
  useEffect(() => {
    if (isHydrated) {
      setFlowStep("question");
    }
  }, [isHydrated, setFlowStep]);

  // Redirect if no valid question after hydration
  useEffect(() => {
    if (isHydrated && (!currentQuestion || !currentCategory)) {
      router.replace("/game");
    }
  }, [isHydrated, currentQuestion, currentCategory, router]);

  /**
   * Handle tap on card to flip
   * - Tapping on QUESTION side flips to ANSWER and enables button
   * - Tapping on ANSWER side flips back to QUESTION
   * - User can flip freely after first reveal
   */
  const handleCardTap = useCallback(() => {
    if (!isFlipped) {
      // Flipping to answer for the first time enables the button permanently
      setHasRevealedAnswer(true);
    }
    setIsFlipped(!isFlipped);
  }, [isFlipped, setIsFlipped, setHasRevealedAnswer]);

  /**
   * Handle completing the card and going back to main game screen
   * Simply marks the card as used and navigates back
   */
  const handleComplete = useCallback(() => {
    if (!currentCategory || !currentQuestion) return;
    if (!hasRevealedAnswer) return; // Guard: button should be disabled anyway

    // Complete the question (marks as used, adds to discard pile, clears current)
    completeCurrentQuestion();

    // Navigate back to dice screen
    router.replace("/game");
  }, [
    currentCategory,
    currentQuestion,
    hasRevealedAnswer,
    completeCurrentQuestion,
    router,
  ]);

  /**
   * Navigate to discard pile
   */
  const handleDiscardPress = () => {
    router.push("/game/discard-pile");
  };

  /**
   * Handle menu actions
   */
  const handleEndGame = () => {
    setMenuVisible(false);
    endGame();
    router.replace("/");
  };

  const handleRules = () => {
    setMenuVisible(false);
    router.push("/rules");
  };

  const handleSettings = () => {
    setMenuVisible(false);
    router.push("/settings");
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  // If no current question (will redirect via useEffect), show loading
  if (!currentQuestion || !currentCategory) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  // Get the full answer date
  const fullAnswerDate = getFullAnswerDate(currentQuestion);

  // Determine which card side to show
  const cardFace = isFlipped ? "answer" : "question";

  return (
    <View style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        onDiscardPress={handleDiscardPress}
        discardCount={discardCount}
      />

      {/* Card */}
      <View style={styles.content}>
        <View style={styles.cardWrapper}>
          {cardFace === "question" ? (
            <GameCard
              type="question"
              event={currentQuestion.event}
              categoryId={currentCategory.id}
              buttonText="nytt kort"
              onButtonPress={handleComplete}
              buttonDisabled={!hasRevealedAnswer}
              onCardPress={handleCardTap}
            />
          ) : (
            <GameCard
              type="answer"
              categoryId={currentCategory.id}
              fullAnswerDate={fullAnswerDate}
              buttonText="nytt kort"
              onButtonPress={handleComplete}
              buttonDisabled={!hasRevealedAnswer}
              onCardPress={handleCardTap}
            />
          )}
        </View>
      </View>

      {/* Menu Modal */}
      <GameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRules={handleRules}
        onSettings={handleSettings}
        onAccount={() => {}}
        onEndGame={handleEndGame}
        onContinue={() => setMenuVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D24662",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cardWrapper: {
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
});
