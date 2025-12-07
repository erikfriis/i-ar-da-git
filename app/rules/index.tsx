import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
 * - Navigation with "nästa" / "föregående" buttons
 * - Close icon in top right
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
   * Go to next step or close on last step
   */
  const handleNext = () => {
    if (isLastStep) {
      router.back();
    } else {
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
      {/* Close button in top right */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

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

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {!isFirstStep && (
            <Pressable style={styles.navButton} onPress={handlePrevious}>
              <Text style={styles.navButtonText}>föregående</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.navButton, styles.primaryButton]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>
              {isLastStep ? "stäng" : "nästa"}
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
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
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
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },
  ruleText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#1F2937",
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
  },
  navButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
