import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Rules Screen - Placeholder
 */
export default function RulesScreen() {
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleCard}>
          <Text style={styles.title}>Spelregler</Text>
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.ruleTitle}>Så spelar du:</Text>

          <Text style={styles.ruleText}>
            1. Tryck på "Slumpa kategori" för att dra ett kort
          </Text>

          <Text style={styles.ruleText}>
            2. Läs frågan och gissa vilket år händelsen inträffade
          </Text>

          <Text style={styles.ruleText}>
            3. Svep höger eller tryck "vänd kort" för att se svaret
          </Text>

          <Text style={styles.ruleText}>
            4. Svep igen eller tryck "nytt kort" för att fortsätta
          </Text>

          <Text style={styles.ruleText}>
            5. Alla spelade kort hamnar i slänghögen
          </Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.ruleTitle}>Tips:</Text>
          <Text style={styles.ruleText}>
            • Spela tillsammans och tävla om vem som gissar närmast!
          </Text>
          <Text style={styles.ruleText}>
            • Använd menyn (☰) för att pausa eller avsluta spelet
          </Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
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
  rulesCard: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    marginBottom: 16,
  },
  tipsCard: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  ruleText: {
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 22,
  },
});

