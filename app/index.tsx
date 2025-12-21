import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";

/**
 * Main Menu Screen - "Huvudmeny"
 * Entry point of the app with options to start game, view rules, or settings
 */
export default function MainMenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    isHydrated,
    hasGameInProgress,
    startNewGame,
    resumeGame,
    setFlowStep,
  } = useGame();

  // Update flow step when on home
  useEffect(() => {
    if (isHydrated) {
      setFlowStep("home");
    }
  }, [isHydrated, setFlowStep]);

  /**
   * Navigate to settings
   */
  const handleSettingsPress = () => {
    router.push("/settings");
  };

  /**
   * Start a new game
   */
  const handleStartNewGame = async () => {
    await startNewGame();
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
  const handleStartGame = async () => {
    await startNewGame();
    router.push("/game");
  };

  /**
   * Go to rules
   */
  const handleRules = () => {
    router.push("/rules");
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with settings button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        {/* <Pressable
          style={styles.settingsButton}
          onPress={handleSettingsPress}
          hitSlop={12}
        >
          <IconSymbol name="gearshape.fill" size={26} color="#FFFFFF" />
        </Pressable> */}
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
                <Text style={styles.buttonText}>nytt spel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleResumeGame}
              >
                <Text style={styles.buttonText}>återuppta</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={handleStartGame}
            >
              <Text style={styles.buttonText}>spela</Text>
            </Pressable>
          )}

          {/* Rules button */}
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={handleRules}
          >
            <Text style={styles.buttonText}>regler</Text>
          </Pressable>

          {/* Settings button (disabled placeholder) */}
          <Pressable
            style={[styles.button, styles.disabledButton]}
            onPress={handleSettingsPress}
          >
            <Text style={[styles.buttonText]}>inställningar</Text>
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
    borderRadius: 0,
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
    backgroundColor: "",
    paddingHorizontal: 48,
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 170,
    gap: 20,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#1B1B1B",
    borderWidth: 10,
  },
  primaryButton: {
    borderColor: "#149339",
  },
  secondaryButton: {
    borderColor: "#FDC300",
  },

  /**
   * Byt namn på disabledButton till settingsButton kanske? Bättre att den ser färdig ut tänker jag!
   */

  disabledButton: {
    borderColor: "#00A5E4",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
