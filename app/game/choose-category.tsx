import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { LowCardsPopup } from "@/components/game/LowCardsPopup";
import { categories, getCategoryById } from "@/constants/categories";
import { useGame } from "@/context/GameContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 24;
const GRID_GAP = 16;
const SQUARE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

/**
 * Choose Category Screen
 * Shown when outcome is "vit" (user chooses) or "svart" (opponent chooses)
 * User manually picks a category from a 2x2 grid
 */
export default function ChooseCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = (params.mode as "user" | "opponent") || "user";

  const {
    selectCategoryById,
    drawRandomQuestion,
    getRemainingCards,
    needsReshuffle,
    resetUsedQuestionsForCategory,
    getDiscardCount,
    endGame,
  } = useGame();

  const [menuVisible, setMenuVisible] = useState(false);
  const [showLowCardsPopup, setShowLowCardsPopup] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null
  );

  const discardCount = getDiscardCount;

  // Title based on mode
  const title = mode === "opponent" ? "Motståndaren väljer" : "Du väljer";
  const subtitle = "kategori";

  /**
   * Handle category selection
   */
  const handleSelectCategory = (categoryId: string) => {
    // Check if category needs reshuffling
    if (needsReshuffle(categoryId)) {
      setPendingCategoryId(categoryId);
      setShowLowCardsPopup(true);
      return;
    }

    proceedWithCategory(categoryId);
  };

  /**
   * Proceed with category selection
   */
  const proceedWithCategory = (categoryId: string) => {
    selectCategoryById(categoryId);
    const question = drawRandomQuestion(categoryId);

    if (question) {
      router.push("/game/question");
    } else {
      alert("Inga fler frågor i denna kategori!");
    }
  };

  /**
   * Handle low cards popup confirmation
   */
  const handleLowCardsConfirm = () => {
    if (!pendingCategoryId) return;

    setShowLowCardsPopup(false);
    resetUsedQuestionsForCategory(pendingCategoryId);
    proceedWithCategory(pendingCategoryId);
    setPendingCategoryId(null);
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

  // Get category name for popup
  const pendingCategory = pendingCategoryId
    ? getCategoryById(pendingCategoryId)
    : null;

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

      {/* Category Grid - 2x2 */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {/* Yellow - Prylar */}
          <Pressable
            style={[
              styles.categorySquare,
              { backgroundColor: categories[0].color },
            ]}
            onPress={() => handleSelectCategory(categories[0].id)}
          >
            <Text style={styles.categoryLabel}>{categories[0].label}</Text>
          </Pressable>

          {/* Blue - Personer */}
          <Pressable
            style={[
              styles.categorySquare,
              { backgroundColor: categories[1].color },
            ]}
            onPress={() => handleSelectCategory(categories[1].id)}
          >
            <Text style={styles.categoryLabel}>{categories[1].label}</Text>
          </Pressable>
        </View>

        <View style={styles.gridRow}>
          {/* Purple - Underhållning */}
          <Pressable
            style={[
              styles.categorySquare,
              { backgroundColor: categories[2].color },
            ]}
            onPress={() => handleSelectCategory(categories[2].id)}
          >
            <Text style={styles.categoryLabel}>{categories[2].label}</Text>
          </Pressable>

          {/* Green - Blandat */}
          <Pressable
            style={[
              styles.categorySquare,
              { backgroundColor: categories[3].color },
            ]}
            onPress={() => handleSelectCategory(categories[3].id)}
          >
            <Text style={styles.categoryLabel}>{categories[3].label}</Text>
          </Pressable>
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

      {/* Low Cards Popup */}
      <LowCardsPopup
        visible={showLowCardsPopup}
        categoryName={pendingCategory?.label || ""}
        onConfirm={handleLowCardsConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D24662",
  },
  titleContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  titleCard: {
    backgroundColor: "#1E1E1E",
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
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  gridContainer: {
    flex: 1,
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
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
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
  categoryLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 22,
  },
});
