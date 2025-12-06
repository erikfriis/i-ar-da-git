import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { useGame } from "@/context/GameContext";

/**
 * Category Selection Screen - "Slumpa kategori"
 * 
 * 6 possible outcomes (1/6 each):
 * - gul → prylar category
 * - blå → personer category
 * - lila → underhållning category
 * - grön → blandat category
 * - svart → user picks category
 * - vit → user picks category
 */
export default function CategoryScreen() {
  const router = useRouter();
  const {
    drawRandomOutcome,
    selectCategoryById,
    drawRandomQuestion,
    getDiscardCount,
    endGame,
    areAllQuestionsUsed,
  } = useGame();

  // Get discard count value
  const discardCount = getDiscardCount;

  const [menuVisible, setMenuVisible] = useState(false);

  /**
   * Handle "Slumpa kategori" button press
   * Randomly picks one of 6 outcomes
   */
  const handleRandomCategory = () => {
    const result = drawRandomOutcome();

    if (result.type === "choose") {
      // svart or vit outcome → navigate to choose category screen
      router.push("/game/choose-category");
    } else {
      // Direct category outcome → set category and draw question
      selectCategoryById(result.categoryId);
      const question = drawRandomQuestion(result.categoryId);

      if (question) {
        router.push("/game/question");
      } else {
        alert("Inga fler frågor i denna kategori!");
      }
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

  // If all questions are used, show completion message
  if (areAllQuestionsUsed) {
    return (
      <View style={styles.container}>
        <GameHeader
          onMenuPress={() => setMenuVisible(true)}
          showDiscard={false}
        />

        <View style={styles.content}>
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>🎉</Text>
            <Text style={styles.messageText}>Alla kort är slut!</Text>
            <Text style={styles.messageSubtext}>
              Du har gått igenom alla frågor.
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleEndGame}>
            <Text style={styles.buttonText}>Tillbaka till menyn</Text>
          </Pressable>
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        onDiscardPress={handleDiscardPress}
        discardCount={discardCount}
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Title Card */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>i år då?</Text>
        </View>

        {/* Random Category Button */}
        <Pressable style={styles.categoryButton} onPress={handleRandomCategory}>
          <Text style={styles.categoryButtonText}>Slumpa kategori</Text>
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
    backgroundColor: "#D24662",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  titleCard: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 48,
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  categoryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  categoryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  messageCard: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 40,
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: "center",
  },
  messageTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  messageSubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
