import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { getCategoryById } from "@/constants/categories";
import { useGame } from "@/context/GameContext";

/**
 * Category Result Screen - "Du fick kategorin"
 * Shown when a colored category is randomly selected by the dice.
 *
 * Note: The dice only lands on categories with remaining cards,
 * so we don't need to check for empty categories here.
 */
export default function CategoryResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = params.categoryId;

  const {
    isHydrated,
    selectCategoryById,
    drawRandomQuestion,
    getDiscardCount,
    endGame,
    menuVisible,
    setMenuVisible,
    setFlowStep,
    setCategoryResultId,
  } = useGame();

  const category = categoryId ? getCategoryById(categoryId) : null;
  const discardCount = getDiscardCount;

  const textColor = "#FFFFFF";
  const buttonBgColor = "#000000";
  const buttonTextColor = "#FFFFFF";

  // Update flow step and store categoryId when screen mounts
  useEffect(() => {
    if (isHydrated && categoryId) {
      setFlowStep("category-result");
      setCategoryResultId(categoryId);
    }
  }, [isHydrated, categoryId, setFlowStep, setCategoryResultId]);

  /**
   * Handle "Visa frågekort" button press
   * Proceeds directly to question (no reshuffle checks needed)
   */
  const handleShowQuestion = () => {
    if (!categoryId) return;

    selectCategoryById(categoryId);
    const question = drawRandomQuestion(categoryId);

    if (question) {
      router.push("/game/question");
    } else {
      // This shouldn't happen since dice only lands on non-empty categories
      alert("Inga frågor tillgängliga!");
      router.replace("/game");
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
        { backgroundColor: "#D24662", paddingTop: insets.top },
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
        <Text style={[styles.subtitle, { color: textColor }]}>
          Du fick kategorin
        </Text>

        <View style={styles.categoryCard}>
          <Text style={[styles.categoryLabel, { color: textColor }]}>
            {category.label}
          </Text>
        </View>

        <Pressable
          style={[
            styles.button,
            { backgroundColor: buttonBgColor, borderColor: category.color },
          ]}
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
  },
  categoryCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
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
    borderWidth: 10,
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
