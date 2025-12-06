import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { useGame } from "@/context/GameContext";
import { getFullAnswerDate } from "@/hooks/useGameEngine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Card face type
type CardFace = "question" | "answer";

/**
 * Question Screen
 * Displays the current question/answer with swipe interactions
 * - Front: Shows event text only
 * - Back: Shows full date (e.g., "17 juni 2025") with category color
 * 
 * After completing a card, ALWAYS returns to /game (Slumpa kategori screen)
 */
export default function QuestionScreen() {
  const router = useRouter();
  const {
    currentQuestion,
    currentCategory,
    completeCurrentQuestion,
    getDiscardCount,
    endGame,
  } = useGame();

  // Get discard count value
  const discardCount = getDiscardCount;

  const [cardFace, setCardFace] = useState<CardFace>("question");
  const [menuVisible, setMenuVisible] = useState(false);

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
   * ALWAYS navigates to /game (Slumpa kategori), NOT to choose-category
   */
  const handleComplete = useCallback(() => {
    completeCurrentQuestion();
    // Use replace to go back to the main game screen
    // This prevents the loop back to choose-category
    router.replace("/game");
  }, [completeCurrentQuestion, router]);

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
      // Complete card and go back to main game screen
      completeCurrentQuestion();
      router.replace("/game");
    }
  }, [cardFace, completeCurrentQuestion, router, translateX, opacity]);

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

  // If no current question, show error or go back
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

        {/* Swipe hint */}
        <Text style={styles.swipeHint}>
          {cardFace === "question"
            ? "Svep höger för att visa svaret →"
            : "Svep höger för nästa kort →"}
        </Text>
      </View>

      {/* Menu Modal - NO gameplay buttons */}
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
  swipeHint: {
    marginTop: 24,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
});
