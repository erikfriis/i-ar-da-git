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

interface GameMenuProps {
  visible: boolean;
  onClose: () => void;
  onRules: () => void;
  onSettings: () => void;
  onAccount: () => void;
  onEndGame: () => void;
  onContinue: () => void;
}

/**
 * GameMenu - In-game menu modal
 * Shows ONLY: Regler, Inställningar, Konto, Avsluta spel, Fortsätt
 * NO gameplay buttons (no "nytt kort" etc.)
 */
export const GameMenu: React.FC<GameMenuProps> = ({
  visible,
  onClose,
  onRules,
  onSettings,
  onAccount,
  onEndGame,
  onContinue,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>meny</Text>

          <View style={styles.menuItems}>
            {/* Rules - active */}
            <Pressable
              style={[styles.menuButton, styles.greenButton]}
              onPress={onRules}
            >
              <Text style={styles.menuButtonText}>regler</Text>
            </Pressable>

            {/* Settings - disabled placeholder */}
            <Pressable
              style={[
                styles.menuButton,
                styles.yellowButton,
                styles.disabledButton,
              ]}
              onPress={onSettings}
            >
              <Text style={[styles.menuButtonText, styles.disabledText]}>
                inst.
              </Text>
            </Pressable>

            {/* Account - disabled placeholder */}
            <Pressable
              style={[
                styles.menuButton,
                styles.blueButton,
                styles.disabledButton,
              ]}
              onPress={onAccount}
            >
              <Text style={[styles.menuButtonText, styles.disabledText]}>
                konto
              </Text>
            </Pressable>

            {/* End Game - active */}
            <Pressable
              style={[styles.menuButton, styles.outlineButton]}
              onPress={onEndGame}
            >
              <Text style={styles.outlineButtonText}>avsluta</Text>
            </Pressable>
          </View>

          {/* Continue button */}
          <Pressable style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueButtonText}>Fortsätt</Text>
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
  menuContainer: {
    width: width * 0.75,
    maxWidth: 300,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  menuItems: {
    width: "100%",
    gap: 12,
  },
  menuButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  greenButton: {
    backgroundColor: "#22C55E",
  },
  yellowButton: {
    backgroundColor: "#F59E0B",
  },
  blueButton: {
    backgroundColor: "#3B82F6",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  disabledButton: {
    opacity: 0.5,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledText: {
    opacity: 0.7,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F59E0B",
  },
  continueButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  continueButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export default GameMenu;
