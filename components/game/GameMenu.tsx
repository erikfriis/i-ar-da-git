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
            style={[styles.menuButton, styles.yellowButton]}
            onPress={onSettings}
          >
            <Text style={[styles.menuButtonText, styles.disabledText]}>
              inställningar
            </Text>
          </Pressable>

          {/* Account - disabled placeholder
          <Pressable
            style={[styles.menuButton, styles.blueButton]}
            onPress={onAccount}
          >
            <Text style={[styles.menuButtonText, styles.disabledText]}>
              konto
            </Text>
          </Pressable> */}

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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.722)",
    justifyContent: "center",
    alignItems: "center",
  },

  menuItems: {
    width: "100%",
    gap: 20,
    paddingHorizontal: 24,
  },
  menuButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#1B1B1B",
    borderWidth: 10,
  },
  greenButton: {
    borderColor: "#149339",
  },
  yellowButton: {
    borderColor: "#FDC300",
  },
  blueButton: {
    borderColor: "#00A5E4",
  },
  outlineButton: {
    borderColor: "#5A2479",
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledText: {
    opacity: 1,
  },
  outlineButtonText: {
    // * Borde byta namn till "purpleButton"
    fontSize: 16, // * Borde byta namn till "purpleButton"
    fontWeight: "600",
    color: "#FFFFFF",
  },
  continueButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 1)",
  },
});

export default GameMenu;
