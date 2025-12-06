import React, { createContext, useContext, ReactNode } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";

/**
 * Type for the game context value
 */
type GameContextValue = ReturnType<typeof useGameEngine>;

// Create the context
const GameContext = createContext<GameContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface GameProviderProps {
  children: ReactNode;
}

/**
 * GameProvider - Provides game state to all screens
 */
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const gameEngine = useGameEngine();

  return (
    <GameContext.Provider value={gameEngine}>{children}</GameContext.Provider>
  );
};

/**
 * Hook to use the game context
 */
export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

export default GameContext;

