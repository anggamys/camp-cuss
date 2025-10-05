import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const user = await login(username, password);
    if (user) {
      if (user.role === "admin") navigation.replace("HomeAdmin");
      else if (user.role === "driver") navigation.replace("HomeDriver");
      else navigation.replace("HomeUser");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>COMP-CUSS</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>
      <Text style={styles.registerText}>
        Belum punya akun?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
          Sign in
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#4E1F1A", justifyContent: "center", padding: 20 },
  logo: { color: "#fff", fontSize: 32, textAlign: "center", marginBottom: 40, fontWeight: "bold" },
  input: { backgroundColor: "#fff", marginBottom: 10, borderRadius: 8, padding: 10 },
  button: { backgroundColor: "#FCEBD7", padding: 12, borderRadius: 30, marginTop: 10 },
  btnText: { textAlign: "center", color: "#4E1F1A", fontWeight: "bold" },
  registerText: { textAlign: "center", color: "#fff", marginTop: 10 },
  link: { color: "#FCEBD7", textDecorationLine: "underline" },
});
