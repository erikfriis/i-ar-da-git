import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { DiceOutcome, DiceRoller } from "@/components/game/DiceRoller";
import { GameHeader } from "@/components/game/GameHeader";
import { GameMenu } from "@/components/game/GameMenu";
import { GamePopup } from "@/components/game/GamePopup";
import { useGame } from "@/context/GameContext";

/**
 * Dice Roll Screen - "Slumpa kategori"
 *
 * Uses an animated dice roll to select one of 6 outcomes:
 * - Yellow (prylar) → directly to question card
 * - Blue (personer) → directly to question card
 * - Purple (underhållning) → directly to question card
 * - Green (blandat) → directly to question card
 * - White (vit) → choose category screen (user picks)
 * - Black (svart) → choose category screen (opponent picks)
 *
 * The dice only lands on categories that have remaining cards.
 * If all categories are empty, shows "Alla kort är slut" popup.
 */
export default function CategoryScreen() {
  const router = useRouter();
  const {
    isHydrated,
    getDiscardCount,
    endGame,
    isCategoryEmpty,
    resetAllUsedQuestions,
    menuVisible,
    setMenuVisible,
    setFlowStep,
    selectCategoryById,
    drawRandomQuestion,
  } = useGame();

  const discardCount = getDiscardCount;
  const [showAllCardsEmptyPopup, setShowAllCardsEmptyPopup] = useState(false);

  // Update flow step when screen mounts
  useEffect(() => {
    if (isHydrated) {
      setFlowStep("dice");
    }
  }, [isHydrated, setFlowStep]);

  /**
   * Get available dice outcomes - only categories with remaining cards
   */
  const getAvailableOutcomes = useCallback((): DiceOutcome[] => {
    const outcomes: DiceOutcome[] = [];

    // Add colored categories only if they have remaining cards
    if (!isCategoryEmpty("prylar")) outcomes.push("prylar");
    if (!isCategoryEmpty("personer")) outcomes.push("personer");
    if (!isCategoryEmpty("underhallning")) outcomes.push("underhallning");
    if (!isCategoryEmpty("blandat")) outcomes.push("blandat");

    // Always add choose options (vit/svart)
    outcomes.push("choose-user");
    outcomes.push("choose-opponent");

    return outcomes;
  }, [isCategoryEmpty]);

  /**
   * Handle when all categories are empty
   */
  const handleAllCategoriesEmpty = useCallback(() => {
    setShowAllCardsEmptyPopup(true);
  }, []);

  /**
   * Handle "Blanda om leken" - reset deck but keep discard pile
   */
  const handleReshuffleDeck = useCallback(() => {
    setShowAllCardsEmptyPopup(false);
    resetAllUsedQuestions();
    // Stay on the dice screen - user can roll again
  }, [resetAllUsedQuestions]);

  /**
   * Handle "Avsluta spel" - end game and go home
   */
  const handleEndGameFromPopup = useCallback(() => {
    setShowAllCardsEmptyPopup(false);
    endGame();
    router.replace("/");
  }, [endGame, router]);

  /**
   * Handle dice roll completion
   * Maps DiceOutcome to navigation
   * - Colored categories: Go directly to question (skip category-result screen)
   * - White/Black: Go to choose-category screen
   */
  const handleRollComplete = useCallback(
    (outcome: DiceOutcome) => {
      if (outcome === "choose-user") {
        router.push({
          pathname: "/game/choose-category",
          params: { mode: "user" },
        });
      } else if (outcome === "choose-opponent") {
        router.push({
          pathname: "/game/choose-category",
          params: { mode: "opponent" },
        });
      } else {
        // Colored category - go directly to question
        selectCategoryById(outcome);
        const question = drawRandomQuestion(outcome);

        if (question) {
          router.push("/game/question");
        } else {
          // This shouldn't happen since dice only lands on non-empty categories
          // but handle it gracefully by showing the "all cards empty" popup
          setShowAllCardsEmptyPopup(true);
        }
      }
    },
    [router, selectCategoryById, drawRandomQuestion]
  );

  /**
   * Navigate to discard pile
   */
  const handleDiscardPress = () => {
    router.push("/game/discard-pile");
  };

  /**
   * Handle menu actions
   */
  const handleEndGame = () => {
    setMenuVisible(false);
    endGame();
    router.replace("/");
  };

  const handleRules = () => {
    setMenuVisible(false);
    router.push("/rules");
  };

  const handleSettings = () => {
    setMenuVisible(false);
    router.push("/settings");
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <GameHeader
        onMenuPress={() => setMenuVisible(true)}
        onDiscardPress={handleDiscardPress}
        discardCount={discardCount}
      />

      {/* Main content with dice - auto-rolls on mount */}
      <View style={styles.content}>
        <DiceRoller
          onRollComplete={handleRollComplete}
          getAvailableOutcomes={getAvailableOutcomes}
          onAllCategoriesEmpty={handleAllCategoriesEmpty}
          autoRoll={true}
        />
      </View>

      {/* Menu Modal */}
      <GameMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onRules={handleRules}
        onSettings={handleSettings}
        onAccount={() => {}}
        onEndGame={handleEndGame}
        onContinue={() => setMenuVisible(false)}
      />

      {/* All Cards Empty Popup */}
      <GamePopup
        visible={showAllCardsEmptyPopup}
        icon="🎴"
        title="Alla kort är slut"
        message="Ni har spelat alla kort i leken."
        buttons={[
          {
            label: "Blanda om leken",
            onPress: handleReshuffleDeck,
            variant: "primary",
          },
          {
            label: "Avsluta spel",
            onPress: handleEndGameFromPopup,
            variant: "secondary",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D24662",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
});
