import React from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function HomeAdmin() {
  const { logout } = useAuth();
  return (
    <View>
      <Text>Dashboard Admin</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
