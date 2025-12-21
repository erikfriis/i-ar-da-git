import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackIcon } from "@/components/icons/StackIcon";

interface GameHeaderProps {
  onMenuPress?: () => void;
  onDiscardPress?: () => void;
  onClosePress?: () => void;
  showMenu?: boolean;
  showDiscard?: boolean;
  showClose?: boolean;
  discardCount?: number;
}

/**
 * GameHeader - Header for game screens
 * Shows hamburger menu on left, discard pile icon on right
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  onMenuPress,
  onDiscardPress,
  onClosePress,
  showMenu = true,
  showDiscard = true,
  showClose = false,
  discardCount = 0,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {/* Left side - Menu button */}
      <View style={styles.leftSection}>
        {showMenu && onMenuPress && (
          <Pressable
            style={styles.iconButton}
            onPress={onMenuPress}
            hitSlop={12}
          >
            <View style={styles.hamburger}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </Pressable>
        )}
      </View>

      {/* Right side - Discard or Close button */}
      <View style={styles.rightSection}>
        {showDiscard && onDiscardPress && (
          <Pressable
            style={styles.iconButton}
            onPress={onDiscardPress}
            hitSlop={12}
          >
            <View style={styles.discardIconWrapper}>
              <StackIcon width={28} height={40} />
            </View>
            {discardCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{discardCount}</Text>
              </View>
            )}
          </Pressable>
        )}
        {showClose && onClosePress && (
          <Pressable
            style={styles.iconButton}
            onPress={onClosePress}
            hitSlop={12}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  leftSection: {
    width: 44,
    alignItems: "flex-start",
  },
  rightSection: {
    width: 44,
    alignItems: "flex-end",
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburger: {
    width: 24,
    height: 18,
    justifyContent: "space-between",
  },
  hamburgerLine: {
    width: 24,
    height: 3,
    backgroundColor: "#A73349",
    borderRadius: 1.5,
  },
  discardIconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: -4,
    backgroundColor: "#A73349",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeIcon: {
    fontSize: 24,
    color: "#A73349", // Match hamburger/menu icon color
    fontWeight: "300",
  },
});

export default GameHeader;
