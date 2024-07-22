import { View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import {
  SQLiteProvider,
  useSQLiteContext,
  type SQLiteDatabase,
} from "expo-sqlite";

import { useColorScheme } from "@/hooks/useColorScheme";
import { TouchableOpacity } from "react-native";
import IndexScreen from "./(tabs)";
import { router } from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SQLiteProvider databaseName="food.db" onInit={migrateDbIfNeeded}>
        <Stack>
          <Stack.Screen
            name="(tabs)/index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let user_version = await db.getFirstAsync<{
    user_version: number;
  }>("PRAGMA user_version");
  if (
    user_version?.user_version &&
    user_version.user_version >= DATABASE_VERSION
  ) {
    return;
  }
  if (user_version?.user_version === 0) {
    await db.execAsync(
      `
      CREATE TABLE IF NOT EXISTS logged_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          time TEXT,
          amount INTEGER,
          food_id INTEGER,
          food_data TEXT
        );`
    );
    const currentDbVersion = 1;
    await db.execAsync(`PRAGMA user_version = ${currentDbVersion}`);
  }
}
