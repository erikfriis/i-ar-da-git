import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
 * INDEX CONVENTION (SIMPLE):
 * - visualIndex: 0 = newest (leftmost in slider), length-1 = oldest (rightmost)
 * - newestFirst[visualIndex] = current card
 * - Left arrow = older = visualIndex + 1
 * - Right arrow = newer = visualIndex - 1
 *
 * SLIDER ORDER: Newest → Oldest (left → right)
 * - Leftmost mini card = most recently discarded (visualIndex 0)
 * - Rightmost mini card = earliest discarded (visualIndex length-1)
 */
export default function DiscardPileScreen() {
  const router = useRouter();
  const {
    isHydrated,
    discardPile,
    getDiscardCard,
    endGame,
    menuVisible,
    setMenuVisible,
    setFlowStep,
    previousFlowStep,
    chooseCategoryMode,
    categoryResultId,
  } = useGame();

  const flatListRef = useRef<FlatList>(null);

  // Visual index: 0 = newest (leftmost), length-1 = oldest (rightmost)
  // Always start at 0 (newest) when screen opens
  const [visualIndex, setVisualIndex] = useState(0);

  // Track last scrolled index to prevent unnecessary scroll calls
  const lastScrolledIndexRef = useRef<number | null>(null);
  // Track if initial scroll has happened
  const hasScrolledInitialRef = useRef(false);

  // Animation for card transitions
  const cardOpacity = useSharedValue(1);

  const pileLength = discardPile.length;

  /**
   * Build the canonical array: NEWEST FIRST
   * - newestFirst[0] = newest card
   * - newestFirst[length-1] = oldest card
   *
   * getDiscardCard(0) returns newest (it reverses internally),
   * so we just map over indices 0..length-1
   */
  const newestFirst = useMemo<Question[]>(() => {
    const questions: Question[] = [];
    for (let i = 0; i < pileLength; i++) {
      const q = getDiscardCard(i);
      if (q) questions.push(q);
    }
    return questions;
  }, [pileLength, getDiscardCard]);

  // Clamp visualIndex to valid range
  const clampedVisualIndex =
    newestFirst.length > 0
      ? Math.min(Math.max(0, visualIndex), newestFirst.length - 1)
      : 0;

  // Current card is simply newestFirst[clampedVisualIndex]
  const currentCard =
    newestFirst.length > 0 ? newestFirst[clampedVisualIndex] : null;

  // Update flow step when screen mounts
  useEffect(() => {
    if (isHydrated) {
      setFlowStep("discard-pile");
    }
  }, [isHydrated, setFlowStep]);

  // Reset to newest (index 0) when pile length changes (e.g., new card added)
  // This ensures we always start at newest
  useEffect(() => {
    if (isHydrated && pileLength > 0) {
      setVisualIndex(0);
      hasScrolledInitialRef.current = false;
      lastScrolledIndexRef.current = null;
    }
  }, [isHydrated, pileLength]);

  // Scroll to the selected index
  useEffect(() => {
    if (!flatListRef.current || newestFirst.length === 0 || !isHydrated) {
      return;
    }

    // Don't scroll if we already scrolled to this index
    if (lastScrolledIndexRef.current === clampedVisualIndex) {
      return;
    }

    // Validate index
    if (clampedVisualIndex < 0 || clampedVisualIndex >= newestFirst.length) {
      return;
    }

    lastScrolledIndexRef.current = clampedVisualIndex;

    // Use requestAnimationFrame to ensure FlatList is ready
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({
        index: clampedVisualIndex,
        animated: hasScrolledInitialRef.current,
        viewPosition: 0.5,
      });
      hasScrolledInitialRef.current = true;
    });
  }, [clampedVisualIndex, newestFirst.length, isHydrated]);

  /**
   * Navigate to OLDER card (right in slider = higher index)
   * Left arrow goes to older
   */
  const handleGoOlder = useCallback(() => {
    if (clampedVisualIndex < newestFirst.length - 1) {
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, { duration: 200 });
      setVisualIndex(clampedVisualIndex + 1);
    }
  }, [clampedVisualIndex, newestFirst.length, cardOpacity]);

  /**
   * Navigate to NEWER card (left in slider = lower index)
   * Right arrow goes to newer
   */
  const handleGoNewer = useCallback(() => {
    if (clampedVisualIndex > 0) {
      cardOpacity.value = 0;
      cardOpacity.value = withTiming(1, { duration: 200 });
      setVisualIndex(clampedVisualIndex - 1);
    }
  }, [clampedVisualIndex, cardOpacity]);

  /**
   * Handle mini card tap - directly set visual index
   */
  const handleMiniCardPress = useCallback(
    (index: number) => {
      if (
        index !== clampedVisualIndex &&
        index >= 0 &&
        index < newestFirst.length
      ) {
        cardOpacity.value = 0;
        cardOpacity.value = withTiming(1, { duration: 200 });
        setVisualIndex(index);
      }
    },
    [clampedVisualIndex, newestFirst.length, cardOpacity]
  );

  /**
   * Handle scroll to index failure gracefully
   */
  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      const retryIndex = info.index;
      setTimeout(() => {
        if (flatListRef.current && retryIndex === clampedVisualIndex) {
          flatListRef.current.scrollToIndex({
            index: retryIndex,
            animated: false,
            viewPosition: 0.5,
          });
        }
      }, 100);
    },
    [clampedVisualIndex]
  );

  // Animated styles for the main card
  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  /**
   * Close and navigate back to the previous game flow screen
   * Uses previousFlowStep to determine the correct destination
   */
  const handleClose = useCallback(() => {
    // Navigate based on the previous flow step
    switch (previousFlowStep) {
      case "question":
        router.replace("/game/question");
        break;
      case "choose-category":
        router.replace({
          pathname: "/game/choose-category",
          params: chooseCategoryMode ? { mode: chooseCategoryMode } : undefined,
        });
        break;
      case "category-result":
        if (categoryResultId) {
          router.replace({
            pathname: "/game/category-result",
            params: { categoryId: categoryResultId },
          });
        } else {
          router.replace("/game");
        }
        break;
      case "dice":
        router.replace("/game");
        break;
      case "home":
        router.replace("/");
        break;
      default:
        // Fallback to dice screen
        router.replace("/game");
        break;
    }
  }, [previousFlowStep, chooseCategoryMode, categoryResultId, router]);

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

  // Arrow navigation:
  // - Left arrow = go to OLDER card = visualIndex + 1
  // - Right arrow = go to NEWER card = visualIndex - 1
  const canGoOlder = clampedVisualIndex < newestFirst.length - 1;
  const canGoNewer = clampedVisualIndex > 0;

  // Position indicator: 1 = newest, length = oldest
  const positionNumber = clampedVisualIndex + 1;

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
                      {positionNumber}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Bottom Slider - Mini Cards (NEWEST on LEFT, OLDEST on RIGHT) */}
        <View style={styles.sliderContainer} pointerEvents="box-none">
          <FlatList
            ref={flatListRef}
            data={newestFirst}
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
                isActive={index === clampedVisualIndex}
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
