import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DICE_SIZE = Math.min(SCREEN_WIDTH * 0.45, 180);

/**
 * Outcome type for dice roll
 */
export type DiceOutcome =
  | "prylar"
  | "personer"
  | "underhallning"
  | "blandat"
  | "choose-user"
  | "choose-opponent";

/**
 * Face color mapping for each outcome
 */
const FACE_COLORS: Record<DiceOutcome, string> = {
  prylar: "#FDC300", // Yellow
  personer: "#00A5E4", // Light blue
  underhallning: "#5A2479", // Purple
  blandat: "#149339", // Green
  "choose-user": "#FFFFFF", // White
  "choose-opponent": "#000000", // Black
};

/**
 * All possible outcomes (used for visual flickering only)
 */
const ALL_OUTCOMES: DiceOutcome[] = [
  "prylar",
  "personer",
  "underhallning",
  "blandat",
  "choose-user",
  "choose-opponent",
];

interface DiceRollerProps {
  onRollComplete: (outcome: DiceOutcome) => void;
  /** Function to get available outcomes - dice will only land on these */
  getAvailableOutcomes: () => DiceOutcome[];
  /** Called when user tries to roll but all categories are empty */
  onAllCategoriesEmpty?: () => void;
  disabled?: boolean;
}

/**
 * DiceRoller Component
 *
 * An animated dice that responds to swipe-up gestures.
 * Features:
 * - 2.5s tumbling animation with rotation + wobble + scale
 * - Flickering face colors during roll
 * - 1.0s pause on final face before callback
 * - Only lands on available outcomes (skips empty categories)
 */
export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRollComplete,
  getAvailableOutcomes,
  onAllCategoriesEmpty,
  disabled = false,
}) => {
  // Animation shared values
  const rotateZ = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const shadowRadius = useSharedValue(12);

  /**
   * Get a random face color for initial display (purely visual, doesn't affect outcome)
   */
  const getRandomInitialColor = (): string => {
    const randomOutcome =
      ALL_OUTCOMES[Math.floor(Math.random() * ALL_OUTCOMES.length)];
    return FACE_COLORS[randomOutcome];
  };

  // State
  const [isRolling, setIsRolling] = useState(false);
  const [currentFaceColor, setCurrentFaceColor] = useState(() =>
    getRandomInitialColor()
  );
  const [finalOutcome, setFinalOutcome] = useState<DiceOutcome | null>(null);

  // Refs for intervals
  const flickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Pick a random outcome from available outcomes only
   */
  const pickRandomOutcome = useCallback((): DiceOutcome | null => {
    const available = getAvailableOutcomes();
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }, [getAvailableOutcomes]);

  /**
   * Pick a random face color for flickering (uses all colors for visual effect)
   */
  const pickRandomFaceColor = useCallback((): string => {
    const randomOutcome =
      ALL_OUTCOMES[Math.floor(Math.random() * ALL_OUTCOMES.length)];
    return FACE_COLORS[randomOutcome];
  }, []);

  /**
   * Start the flicker effect - rapidly change face colors
   */
  const startFlicker = useCallback(() => {
    if (flickerIntervalRef.current) {
      clearInterval(flickerIntervalRef.current);
    }
    flickerIntervalRef.current = setInterval(() => {
      setCurrentFaceColor(pickRandomFaceColor());
    }, 80 + Math.random() * 40);
  }, [pickRandomFaceColor]);

  /**
   * Stop the flicker effect
   */
  const stopFlicker = useCallback(() => {
    if (flickerIntervalRef.current) {
      clearInterval(flickerIntervalRef.current);
      flickerIntervalRef.current = null;
    }
  }, []);

  /**
   * Handle roll completion after animations
   */
  const handleRollEnd = useCallback(
    (outcome: DiceOutcome) => {
      stopFlicker();
      setCurrentFaceColor(FACE_COLORS[outcome]);

      // Wait 1.0s showing final face, then call callback
      setTimeout(() => {
        setIsRolling(false);
        setFinalOutcome(null);
        onRollComplete(outcome);
      }, 1000);
    },
    [onRollComplete, stopFlicker]
  );

  /**
   * Trigger the roll animation
   */
  const triggerRoll = useCallback(() => {
    if (isRolling || disabled) return;

    // Check if there are any available outcomes with cards
    const available = getAvailableOutcomes();

    // If only choose-user and choose-opponent are available (all categories empty)
    const categoryOutcomes = available.filter(
      (o) => o !== "choose-user" && o !== "choose-opponent"
    );

    if (categoryOutcomes.length === 0) {
      // All colored categories are empty - trigger popup
      onAllCategoriesEmpty?.();
      return;
    }

    setIsRolling(true);

    // Pick the final outcome from available outcomes
    const outcome = pickRandomOutcome();
    if (!outcome) {
      setIsRolling(false);
      onAllCategoriesEmpty?.();
      return;
    }

    setFinalOutcome(outcome);
    startFlicker();

    const ROLL_DURATION = 2500;

    // Rotate Z - fast spin
    rotateZ.value = withTiming(360 * 6, {
      duration: ROLL_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    // Rotate X - wobble
    rotateX.value = withSequence(
      withTiming(25, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(-20, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(15, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(-12, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(8, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(-4, {
        duration: ROLL_DURATION * 0.125,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(0, {
        duration: ROLL_DURATION * 0.1,
        easing: Easing.out(Easing.quad),
      })
    );

    // Rotate Y - wobble
    rotateY.value = withSequence(
      withTiming(-20, {
        duration: ROLL_DURATION * 0.12,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(18, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(-14, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(10, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(-6, {
        duration: ROLL_DURATION * 0.15,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(3, {
        duration: ROLL_DURATION * 0.14,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(0, {
        duration: ROLL_DURATION * 0.14,
        easing: Easing.out(Easing.quad),
      })
    );

    // Scale bounce
    scale.value = withSequence(
      withTiming(0.92, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(1.08, { duration: 200, easing: Easing.out(Easing.quad) }),
      withTiming(0.96, { duration: 300, easing: Easing.inOut(Easing.quad) }),
      withTiming(1.04, { duration: 400, easing: Easing.inOut(Easing.quad) }),
      withTiming(0.98, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      withTiming(1.02, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
    );

    // Shadow change
    shadowRadius.value = withSequence(
      withTiming(20, {
        duration: ROLL_DURATION * 0.3,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(8, {
        duration: ROLL_DURATION * 0.4,
        easing: Easing.inOut(Easing.quad),
      }),
      withTiming(12, {
        duration: ROLL_DURATION * 0.3,
        easing: Easing.out(Easing.quad),
      })
    );

    setTimeout(() => {
      runOnJS(handleRollEnd)(outcome);
    }, ROLL_DURATION);
  }, [
    isRolling,
    disabled,
    getAvailableOutcomes,
    onAllCategoriesEmpty,
    pickRandomOutcome,
    startFlicker,
    rotateZ,
    rotateX,
    rotateY,
    scale,
    shadowRadius,
    handleRollEnd,
  ]);

  useEffect(() => {
    return () => {
      stopFlicker();
    };
  }, [stopFlicker]);

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationY < -60 && event.velocityY < 0) {
        runOnJS(triggerRoll)();
      }
    })
    .enabled(!isRolling && !disabled);

  const animatedDiceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateZ: `${rotateZ.value}deg` },
        { rotateX: `${rotateX.value}deg` },
        { rotateY: `${rotateY.value}deg` },
        { scale: scale.value },
      ],
      shadowRadius: shadowRadius.value,
      shadowOpacity: interpolate(shadowRadius.value, [8, 20], [0.25, 0.4]),
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        <Animated.View style={[styles.diceBody, animatedDiceStyle]}>
          <View
            style={[
              styles.facePatch,
              styles.facePatchCenter,
              { backgroundColor: currentFaceColor },
            ]}
          />
          <View
            style={[
              styles.facePatch,
              styles.facePatchLeft,
              { backgroundColor: currentFaceColor, opacity: 0.7 },
            ]}
          />
          <View
            style={[
              styles.facePatch,
              styles.facePatchRight,
              { backgroundColor: currentFaceColor, opacity: 0.7 },
            ]}
          />
        </Animated.View>

        <Text style={styles.instructionText}>
          {isRolling ? "Kastar..." : "Svep upp för att\nkasta tärningen!"}
        </Text>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  diceBody: {
    width: DICE_SIZE,
    height: DICE_SIZE,
    backgroundColor: "#F5F5F5",
    borderRadius: DICE_SIZE * 0.22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  facePatch: {
    position: "absolute",
    borderRadius: 999,
  },
  facePatchCenter: {
    width: DICE_SIZE * 0.42,
    height: DICE_SIZE * 0.42,
  },
  facePatchLeft: {
    width: DICE_SIZE * 0.22,
    height: DICE_SIZE * 0.22,
    left: DICE_SIZE * 0.08,
    top: DICE_SIZE * 0.5 - DICE_SIZE * 0.11,
  },
  facePatchRight: {
    width: DICE_SIZE * 0.22,
    height: DICE_SIZE * 0.22,
    right: DICE_SIZE * 0.08,
    bottom: DICE_SIZE * 0.15,
  },
  instructionText: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26,
    minHeight: 60,
  },
});

export default DiceRoller;
