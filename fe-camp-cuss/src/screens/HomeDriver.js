import React from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function HomeDriver() {
  const { logout } = useAuth();
  return (
    <View>
      <Text>Dashboard Driver</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
