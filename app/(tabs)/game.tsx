import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { useCards } from '@/hooks/useCards';

// Game step types
type GameStep = 'start' | 'question' | 'answer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

/**
 * Main Game Screen
 * Handles the trivia card game flow with swipe gestures
 */
export default function GameScreen() {
  const [step, setStep] = useState<GameStep>('start');
  const {
    currentCard,
    allCardsUsed,
    getNextCard,
    resetRound,
    getRemainingCount,
    getTotalCount,
  } = useCards();

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  /**
   * Handle drawing a new card
   */
  const handleDrawCard = useCallback(() => {
    const card = getNextCard();
    if (card) {
      opacity.value = 0;
      translateX.value = 0;
      opacity.value = withTiming(1, { duration: 300 });
      setStep('question');
    }
  }, [getNextCard, opacity, translateX]);

  /**
   * Handle advancing to next step after swipe
   */
  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (step === 'question') {
        // Reveal answer
        setStep('answer');
        translateX.value = 0;
        opacity.value = withTiming(1, { duration: 200 });
      } else if (step === 'answer') {
        // Return to start screen
        setStep('start');
        translateX.value = 0;
      }
    },
    [step, translateX, opacity]
  );

  /**
   * Handle resetting the round
   */
  const handleResetRound = useCallback(() => {
    resetRound();
    setStep('start');
  }, [resetRound]);

  // Swipe gesture handler
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const swipedLeft = event.translationX < -SWIPE_THRESHOLD;
      const swipedRight = event.translationX > SWIPE_THRESHOLD;

      if (swipedLeft || swipedRight) {
        // Animate card off screen
        translateX.value = withTiming(
          swipedLeft ? -SCREEN_WIDTH : SCREEN_WIDTH,
          { duration: 200 },
          () => {
            runOnJS(handleSwipeComplete)(swipedLeft ? 'left' : 'right');
          }
        );
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
      }
    });

  // Animated styles for the card
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  /**
   * Render Start Screen
   */
  const renderStartScreen = () => (
    <View style={styles.startContainer}>
      <Text style={styles.title}>När Då Då?</Text>
      <Text style={styles.subtitle}>Sverigetrivia</Text>

      {allCardsUsed ? (
        <View style={styles.allUsedContainer}>
          <Text style={styles.allUsedText}>
            🎉 Inga fler kort – starta om rundan?
          </Text>
          <Pressable
            style={[styles.button, styles.resetButton]}
            onPress={handleResetRound}
          >
            <Text style={styles.buttonText}>Starta om</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable style={styles.button} onPress={handleDrawCard}>
            <Text style={styles.buttonText}>Dra kort</Text>
          </Pressable>
          <Text style={styles.cardCount}>
            {getRemainingCount()} av {getTotalCount()} kort kvar
          </Text>
        </>
      )}
    </View>
  );

  /**
   * Render Question or Answer Card
   */
  const renderCard = () => {
    if (!currentCard) return null;

    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardCount}>
          {getTotalCount() - getRemainingCount()} av {getTotalCount()}
        </Text>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
            <Card
              content={step === 'question' ? currentCard.question : currentCard.answer}
              type={step === 'question' ? 'question' : 'answer'}
            />
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.background}>
        {step === 'start' ? renderStartScreen() : renderCard()}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 60,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    // Shadow
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardCount: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 24,
    fontWeight: '500',
  },
  allUsedContainer: {
    alignItems: 'center',
    gap: 24,
  },
  allUsedText: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});


