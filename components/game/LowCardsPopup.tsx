import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface LowCardsPopupProps {
  visible: boolean;
  categoryName: string;
  onConfirm: () => void;
}

/**
 * LowCardsPopup - Shown when a category has less than 10 cards remaining
 * Blocks the game until user presses OK
 * After OK, the category's used questions are reset (reshuffled)
 */
export const LowCardsPopup: React.FC<LowCardsPopupProps> = ({
  visible,
  categoryName,
  onConfirm,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.icon}>🔄</Text>
          <Text style={styles.title}>Få kort kvar!</Text>
          <Text style={styles.message}>
            Det finns få kort kvar i kategorin "{categoryName}".
          </Text>
          <Text style={styles.submessage}>Kortleken blandas om.</Text>

          <Pressable style={styles.button} onPress={onConfirm}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  submessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default LowCardsPopup;
