import { Stack } from "expo-router";

/**
 * Rules Stack Layout
 * Simple layout for the rules screen
 */
export default function RulesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

