import React from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function HomeUser() {
  const { logout } = useAuth();
  return (
    <View>
      <Text>Dashboard User</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
