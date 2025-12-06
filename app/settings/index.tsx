import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Settings Screen - Placeholder
 */
export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /**
   * Navigate back
   */
  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack} hitSlop={12}>
          <Text style={styles.backButtonText}>← Tillbaka</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleCard}>
          <Text style={styles.title}>Inställningar</Text>
        </View>

        <Text style={styles.placeholder}>Kommer snart...</Text>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresHeader}>Planerade funktioner:</Text>
          <Text style={styles.featureItem}>• Ljust/mörkt tema</Text>
          <Text style={styles.featureItem}>• Ljudeffekter</Text>
          <Text style={styles.featureItem}>• Svårighetsgrad</Text>
          <Text style={styles.featureItem}>• Egna frågor</Text>
          <Text style={styles.featureItem}>• Statistik</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  titleCard: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  placeholder: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 32,
  },
  featuresCard: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 300,
  },
  featuresHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  featureItem: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 22,
  },
});

