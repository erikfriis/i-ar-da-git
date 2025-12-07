import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { getCategoryById } from "@/constants/categories";
import { useGame } from "@/context/GameContext";
import { getFullAnswerDate, Question } from "@/hooks/useGameEngine";

/**
 * Disable iOS back-swipe gesture to prevent gesture conflicts with FlatList
 */
export const unstable_settings = {
  gestureEnabled: false,
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 300);
const CARD_HEIGHT = CARD_WIDTH * 1.45;

// Mini card dimensions for slider - styled as small cards
const MINI_CARD_WIDTH = 52;
const MINI_CARD_HEIGHT = 70;
const MINI_CARD_GAP = 10;

/**
 * Format date to compact format (e.g. "27/7" from "27 juli")
 */
const formatCompactDate = (dateStr: string): string => {
  const months: Record<string, string> = {
    januari: "1",
    februari: "2",
    mars: "3",
    april: "4",
    maj: "5",
    juni: "6",
    juli: "7",
    augusti: "8",
    september: "9",
    oktober: "10",
    november: "11",
    december: "12",
  };

  const parts = dateStr.toLowerCase().split(" ");
  if (parts.length >= 2) {
    const day = parts[0];
    const monthName = parts[1];
    const monthNum = months[monthName] || "?";
    return `${day}/${monthNum}`;
  }
  return dateStr;
};

/**
 * Mini Card Component for the bottom slider
 * Styled as small card tiles with category color
 */
interface MiniCardProps {
  question: Question;
  isActive: boolean;
  onPress: () => void;
}

const MiniCard: React.FC<MiniCardProps> = ({ question, isActive, onPress }) => {
  const category = getCategoryById(question.category);
  const categoryColor = category?.color || "#7AD17A";
  const compactDate = formatCompactDate(question.date);

  if (isActive) {
    // Active card shows as empty outlined card
    return (
      <Pressable
        style={styles.miniCardWrapper}
        onPress={onPress}
        android_disableSound
        android_ripple={null}
      >
        <View style={styles.miniCardOutline}>{/* Empty - no content */}</View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={styles.miniCardWrapper}
      onPress={onPress}
      android_disableSound
      android_ripple={null}
    >
      <View style={[styles.miniCard, { backgroundColor: categoryColor }]}>
        <Text style={styles.miniCardDate}>{compactDate}</Text>
      </View>
    </Pressable>
  );
};

/**
 * Discard Pile Screen
 * Shows completed cards with floating arrow navigation and mini card slider
 *
 * SLIDER ORDER: Newest → Oldest (left → right)
 * - Leftmost mini card = most recently discarded
 * - Rightmost mini card = earliest discarded
 */
export default function DiscardPileScreen() {
  const router = useRouter();
  const { discardPile, getDiscardCard, endGame } = useGame();
  const flatListRef = useRef<FlatList>(null);

  const [menuVisible, setMenuVisible] = useState(false);

  // activeIndex: 0 = oldest, length-1 = newest (data index)
  // Start at the LAST index (most recent card)
  const [activeIndex, setActiveIndex] = useState(
    discardPile.length > 0 ? discardPile.length - 1 : 0
  );
  const [currentCard, setCurrentCard] = useState<Question | null>(null);

  // Animation for card transitions
  const cardOpacity = useSharedValue(1);

  // Build array of all discarded questions for the slider
  // ORDER: NEWEST FIRST (index 0 = newest, index length-1 = oldest)
  // getDiscardCard(0) = newest, getDiscardCard(length-1) = oldest
  const discardedQuestions: Question[] = discardPile
    .map((_, idx) => getDiscardCard(idx))
    .filter((q): q is Question => q !== null);

  /**
   * Convert activeIndex (data) to visual index (slider position)
   * activeIndex = length-1 (newest) → visualIndex = 0 (leftmost)
   * activeIndex = 0 (oldest) → visualIndex = length-1 (rightmost)
   */
  const toVisualIndex = (dataIndex: number): number => {
    return discardPile.length - 1 - dataIndex;
  };

  /**
   * Convert visual index (slider position) to activeIndex (data)
   */
  const toDataIndex = (visualIndex: number): number => {
    return discardPile.length - 1 - visualIndex;
  };

  // Get the current card based on active index
  useEffect(() => {
    if (
      discardPile.length > 0 &&
      activeIndex >= 0 &&
      activeIndex < discardPile.length
    ) {
      const card = getDiscardCard(discardPile.length - 1 - activeIndex);
      setCurrentCard(card);
    } else {
      setCurrentCard(null);
    }
  }, [activeIndex, discardPile, getDiscardCard]);

  // Initialize to latest card when screen opens
  useEffect(() => {
    if (discardPile.length > 0) {
      const latestIndex = discardPile.length - 1;
      setActiveIndex(latestIndex);
    }
  }, [discardPile.length]);

  // Scroll to active card's visual position when it changes
  useEffect(() => {
    if (flatListRef.current && discardedQuestions.length > 0) {
      const visualIndex = toVisualIndex(activeIndex);
      flatListRef.current.scrollToIndex({
        index: visualIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [activeIndex, discardedQuestions.length]);

  /**
   * Navigate to older card (left button)
   */
  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, { duration: 200 });
      setActiveIndex(activeIndex - 1);
    }
  }, [activeIndex, cardOpacity]);

  /**
   * Navigate to newer card (right button)
   */
  const handleNext = useCallback(() => {
    if (activeIndex < discardPile.length - 1) {
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, { duration: 200 });
      setActiveIndex(activeIndex + 1);
    }
  }, [activeIndex, discardPile.length, cardOpacity]);

  /**
   * Handle mini card tap in slider
   * Converts visual index to data index
   */
  const handleMiniCardPress = useCallback(
    (visualIndex: number) => {
      const dataIndex = toDataIndex(visualIndex);
      if (dataIndex !== activeIndex) {
        cardOpacity.value = 0;
        cardOpacity.value = withTiming(1, { duration: 200 });
        setActiveIndex(dataIndex);
      }
    },
    [activeIndex, cardOpacity, discardPile.length]
  );

  // Animated styles for the main card
  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
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
  if (discardPile.length === 0) {
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

  const category = currentCard ? getCategoryById(currentCard.category) : null;
  const categoryColor = category?.color || "#7AD17A";
  const fullAnswerDate = currentCard ? getFullAnswerDate(currentCard) : "";

  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < discardPile.length - 1;

  // Current visual index for isActive check
  const currentVisualIndex = toVisualIndex(activeIndex);

  return (
    <View style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        showDiscard={false}
        showClose={true}
        onClosePress={handleClose}
      />

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Card Container with floating arrows */}
        <View style={styles.cardArea}>
          {/* Main Card with dark background */}
          <Animated.View style={[styles.cardOuterContainer, animatedCardStyle]}>
            <View style={styles.cardDarkWrapper}>
              {currentCard && (
                <>
                  {/* Category header */}
                  <View
                    style={[
                      styles.categoryHeader,
                      { backgroundColor: categoryColor },
                    ]}
                  >
                    <Text style={styles.categoryLabel}>{category?.label}</Text>
                  </View>

                  {/* White card content */}
                  <View style={styles.cardInner}>
                    {/* Event content */}
                    <View style={styles.eventContent}>
                      <Text style={styles.eventText}>{currentCard.event}</Text>
                    </View>
                  </View>

                  {/* Footer section */}
                  <View style={styles.footerSection}>
                    <Text style={styles.footerTitle}>i år då?</Text>
                    <Text style={styles.positionIndicator}>
                      {discardPile.length - activeIndex}
                    </Text>
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
                </>
              )}
            </View>
          </Animated.View>

          {/* Floating Left Arrow - goes to OLDER cards (right in slider) */}
          <Pressable
            style={[
              styles.floatingArrow,
              styles.floatingArrowLeft,
              !canGoNext && styles.floatingArrowDisabled,
            ]}
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Text
              style={[styles.arrowText, !canGoNext && styles.arrowTextDisabled]}
            >
              ‹
            </Text>
          </Pressable>

          {/* Floating Right Arrow - goes to NEWER cards (left in slider) */}
          <Pressable
            style={[
              styles.floatingArrow,
              styles.floatingArrowRight,
              !canGoPrevious && styles.floatingArrowDisabled,
            ]}
            onPress={handlePrevious}
            disabled={!canGoPrevious}
          >
            <Text
              style={[
                styles.arrowText,
                !canGoPrevious && styles.arrowTextDisabled,
              ]}
            >
              ›
            </Text>
          </Pressable>
        </View>

        {/* Bottom Slider - Mini Cards (NEWEST on LEFT, OLDEST on RIGHT) */}
        <View style={styles.sliderContainer} pointerEvents="box-none">
          <FlatList
            ref={flatListRef}
            data={discardedQuestions}
            horizontal={true}
            scrollEnabled={true}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sliderContent}
            keyExtractor={(item, index) => `discard-${item.id}-${index}`}
            onScrollToIndexFailed={(info) => {
              // Handle scroll failure gracefully
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              }, 100);
            }}
            renderItem={({ item, index }) => (
              <MiniCard
                question={item}
                isActive={index === currentVisualIndex}
                onPress={() => handleMiniCardPress(index)}
              />
            )}
          />
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
    overflow: "hidden", // Prevents side-scroll bleed
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 16,
    overflow: "hidden", // Lock horizontal overflow
  },
  cardArea: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cardOuterContainer: {
    alignItems: "center",
  },
  cardDarkWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
  },
  categoryHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  cardInner: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  eventContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  eventText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 22,
  },
  footerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  positionIndicator: {
    position: "absolute",
    right: 16,
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.5)",
  },
  answerSection: {
    paddingVertical: 14,
    alignItems: "center",
  },
  answerText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1F2937",
  },
  // Floating arrow buttons
  floatingArrow: {
    position: "absolute",
    top: "50%",
    width: 44,
    height: 44,
    marginTop: -22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  floatingArrowLeft: {
    left: -16,
  },
  floatingArrowRight: {
    right: -16,
  },
  floatingArrowDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  arrowText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#FFFFFF",
    marginTop: -2,
  },
  arrowTextDisabled: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  // Empty state
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
  // Slider styles - mini card tiles
  sliderContainer: {
    marginTop: 20,
    paddingVertical: 8,
    width: "100%",
  },
  sliderContent: {
    paddingHorizontal: 20,
  },
  miniCardWrapper: {
    marginHorizontal: MINI_CARD_GAP / 2,
  },
  miniCard: {
    width: MINI_CARD_WIDTH,
    height: MINI_CARD_HEIGHT,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  miniCardOutline: {
    width: MINI_CARD_WIDTH,
    height: MINI_CARD_HEIGHT,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "transparent",
  },
  miniCardDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
});
