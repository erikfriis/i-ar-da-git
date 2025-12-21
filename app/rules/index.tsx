import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { GameHeader } from "@/components/game/GameHeader";
import rulesData from "@/data/rules.json";

/**
 * Rule step data structure
 */
interface RuleStep {
  id: number;
  title: string;
  text: string;
}

const rules: RuleStep[] = rulesData;
const TOTAL_STEPS = rules.length;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 320);
const CARD_HEIGHT = CARD_WIDTH * 1.5;

/**
 * Rules Screen
 * Displays game rules as step-based cards matching the game card design
 *
 * - 5 steps total
 * - Navigation with "Tillbaka" / "Nästa" buttons (always visible)
 * - "Tillbaka" disabled on first step, "Nästa" disabled on last step
 * - Close icon in top right (only way to exit)
 * - Always starts at step 1
 * - No state persistence between opens
 */
export default function RulesScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const currentRule = rules.find((r) => r.id === currentStep) || rules[0];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  /**
   * Go to previous step
   */
  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Go to next step
   */
  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Close the rules screen
   */
  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header with close button only */}
      <GameHeader
        showMenu={false}
        showDiscard={false}
        showClose={true}
        onClosePress={handleClose}
      />

      {/* Main content */}
      <View style={styles.content}>
        {/* Rule Card - matching game card design */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Title header */}
            <View style={styles.titleHeader}>
              <Text style={styles.titleText}>{currentRule.title}</Text>
            </View>

            {/* White content area */}
            <View style={styles.cardContent}>
              <Text style={styles.ruleText}>{currentRule.text}</Text>
            </View>

            {/* Footer with "i år då?" and step indicator */}
            <View style={styles.footer}>
              <Text style={styles.footerTitle}>i år då?</Text>
              <Text style={styles.stepIndicator}>
                {currentStep}/{TOTAL_STEPS}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation buttons - always show both */}
        <View style={styles.buttonContainer}>
          {/* Tillbaka button - disabled on first step */}
          <Pressable
            style={[styles.navButton, isFirstStep && styles.navButtonDisabled]}
            onPress={handlePrevious}
            disabled={isFirstStep}
          >
            <Text style={styles.navButtonText}>Tillbaka</Text>
          </Pressable>

          {/* Nästa button - disabled on last step */}
          <Pressable
            style={[styles.navButton, isLastStep && styles.navButtonDisabled]}
            onPress={handleNext}
            disabled={isLastStep}
          >
            <Text style={styles.navButtonText}>Nästa</Text>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: "#000000",
    overflow: "hidden",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  titleHeader: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  cardContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  ruleText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1B1B1B",
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    position: "relative",
  },
  footerTitle: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepIndicator: {
    position: "absolute",
    right: 0,
    bottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  navButton: {
    backgroundColor: "#1B1B1B",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
