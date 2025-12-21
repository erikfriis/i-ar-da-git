import { getCategoryById } from "@/constants/categories";
import React from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width * 0.85, 320);
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface GameCardProps {
  // For question card (front)
  event?: string;
  categoryId?: string;
  // For answer card (back) - full date like "17 juni 2025"
  fullAnswerDate?: string;
  // Card type
  type: "question" | "answer";
  // Button
  buttonText?: string;
  onButtonPress?: () => void;
  buttonDisabled?: boolean;
  // Card tap handler (separate from button)
  onCardPress?: () => void;
}

/**
 * GameCard - Displays question or answer in the game's visual style
 * Question side: White card with category header and event text
 * Answer side: Category-colored card with category header and full date
 */
export const GameCard: React.FC<GameCardProps> = ({
  event,
  categoryId,
  fullAnswerDate,
  type,
  buttonText,
  onButtonPress,
  buttonDisabled = false,
  onCardPress,
}) => {
  const category = categoryId ? getCategoryById(categoryId) : null;
  const categoryColor = category?.color || "#7AD17A";

  // Determine if text should be dark or light based on category color
  const isLightBackground = ["#F7D358", "#7AD17A"].includes(categoryColor);
  const textColor = isLightBackground ? "#1F2937" : "#FFFFFF";

  /**
   * Handle button press - stops event propagation to prevent card tap
   */
  const handleButtonPress = () => {
    if (buttonDisabled || !onButtonPress) return;
    onButtonPress();
  };

  if (type === "answer") {
    return (
      <View style={styles.container}>
        {/* Answer Card - Category color background */}
        <Pressable onPress={onCardPress}>
          <View style={[styles.card, { backgroundColor: categoryColor }]}>
            {/* Header above white box*/}
            {category && (
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryLabel}>{category.label}</Text>
              </View>
            )}
            {/* White box */}
            <View style={styles.answerContent}>
              <Text style={styles.fullDateText}>{fullAnswerDate}</Text>
            </View>
            {/* Game title below white box */}
            <View style={styles.footer}>
              <Text style={styles.footerTitle}>i år då?</Text>
            </View>
          </View>
        </Pressable>
        {buttonText && (
          <Pressable
            style={[
              styles.button,
              { borderColor: categoryColor },
              buttonDisabled && styles.buttonDisabled,
            ]}
            onPress={handleButtonPress}
            disabled={buttonDisabled}
          >
            <Text
              style={[
                styles.buttonText,
                buttonDisabled && styles.buttonTextDisabled,
              ]}
            >
              {buttonText}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Question Card - White with colored category header */}
      <Pressable onPress={onCardPress}>
        <View style={[styles.card, styles.questionCard]}>
          {/* Category header */}
          {category && (
            <View style={[styles.categoryHeader]}>
              <Text style={styles.categoryLabel}>{category.label}</Text>
            </View>
          )}

          {/* Event content */}
          <View style={styles.questionContent}>
            <Text style={styles.eventText}>{event}</Text>
          </View>

          {/* Footer with title */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>i år då?</Text>
          </View>
        </View>
      </Pressable>

      {/* Button - shown on question side too */}
      {buttonText && (
        <Pressable
          style={[
            styles.button,
            { borderColor: categoryColor },
            buttonDisabled && styles.buttonDisabled,
          ]}
          onPress={handleButtonPress}
          disabled={buttonDisabled}
        >
          <Text
            style={[
              styles.buttonText,
              buttonDisabled && styles.buttonTextDisabled,
            ]}
          >
            {buttonText}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    paddingVertical: 16,
    paddingHorizontal: 36,
    backgroundColor: "000000",
  },
  questionCard: {
    backgroundColor: "#1B1B1B",
  },
  categoryHeader: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  categoryLabel: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  questionContent: {
    flex: 1,
    justifyContent: "flex-start",
    borderRadius: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
  },
  eventText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 26,
  },
  footer: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  footerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },

  answerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  fullDateText: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#1b1b1b",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 10,
    // borderColor is set dynamically via inline style using categoryColor
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});

export default GameCard;
