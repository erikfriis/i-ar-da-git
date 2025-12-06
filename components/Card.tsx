import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface CardProps {
  content: string;
  type: 'question' | 'answer';
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.85, 340);
const CARD_HEIGHT = CARD_WIDTH * 1.4;

/**
 * Card component for displaying questions and answers
 * Features rounded corners, soft shadow, and centered large text
 */
export const Card: React.FC<CardProps> = ({ content, type }) => {
  return (
    <View style={[styles.card, type === 'answer' ? styles.answerCard : styles.questionCard]}>
      <View style={styles.cardInner}>
        <Text style={styles.cardLabel}>
          {type === 'question' ? 'FRÅGA' : 'SVAR'}
        </Text>
        <Text style={[styles.cardContent, type === 'answer' && styles.answerContent]}>
          {content}
        </Text>
        <Text style={styles.swipeHint}>
          {type === 'question' ? 'Svep för att se svaret →' : 'Svep för nästa kort →'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    // Shadow for Android
    elevation: 8,
    overflow: 'hidden',
  },
  questionCard: {
    backgroundColor: '#FEFEFE',
  },
  answerCard: {
    backgroundColor: '#F0FDF4', // Light green tint for answer
  },
  cardInner: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    fontSize: 24,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 34,
    paddingVertical: 20,
  },
  answerContent: {
    fontSize: 48,
    fontWeight: '700',
    color: '#059669', // Green color for answer
  },
  swipeHint: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default Card;


