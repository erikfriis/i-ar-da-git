import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { LowCardsPopup } from "@/components/game/LowCardsPopup";
import { getCategoryById } from "@/constants/categories";
import { useGame } from "@/context/GameContext";

/**
 * Category Result Screen - "Du fick kategorin"
 * Shown when a colored category is randomly selected
 * Full screen with category color background
 */
export default function CategoryResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = params.categoryId;

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

  const category = categoryId ? getCategoryById(categoryId) : null;
  const discardCount = getDiscardCount;

  // Determine text color based on background
  const isLightBackground =
    category?.color === "#F7D358" || category?.color === "#7AD17A";
  const textColor = isLightBackground ? "#1F2937" : "#FFFFFF";
  const buttonBgColor = isLightBackground ? "#1F2937" : "#FFFFFF";
  const buttonTextColor = isLightBackground ? "#FFFFFF" : "#1F2937";

  /**
   * Handle "Visa frågekort" button press
   * Checks for low cards first, then navigates to question
   */
  const handleShowQuestion = () => {
    if (!categoryId) return;

    // Check if category needs reshuffling
    if (needsReshuffle(categoryId)) {
      setShowLowCardsPopup(true);
      return;
    }

    proceedToQuestion();
  };

  /**
   * Proceed to question after any reshuffling
   */
  const proceedToQuestion = () => {
    if (!categoryId) return;

    selectCategoryById(categoryId);
    const question = drawRandomQuestion(categoryId);

    if (question) {
      router.push("/game/question");
    } else {
      // This shouldn't happen after reshuffle, but handle it
      alert("Inga frågor tillgängliga!");
      router.replace("/game");
    }
  };

  /**
   * Handle low cards popup confirmation
   * Reset the category and proceed
   */
  const handleLowCardsConfirm = () => {
    if (!categoryId) return;

    setShowLowCardsPopup(false);
    resetUsedQuestionsForCategory(categoryId);
    proceedToQuestion();
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

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Kategori hittades inte</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: category.color, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        onDiscardPress={handleDiscardPress}
        discardCount={discardCount}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: textColor, opacity: 0.8 }]}>
          Du fick kategorin
        </Text>

        <View style={styles.categoryCard}>
          <Text style={[styles.categoryLabel, { color: textColor }]}>
            {category.label}
          </Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: buttonBgColor }]}
          onPress={handleShowQuestion}
        >
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>
            Visa frågekort
          </Text>
        </Pressable>
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
        categoryName={category.label}
        onConfirm={handleLowCardsConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  categoryCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 48,
  },
  categoryLabel: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },
});

