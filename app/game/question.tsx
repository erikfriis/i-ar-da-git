import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { GameCard } from "@/components/game/GameCard";
import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { LowCardsPopup } from "@/components/game/LowCardsPopup";
import { useGame } from "@/context/GameContext";
import { getFullAnswerDate } from "@/hooks/useGameEngine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Card face type
type CardFace = "question" | "answer";

/**
 * Question Screen
 * Displays the current question/answer with swipe interactions
 *
 * IMPORTANT: When completing a card, checks if category needs reshuffling
 * BEFORE navigating back to /game. Popup appears here, not on Slumpa screen.
 */
export default function QuestionScreen() {
  const router = useRouter();
  const {
    currentQuestion,
    currentCategory,
    completeCurrentQuestion,
    getDiscardCount,
    needsReshuffle,
    resetUsedQuestionsForCategory,
    endGame,
  } = useGame();

  // Get discard count value
  const discardCount = getDiscardCount;

  const [cardFace, setCardFace] = useState<CardFace>("question");
  const [menuVisible, setMenuVisible] = useState(false);
  const [showLowCardsPopup, setShowLowCardsPopup] = useState(false);

  // Store category info for popup (since completeCurrentQuestion clears it)
  const pendingCategoryRef = useRef<{ id: string; label: string } | null>(null);

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  /**
   * Handle card flip to answer
   */
  const handleShowAnswer = useCallback(() => {
    setCardFace("answer");
  }, []);

  /**
   * Handle completing the card and going back to main game screen
   * Checks for reshuffle BEFORE navigating
   */
  const handleComplete = useCallback(() => {
    if (!currentCategory || !currentQuestion) return;

    // Store category info BEFORE completing (as completeCurrentQuestion clears it)
    const categoryId = currentCategory.id;
    const categoryLabel = currentCategory.label;
    pendingCategoryRef.current = { id: categoryId, label: categoryLabel };

    // Complete the question (marks as used, adds to discard pile, clears current)
    completeCurrentQuestion();

    // Check if this category now needs reshuffling (< 5 cards remaining)
    if (needsReshuffle(categoryId)) {
      // Show popup - navigation will happen after user confirms
      setShowLowCardsPopup(true);
    } else {
      // No reshuffle needed, navigate directly
      pendingCategoryRef.current = null;
      router.replace("/game");
    }
  }, [
    currentCategory,
    currentQuestion,
    completeCurrentQuestion,
    needsReshuffle,
    router,
  ]);

  /**
   * Handle low cards popup confirmation
   * Reshuffle the category, then navigate
   */
  const handleLowCardsConfirm = useCallback(() => {
    const pendingCategory = pendingCategoryRef.current;

    if (pendingCategory) {
      // Reset used questions for this specific category
      resetUsedQuestionsForCategory(pendingCategory.id);
    }

    // Clear the ref and popup
    pendingCategoryRef.current = null;
    setShowLowCardsPopup(false);

    // Now navigate to /game
    router.replace("/game");
  }, [resetUsedQuestionsForCategory, router]);

  /**
   * Handle swipe completion
   */
  const handleSwipeComplete = useCallback(() => {
    if (cardFace === "question") {
      // Show answer
      setCardFace("answer");
      translateX.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      // Complete card - this will handle the reshuffle check
      handleComplete();
    }
  }, [cardFace, handleComplete, translateX, opacity]);

  // Swipe gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow right swipe
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      const swipedRight = event.translationX > SWIPE_THRESHOLD;

      if (swipedRight) {
        // Animate card off screen
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 }, () => {
          runOnJS(handleSwipeComplete)();
        });
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
      }
    });

  // Animated styles for the card
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

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

  // If popup is showing (transitional state after completing question)
  if (showLowCardsPopup && pendingCategoryRef.current) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Keep the background consistent */}
        </View>
        <LowCardsPopup
          visible={true}
          categoryName={pendingCategoryRef.current.label}
          onConfirm={handleLowCardsConfirm}
        />
      </View>
    );
  }

  // If no current question and no popup, show error
  if (!currentQuestion || !currentCategory) {
    return (
      <View style={styles.container}>
        <GameHeader
          onMenuPress={() => setMenuVisible(true)}
          showDiscard={false}
        />
        <View style={styles.content}>
          <Text style={styles.errorText}>Ingen fråga hittades</Text>
        </View>
      </View>
    );
  }

  // Get the full answer date
  const fullAnswerDate = getFullAnswerDate(currentQuestion);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        onDiscardPress={handleDiscardPress}
        discardCount={discardCount}
      />

      {/* Card */}
      <View style={styles.content}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
            {cardFace === "question" ? (
              <GameCard
                type="question"
                event={currentQuestion.event}
                categoryId={currentCategory.id}
                buttonText="vänd kort"
                onButtonPress={handleShowAnswer}
              />
            ) : (
              <GameCard
                type="answer"
                categoryId={currentCategory.id}
                fullAnswerDate={fullAnswerDate}
                buttonText="nytt kort"
                onButtonPress={handleComplete}
              />
            )}
          </Animated.View>
        </GestureDetector>
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
    </GestureHandlerRootView>
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
