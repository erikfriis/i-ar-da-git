import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
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
import { Question, useGame } from "@/context/GameContext";

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
        <View style={styles.miniCardOutline}>
          <Text style={styles.outlineDate}>{compactDate}</Text>
        </View>
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
 * INDEX CONVENTION:
 * - discardIndex (context): 0 = oldest card, length-1 = newest card
 * - visualIndex (slider): 0 = leftmost = newest, length-1 = rightmost = oldest
 * - Conversion: visualIndex = length - 1 - discardIndex
 *
 * SLIDER ORDER: Newest → Oldest (left → right)
 * - Leftmost mini card = most recently discarded
 * - Rightmost mini card = earliest discarded
 */
export default function DiscardPileScreen() {
  const router = useRouter();
  const {
    isHydrated,
    discardPile,
    discardIndex,
    setDiscardIndex,
    getDiscardCard,
    endGame,
    menuVisible,
    setMenuVisible,
    setFlowStep,
  } = useGame();

  const flatListRef = useRef<FlatList>(null);

  // Track if we've done initial scroll to prevent repeated scrolls
  const hasInitializedRef = useRef(false);
  // Track last scrolled visual index to prevent unnecessary scroll calls
  const lastScrolledVisualIndexRef = useRef<number | null>(null);

  // Animation for card transitions
  const cardOpacity = useSharedValue(1);

  // Clamp discardIndex to valid range (derived, not state)
  const pileLength = discardPile.length;
  const clampedIndex =
    pileLength > 0 ? Math.min(Math.max(0, discardIndex), pileLength - 1) : 0;

  // Build array of all discarded questions for the slider using useMemo
  // ORDER: NEWEST FIRST (index 0 = newest, index length-1 = oldest)
  // This matches getDiscardCard(0) = newest
  const discardedQuestions = useMemo<Question[]>(() => {
    return discardPile
      .map((_, idx) => getDiscardCard(idx))
      .filter((q): q is Question => q !== null);
  }, [discardPile, getDiscardCard]);

  // Get current card directly from clamped index
  // getDiscardCard uses reversed pile, so getDiscardCard(0) = newest
  // We need: getDiscardCard(length - 1 - clampedIndex) to match our index convention
  const currentCard = useMemo<Question | null>(() => {
    if (pileLength === 0) return null;
    return getDiscardCard(pileLength - 1 - clampedIndex);
  }, [pileLength, clampedIndex, getDiscardCard]);

  /**
   * Convert discardIndex (data) to visual index (slider position)
   * discardIndex = length-1 (newest) → visualIndex = 0 (leftmost)
   * discardIndex = 0 (oldest) → visualIndex = length-1 (rightmost)
   */
  const toVisualIndex = useCallback(
    (dataIndex: number): number => {
      return pileLength - 1 - dataIndex;
    },
    [pileLength]
  );

  /**
   * Convert visual index (slider position) to discardIndex (data)
   */
  const toDataIndex = useCallback(
    (visualIndex: number): number => {
      return pileLength - 1 - visualIndex;
    },
    [pileLength]
  );

  // Current visual index for slider
  const currentVisualIndex = toVisualIndex(clampedIndex);

  // Update flow step when screen mounts (only once)
  useEffect(() => {
    if (isHydrated) {
      setFlowStep("discard-pile");
    }
  }, [isHydrated, setFlowStep]);

  // One-time initialization: clamp index and set to newest if invalid
  useEffect(() => {
    if (!isHydrated || pileLength === 0 || hasInitializedRef.current) return;

    hasInitializedRef.current = true;

    // If persisted index is out of bounds or 0 (default), show newest card
    if (discardIndex < 0 || discardIndex >= pileLength) {
      setDiscardIndex(pileLength - 1);
    } else if (discardIndex === 0 && pileLength > 1) {
      // If index is 0 but we have multiple cards, assume first visit - show newest
      // Only do this if it looks like a fresh open (index at oldest)
      // Actually, respect the persisted index if it's valid
      // Just ensure it's clamped
    }
  }, [isHydrated, pileLength, discardIndex, setDiscardIndex]);

  // Scroll to correct position when needed
  useEffect(() => {
    if (
      !flatListRef.current ||
      discardedQuestions.length === 0 ||
      !isHydrated
    ) {
      return;
    }

    const targetVisualIndex = currentVisualIndex;

    // Only scroll if the visual index changed
    if (lastScrolledVisualIndexRef.current === targetVisualIndex) {
      return;
    }

    // Guard: ensure valid index
    if (
      targetVisualIndex < 0 ||
      targetVisualIndex >= discardedQuestions.length
    ) {
      return;
    }

    lastScrolledVisualIndexRef.current = targetVisualIndex;

    // Use requestAnimationFrame to ensure FlatList is ready
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({
        index: targetVisualIndex,
        animated: hasInitializedRef.current,
        viewPosition: 0.5,
      });
    });
  }, [currentVisualIndex, discardedQuestions.length, isHydrated]);

  /**
   * Navigate to older card (decrease discardIndex)
   * Left arrow goes to older = lower discardIndex
   */
  const handlePrevious = useCallback(() => {
    if (clampedIndex > 0) {
      const newIndex = clampedIndex - 1;
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, { duration: 200 });
      setDiscardIndex(newIndex);
    }
  }, [clampedIndex, cardOpacity, setDiscardIndex]);

  /**
   * Navigate to newer card (increase discardIndex)
   * Right arrow goes to newer = higher discardIndex
   */
  const handleNext = useCallback(() => {
    if (clampedIndex < pileLength - 1) {
      const newIndex = clampedIndex + 1;
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, { duration: 200 });
      setDiscardIndex(newIndex);
    }
  }, [clampedIndex, pileLength, cardOpacity, setDiscardIndex]);

  /**
   * Handle mini card tap in slider
   * Converts visual index to data index and updates context
   */
  const handleMiniCardPress = useCallback(
    (visualIndex: number) => {
      const dataIndex = toDataIndex(visualIndex);
      if (
        dataIndex !== clampedIndex &&
        dataIndex >= 0 &&
        dataIndex < pileLength
      ) {
        cardOpacity.value = 0;
        cardOpacity.value = withTiming(1, { duration: 200 });
        setDiscardIndex(dataIndex);
      }
    },
    [clampedIndex, pileLength, cardOpacity, setDiscardIndex, toDataIndex]
  );

  /**
   * Handle scroll to index failure gracefully
   * This can happen if FlatList isn't fully laid out yet
   */
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      // Wait a bit and try again, but only once
      const retryIndex = info.index;
      setTimeout(() => {
        if (flatListRef.current && retryIndex === currentVisualIndex) {
          flatListRef.current.scrollToIndex({
            index: retryIndex,
            animated: false,
            viewPosition: 0.5,
          });
        }
      }, 100);
    },
    [currentVisualIndex]
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

  // If no cards in discard pile
  if (pileLength === 0) {
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
            <Text style={styles.emptySubtext}>Inga kort har spelats</Text>
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

  // Arrow navigation: Left = older (lower index), Right = newer (higher index)
  const canGoPrevious = clampedIndex > 0;
  const canGoNext = clampedIndex < pileLength - 1;

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
                  <View style={[styles.categoryHeader]}>
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
                  <View style={styles.footer}>
                    <Text style={styles.footerTitle}>i år då?</Text>
                    <Text style={styles.positionIndicator}>
                      {pileLength - clampedIndex}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* Floating Left Arrow - goes to OLDER cards */}
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

          {/* Floating Right Arrow - goes to NEWER cards */}
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
            keyExtractor={(item) => `discard-${item.id}`}
            onScrollToIndexFailed={handleScrollToIndexFailed}
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
    justifyContent: "center",
    alignItems: "center",
  },

  /**
   * The categortHeader padding makes the header size depend on the lable size.
   */
  categoryHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  categoryLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  cardInner: {
    width: CARD_WIDTH * 0.7, // gör rutan smalare
    height: CARD_HEIGHT * 0.6, // valfritt, för höjd
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  eventContent: {
    flex: 1,
    justifyContent: "flex-start",
    borderRadius: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  eventText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  footerTitle: {
    fontSize: 32,
    fontWeight: "700",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  arrowText: {
    fontSize: 28,
    fontWeight: "300",
    color: "#FFFFFF",
    marginTop: -2,
  },
  arrowTextDisabled: {
    color: "rgba(255, 255, 255,0.1)",
  },
  // Empty state
  emptyCard: {
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontStyle: "italic",
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
  miniCardDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  miniCardOutline: {
    width: MINI_CARD_WIDTH,
    height: MINI_CARD_HEIGHT,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: "#A73349",
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  outlineDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A73349",
    textAlign: "center",
  },
});
