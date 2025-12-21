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

interface GamePopupButton {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

interface GamePopupProps {
  visible: boolean;
  title: string;
  message: string;
  submessage?: string;
  icon?: string;
  buttons: GamePopupButton[];
}

/**
 * GamePopup - A flexible modal popup for game messages
 *
 * Used for:
 * - "Alla kort är slut" with 2 buttons (Blanda om / Avsluta)
 * - "Denna kategori är slut" with 1 button (Okej)
 */
export const GamePopup: React.FC<GamePopupProps> = ({
  visible,
  title,
  message,
  submessage,
  icon,
  buttons,
}) => {
  const isSingleButton = buttons.length === 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        {/* Outer border container */}
        <View style={styles.popupBorder}>
          {/* Inner dark card */}
          <View style={styles.popupInner}>
            {/* Content area */}
            <View style={styles.contentArea}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              {submessage && (
                <Text style={styles.submessage}>{submessage}</Text>
              )}
            </View>

            {/* Button area */}
            <View
              style={[
                styles.buttonContainer,
                isSingleButton && styles.buttonContainerSingle,
              ]}
            >
              {buttons.map((button, index) => (
                <Pressable
                  key={index}
                  style={[styles.button, isSingleButton && styles.buttonSingle]}
                  onPress={button.onPress}
                >
                  <Text style={styles.buttonText}>{button.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(30, 15, 20, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popupBorder: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#149339",
    borderRadius: 8,
    padding: 12,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 24,
  },
  popupInner: {
    backgroundColor: "#1B1B1B",
    borderRadius: 8,
    overflow: "hidden",
  },
  contentArea: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: "center",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 30,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 28,
  },
  submessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonContainerSingle: {
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  buttonSingle: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default GamePopup;
