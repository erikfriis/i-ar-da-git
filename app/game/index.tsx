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
 * - Yellow (prylar) → category result screen
 * - Blue (personer) → category result screen
 * - Purple (underhållning) → category result screen
 * - Green (blandat) → category result screen
 * - White (vit) → choose category (user picks)
 * - Black (svart) → choose category (opponent picks)
 */
export default function CategoryScreen() {
  const router = useRouter();
  const {
    drawRandomOutcome,
    getDiscardCount,
    endGame,
    areAllQuestionsUsed,
  } = useGame();

  const discardCount = getDiscardCount;
  const [menuVisible, setMenuVisible] = useState(false);

  /**
   * Handle "Slumpa kategori" button press
   * Randomly picks one of 6 outcomes
   */
  const handleRandomCategory = () => {
    const result = drawRandomOutcome();

    if (result.type === "choose") {
      // White or Black → navigate to choose category screen with mode
      router.push({
        pathname: "/game/choose-category",
        params: { mode: result.mode },
      });
    } else {
      // Colored category → navigate to category result screen
      router.push({
        pathname: "/game/category-result",
        params: { categoryId: result.categoryId },
      });
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
          <Text style={styles.title}>[bild på tärning]</Text>
        </View>

        {/* Random Category Button */}
        <Pressable style={styles.categoryButton} onPress={handleRandomCategory}>
          <Text style={styles.categoryButtonText}>Svep upp för att kasta tärningen!</Text>
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
    paddingHorizontal: 48,
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center"
  },
  categoryButton: {
    // backgroundColor: "#1B1B1B", 
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    // borderWidth: 10,
    // borderColor: "#149339",
    maxWidth: 250,
  },
  categoryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center"
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
