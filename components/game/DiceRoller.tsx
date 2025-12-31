import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  InteractionManager,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
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
  /** If true, automatically start rolling on mount. Default: true */
  autoRoll?: boolean;
}

/**
 * Get a random color index for flicker effect
 */
const getRandomColorIndex = (): number => {
  return Math.floor(Math.random() * ALL_OUTCOMES.length);
};

/**
 * DiceRoller Component
 *
 * An animated dice that automatically rolls on mount.
 * Features:
 * - 2.5s tumbling animation with rotation + wobble + scale
 * - Flickering face colors during roll (UI thread based)
 * - 1.0s pause on final face before callback
 * - Only lands on available outcomes (skips empty categories)
 * - Auto-rolls on mount (no swipe required)
 * - Cannot be skipped or interrupted
 * - Optimized for smooth first-frame animation start
 */
export const DiceRoller: React.FC<DiceRollerProps> = ({
  onRollComplete,
  getAvailableOutcomes,
  onAllCategoriesEmpty,
  disabled = false,
  autoRoll = true,
}) => {
  // Animation shared values (all on UI thread)
  const rotateZ = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const shadowRadius = useSharedValue(12);

  // Color index for flicker (shared value for UI thread color updates)
  const colorIndex = useSharedValue(getRandomColorIndex());

  // State (minimal - only for text display)
  const [isRolling, setIsRolling] = useState(false);

  // Refs for guards and outcome tracking
  const hasRolledRef = useRef(false);
  const finalOutcomeRef = useRef<DiceOutcome | null>(null);
  const flickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

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
   * Start the flicker effect using setInterval
   * Updates colorIndex shared value to keep animation on UI thread
   */
  const startFlicker = useCallback(() => {
    if (flickerIntervalRef.current) {
      clearInterval(flickerIntervalRef.current);
    }
    flickerIntervalRef.current = setInterval(() => {
      colorIndex.value = getRandomColorIndex();
    }, 100);
  }, [colorIndex]);

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
   * Handle roll completion after animations (called from JS thread)
   */
  const handleRollEnd = useCallback(() => {
    const outcome = finalOutcomeRef.current;
    if (!outcome) return;

    stopFlicker();
    // Set final color
    colorIndex.value = ALL_OUTCOMES.indexOf(outcome);

    // Wait 1.0s showing final face, then call callback
    setTimeout(() => {
      setIsRolling(false);
      finalOutcomeRef.current = null;
      onRollComplete(outcome);
    }, 1000);
  }, [onRollComplete, stopFlicker, colorIndex]);

  /**
   * Start the animation values (runs on UI thread)
   * Separated from state updates to prevent first-frame lag
   */
  const startAnimations = useCallback(() => {
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

    // Schedule roll end callback
    setTimeout(() => {
      handleRollEnd();
    }, ROLL_DURATION);
  }, [rotateZ, rotateX, rotateY, scale, shadowRadius, handleRollEnd]);

  /**
   * Trigger the roll animation
   * Optimized to start animations immediately, defer state updates
   */
  const triggerRoll = useCallback(() => {
    // Prevent multiple rolls (using ref check before setting)
    if (finalOutcomeRef.current !== null || disabled) return;

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

    // Pick the final outcome from available outcomes
    const outcome = pickRandomOutcome();
    if (!outcome) {
      onAllCategoriesEmpty?.();
      return;
    }

    // Store outcome in ref (no re-render)
    finalOutcomeRef.current = outcome;

    // Start animations IMMEDIATELY (before any state updates)
    startAnimations();
    startFlicker();

    // Defer state update to next frame to avoid blocking animation start
    requestAnimationFrame(() => {
      setIsRolling(true);
    });
  }, [
    disabled,
    getAvailableOutcomes,
    onAllCategoriesEmpty,
    pickRandomOutcome,
    startAnimations,
    startFlicker,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFlicker();
    };
  }, [stopFlicker]);

  // Auto-roll on mount (with guard to prevent double-rolls from useEffect re-runs)
  // Uses double requestAnimationFrame to ensure layout/paint is complete
  useEffect(() => {
    if (autoRoll && !hasRolledRef.current && !disabled) {
      // Set guard immediately to prevent re-triggers from fast re-renders
      hasRolledRef.current = true;

      // Wait for interactions to complete (navigation animations, etc.)
      const startRollAfterPaint = () => {
        // Double rAF ensures we're past the first paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            triggerRoll();
          });
        });
      };

      if (Platform.OS === "web") {
        // On web, just use double rAF
        startRollAfterPaint();
      } else {
        // On native, wait for navigation interactions to complete
        const handle = InteractionManager.runAfterInteractions(() => {
          startRollAfterPaint();
        });
        return () => handle.cancel();
      }
    }
  }, [autoRoll, disabled, triggerRoll]);

  // Animated style for dice body
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

  // Animated style for face color (uses colorIndex shared value)
  const animatedFaceColor = useAnimatedStyle(() => {
    const colors = [
      FACE_COLORS.prylar,
      FACE_COLORS.personer,
      FACE_COLORS.underhallning,
      FACE_COLORS.blandat,
      FACE_COLORS["choose-user"],
      FACE_COLORS["choose-opponent"],
    ];
    const index = Math.min(
      Math.max(0, Math.round(colorIndex.value)),
      colors.length - 1
    );
    return {
      backgroundColor: colors[index],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.diceBody, animatedDiceStyle]}>
        {/* Single centered color dot */}
        <Animated.View
          style={[styles.facePatch, styles.facePatchCenter, animatedFaceColor]}
        />
      </Animated.View>

      {isRolling && (
        <Text style={styles.instructionText}>Kastar tärningen...</Text>
      )}
    </View>
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
  instructionText: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26,
  },
});

export default DiceRoller;
