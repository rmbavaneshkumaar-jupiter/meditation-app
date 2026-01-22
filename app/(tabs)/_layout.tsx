import { Tabs } from "expo-router";
import { Mic, Sparkles } from "lucide-react-native";
import React from "react";
import { COLORS } from "@/constants/meditation";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Record",
          headerTitle: "Record", // Default, will be updated by screen
          tabBarIcon: ({ color }) => <Mic size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meditate"
        options={{
          title: "Meditate",
          tabBarIcon: ({ color }) => <Sparkles size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
