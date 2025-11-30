import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Settings Screen
 * Placeholder for future settings functionality
 */
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inställningar</Text>
      <Text style={styles.placeholder}>Kommer snart...</Text>
      
      <View style={styles.futureFeatures}>
        <Text style={styles.featureHeader}>Planerade funktioner:</Text>
        <Text style={styles.featureItem}>• Ljust/mörkt tema</Text>
        <Text style={styles.featureItem}>• Ljudeffekter</Text>
        <Text style={styles.featureItem}>• Svårighetsgrad</Text>
        <Text style={styles.featureItem}>• Kategorier</Text>
        <Text style={styles.featureItem}>• Statistik</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 40,
  },
  futureFeatures: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureItem: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 22,
  },
});


