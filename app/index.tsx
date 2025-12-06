import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { IconSymbol } from "@/components/ui/icon-symbol";

/**
 * Main Menu Screen - "Huvudmeny"
 * Entry point of the app with options to start game, view rules, or settings
 */
export default function MainMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasGameInProgress, startNewGame, resumeGame } = useGame();

  /**
   * Navigate to settings
   */
  const handleSettingsPress = () => {
    router.push("/settings");
  };

  /**
   * Start a new game
   */
  const handleStartNewGame = () => {
    startNewGame();
    router.push("/game");
  };

  /**
   * Resume existing game
   */
  const handleResumeGame = () => {
    resumeGame();
    router.push("/game");
  };

  /**
   * Start playing (first time)
   */
  const handleStartGame = () => {
    startNewGame();
    router.push("/game");
  };

  /**
   * Go to rules (placeholder)
   */
  const handleRules = () => {
    router.push("/rules");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with settings button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Pressable
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          hitSlop={12}
        >
          <IconSymbol name="gearshape.fill" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Title Card */}
        <View style={styles.titleCard}>
          <Text style={styles.title}>i år då?</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {hasGameInProgress ? (
            <>
              {/* Resume and New Game buttons */}
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={handleStartNewGame}
              >
                <Text style={styles.buttonText}>Starta nytt spel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleResumeGame}
              >
                <Text style={styles.buttonText}>Återuppta spel</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={handleStartGame}
            >
              <Text style={styles.buttonText}>Starta spel</Text>
            </Pressable>
          )}

          {/* Rules button (disabled placeholder) */}
          <Pressable
            style={[styles.button, styles.disabledButton]}
            onPress={handleRules}
          >
            <Text style={[styles.buttonText, styles.disabledText]}>Regler</Text>
          </Pressable>

          {/* Settings button (disabled placeholder) */}
          <Pressable
            style={[styles.button, styles.disabledButton]}
            onPress={handleSettingsPress}
          >
            <Text style={[styles.buttonText, styles.disabledText]}>
              Inställningar
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D24662",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 44,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
  buttonContainer: {
    width: "100%",
    maxWidth: 280,
    gap: 14,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
  },
  secondaryButton: {
    backgroundColor: "#059669",
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  disabledText: {
    opacity: 0.6,
  },
});
