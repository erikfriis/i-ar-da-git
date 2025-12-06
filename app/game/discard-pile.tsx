import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { getCategoryById } from "@/constants/categories";
import { useGame } from "@/context/GameContext";
import { getFullAnswerDate, Question } from "@/hooks/useGameEngine";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

/**
 * Discard Pile Screen - "Slänghögen"
 * Shows completed cards with same styling as question cards
 * Swipe LEFT for older, RIGHT for newer
 */
export default function DiscardPileScreen() {
  const router = useRouter();
  const {
    discardPile,
    discardIndex,
    getCurrentDiscardCard,
    navigateDiscardPile,
    getDiscardCount,
    endGame,
  } = useGame();

  const [currentCard, setCurrentCard] = useState<Question | null>(
    getCurrentDiscardCard()
  );
  const [menuVisible, setMenuVisible] = useState(false);

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Update current card when discard index changes
  useEffect(() => {
    setCurrentCard(getCurrentDiscardCard());
  }, [discardIndex, getCurrentDiscardCard]);

  /**
   * Handle navigation through discard pile
   * direction: 1 for older (swipe left), -1 for newer (swipe right)
   */
  const handleNavigate = (direction: -1 | 1) => {
    const newCard = navigateDiscardPile(direction);
    if (newCard) {
      opacity.value = 0;
      setCurrentCard(newCard);
      opacity.value = withTiming(1, { duration: 200 });
    }
    translateX.value = withSpring(0);
  };

  // Swipe gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const swipedLeft = event.translationX < -SWIPE_THRESHOLD;
      const swipedRight = event.translationX > SWIPE_THRESHOLD;

      if (swipedLeft) {
        // Navigate to older cards (higher index)
        runOnJS(handleNavigate)(1);
      } else if (swipedRight) {
        // Navigate to newer cards (lower index)
        runOnJS(handleNavigate)(-1);
      } else {
        // Snap back
        translateX.value = withSpring(0);
      }
    });

  // Animated styles for the card
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  /**
   * Close and go back
   */
  const handleClose = () => {
    router.back();
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

  // If no cards in discard pile
  if (discardPile.length === 0 || !currentCard) {
    return (
      <View style={styles.container}>
        <GameHeader
          onMenuPress={() => setMenuVisible(true)}
          showDiscard={false}
          showClose={true}
          onClosePress={handleClose}
        />

        <View style={styles.content}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Slänghögen är tom</Text>
            <Text style={styles.emptySubtext}>Inga kort har spelats ännu</Text>
          </View>
        </View>

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

  const category = getCategoryById(currentCard.category);
  const categoryColor = category?.color || "#7AD17A";
  const fullAnswerDate = getFullAnswerDate(currentCard);
  const discardCount = getDiscardCount;

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        showDiscard={false}
        showClose={true}
        onClosePress={handleClose}
      />

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Slänghögen</Text>
        <Text style={styles.subtitle}>
          {discardIndex + 1} av {discardCount}
        </Text>
      </View>

      {/* Card */}
      <View style={styles.content}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
            {/* Discard card - same styling as question card */}
            <View style={styles.card}>
              {/* Category header */}
              <View
                style={[
                  styles.categoryHeader,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.categoryLabel}>{category?.label}</Text>
              </View>

              {/* Event content */}
              <View style={styles.eventContent}>
                <Text style={styles.eventText}>{currentCard.event}</Text>
              </View>

              {/* Footer with title */}
              <View style={styles.footer}>
                <Text style={styles.footerTitle}>i år då?</Text>
              </View>

              {/* Answer section with category color */}
              <View
                style={[
                  styles.answerSection,
                  { backgroundColor: categoryColor },
                ]}
              >
                <Text style={styles.answerText}>{fullAnswerDate}</Text>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Navigation hint */}
        <Text style={styles.navigationHint}>← Svep för att bläddra →</Text>
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
  titleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardWrapper: {
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  categoryHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  eventContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  eventText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingVertical: 8,
    alignItems: "center",
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  answerSection: {
    paddingVertical: 16,
    alignItems: "center",
  },
  answerText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  navigationHint: {
    marginTop: 24,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontStyle: "italic",
  },
  emptyCard: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
