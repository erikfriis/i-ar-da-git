import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { categories } from "@/constants/categories";
import { useGame } from "@/context/GameContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 24;
const GRID_GAP = 16;
const SQUARE_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

/**
 * Choose Category Screen - "Svart eller Vitt"
 * Shown when the random outcome is "svart" or "vit"
 * User manually picks a category from a 2x2 grid
 * 
 * After selecting, navigates to /game/question
 * No state persists - next card will go through "Slumpa kategori" again
 */
export default function ChooseCategoryScreen() {
  const router = useRouter();
  const {
    selectCategoryById,
    drawRandomQuestion,
    getDiscardCount,
    endGame,
  } = useGame();

  const [menuVisible, setMenuVisible] = useState(false);
  const discardCount = getDiscardCount;

  /**
   * Handle category selection
   * Sets category, draws question, navigates to question screen
   */
  const handleSelectCategory = (categoryId: string) => {
    // Set the selected category
    selectCategoryById(categoryId);

    // Draw a random question from this category
    const question = drawRandomQuestion(categoryId);

    if (question) {
      // Navigate to question screen
      router.push("/game/question");
    } else {
      // No questions available in this category
      alert("Inga fler frågor i denna kategori!");
    }
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
          <Text style={styles.titleText}>Svart eller vitt!</Text>
        </View>
        <Text style={styles.subtitle}>Välj kategori</Text>
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
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
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
    // Shadow
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
