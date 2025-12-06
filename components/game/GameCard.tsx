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
}

/**
 * GameCard - Displays question or answer in the game's visual style
 * Question side: White card with category header and event text
 * Answer side: Category-colored card with full date
 */
export const GameCard: React.FC<GameCardProps> = ({
  event,
  categoryId,
  fullAnswerDate,
  type,
  buttonText,
  onButtonPress,
}) => {
  const category = categoryId ? getCategoryById(categoryId) : null;
  const categoryColor = category?.color || "#7AD17A";

  // Determine if text should be dark or light based on category color
  const isLightBackground = ["#F7D358", "#7AD17A"].includes(categoryColor);
  const textColor = isLightBackground ? "#1F2937" : "#FFFFFF";

  if (type === "answer") {
    return (
      <View style={styles.container}>
        {/* Answer Card - Category color background */}
        <View style={[styles.card, { backgroundColor: categoryColor }]}>
          <View style={styles.answerContent}>
            <Text style={[styles.fullDateText, { color: textColor }]}>
              {fullAnswerDate}
            </Text>
            <Text
              style={[
                styles.answerSubtitle,
                { color: textColor, opacity: 0.8 },
              ]}
            >
              i år då?
            </Text>
          </View>

          {buttonText && onButtonPress && (
            <Pressable style={styles.button} onPress={onButtonPress}>
              <Text style={styles.buttonText}>{buttonText}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Question Card - White with colored category header */}
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

        {/* Footer with title and button */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>i år då?</Text>
        </View>
      </View>
      {buttonText && onButtonPress && (
        <Pressable style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
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
    backgroundColor: "#000000",
  },
  categoryHeader: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  categoryLabel: {
    fontSize: 29,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  questionContent: {
    flex: 1,
    justifyContent: "flex-start",
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
    fontSize: 46,
    fontWeight: "700",
    color: "#ffffff",
  },
  answerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  fullDateText: {
    fontSize: 42,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  answerSubtitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default GameCard;
