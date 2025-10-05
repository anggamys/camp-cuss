import AsyncStorage from "@react-native-async-storage/async-storage";

export const setToken = async (tokens) => {
  await AsyncStorage.setItem("tokens", JSON.stringify(tokens));
};

export const getToken = async () => {
  const tokens = await AsyncStorage.getItem("tokens");
  return tokens ? JSON.parse(tokens) : {};
};

export const clearToken = async () => {
  await AsyncStorage.removeItem("tokens");
};
