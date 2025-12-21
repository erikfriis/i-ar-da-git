import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { GamePopup } from "@/components/game/GamePopup";
import { categories } from "@/constants/categories";
import { useGame } from "@/context/GameContext";

const GRID_PADDING = 24;
const GRID_GAP = 16;
const GRID_MAX_WIDTH = 480;

/**
 * Choose Category Screen
 * Shown when outcome is "vit" (user chooses) or "svart" (opponent chooses)
 * User manually picks a category from a 2x2 grid
 *
 * If user taps an empty category, shows a popup explaining
 * the category is out of cards.
 */
export default function ChooseCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = (params.mode as "user" | "opponent") || "user";

  // Track measured grid container width for responsive sizing
  const [gridWidth, setGridWidth] = useState<number>(0);

  // Compute square size based on measured container width
  const computedSize =
    gridWidth > 0 ? (gridWidth - GRID_PADDING * 2 - GRID_GAP) / 2 : 150; // Default fallback before measurement
  const squareSize = Math.max(120, Math.min(220, computedSize));

  const {
    isHydrated,
    selectCategoryById,
    drawRandomQuestion,
    isCategoryEmpty,
    getDiscardCount,
    endGame,
    menuVisible,
    setMenuVisible,
    setFlowStep,
    setChooseCategoryMode,
  } = useGame();

  const [showEmptyCategoryPopup, setShowEmptyCategoryPopup] = useState(false);

  const discardCount = getDiscardCount;

  // Title based on mode
  const title = mode === "opponent" ? "Motståndaren väljer" : "Du väljer";
  const subtitle = "kategori!";

  // Update flow step and store mode when screen mounts
  useEffect(() => {
    if (isHydrated) {
      setFlowStep("choose-category");
      setChooseCategoryMode(mode);
    }
  }, [isHydrated, mode, setFlowStep, setChooseCategoryMode]);

  /**
   * Handle layout measurement for responsive grid sizing
   */
  const handleGridLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setGridWidth(width);
  };

  /**
   * Handle category selection
   * Shows popup if category is empty, otherwise proceeds to question
   */
  const handleSelectCategory = (categoryId: string) => {
    // Check if category is empty
    if (isCategoryEmpty(categoryId)) {
      setShowEmptyCategoryPopup(true);
      return;
    }

    // Category has cards - proceed
    selectCategoryById(categoryId);
    const question = drawRandomQuestion(categoryId);

    if (question) {
      router.push("/game/question");
    } else {
      // This shouldn't happen if isCategoryEmpty works correctly
      setShowEmptyCategoryPopup(true);
    }
  };

  /**
   * Close the empty category popup
   * User stays on choose-category screen
   */
  const handleCloseEmptyPopup = () => {
    setShowEmptyCategoryPopup(false);
  };

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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        onDiscardPress={handleDiscardPress}
        discardCount={discardCount}
      />

      {/* Title */}
      <View style={styles.titleContainer}>
        <View style={styles.titleCard}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </View>

      {/* Grid Outer - constrains width on large screens */}
      <View style={styles.gridOuter}>
        {/* Category Grid - 2x2 */}
        <View style={styles.gridContainer} onLayout={handleGridLayout}>
          <View style={styles.gridRow}>
            {/* Yellow - Prylar */}
            <Pressable
              style={[
                styles.categorySquare,
                {
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: categories[0].color,
                },
                isCategoryEmpty(categories[0].id) && styles.categorySquareEmpty,
              ]}
              onPress={() => handleSelectCategory(categories[0].id)}
            >
              <Text style={styles.categoryLabel}>{categories[0].label}</Text>
              {isCategoryEmpty(categories[0].id) && (
                <Text style={styles.emptyBadge}>Slut</Text>
              )}
            </Pressable>

            {/* Blue - Personer */}
            <Pressable
              style={[
                styles.categorySquare,
                {
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: categories[1].color,
                },
                isCategoryEmpty(categories[1].id) && styles.categorySquareEmpty,
              ]}
              onPress={() => handleSelectCategory(categories[1].id)}
            >
              <Text style={styles.categoryLabel}>{categories[1].label}</Text>
              {isCategoryEmpty(categories[1].id) && (
                <Text style={styles.emptyBadge}>Slut</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.gridRow}>
            {/* Purple - Underhållning */}
            <Pressable
              style={[
                styles.categorySquare,
                {
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: categories[2].color,
                },
                isCategoryEmpty(categories[2].id) && styles.categorySquareEmpty,
              ]}
              onPress={() => handleSelectCategory(categories[2].id)}
            >
              <Text style={styles.categoryLabel}>{categories[2].label}</Text>
              {isCategoryEmpty(categories[2].id) && (
                <Text style={styles.emptyBadge}>Slut</Text>
              )}
            </Pressable>

            {/* Green - Blandat */}
            <Pressable
              style={[
                styles.categorySquare,
                {
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: categories[3].color,
                },
                isCategoryEmpty(categories[3].id) && styles.categorySquareEmpty,
              ]}
              onPress={() => handleSelectCategory(categories[3].id)}
            >
              <Text style={styles.categoryLabel}>{categories[3].label}</Text>
              {isCategoryEmpty(categories[3].id) && (
                <Text style={styles.emptyBadge}>Slut</Text>
              )}
            </Pressable>
          </View>
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

      {/* Empty Category Popup */}
      <GamePopup
        visible={showEmptyCategoryPopup}
        icon="🃏"
        title="Kategorin är slut"
        message="Denna kategori är slut. Avsluta och starta ett nytt spel för att blanda om högen."
        buttons={[
          {
            label: "Okej",
            onPress: handleCloseEmptyPopup,
            variant: "primary",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D24662",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#D24662",
  },
  titleCard: {
    backgroundColor: "#D24662",
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitleText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  gridOuter: {
    flex: 1,
    width: "100%",
    maxWidth: GRID_MAX_WIDTH,
    alignSelf: "center",
    justifyContent: "center",
  },
  gridContainer: {
    justifyContent: "center",
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: GRID_GAP,
  },
  categorySquare: {
    // width and height are set dynamically via inline style
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  categorySquareEmpty: {
    opacity: 0.5,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBadge: {
    position: "absolute",
    bottom: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
});
