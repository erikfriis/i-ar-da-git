import { Stack } from "expo-router";

/**
 * Game Stack Layout
 * Handles navigation between game screens
 */
export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="choose-category" />
      <Stack.Screen name="question" />
      <Stack.Screen name="discard-pile" />
    </Stack>
  );
}

