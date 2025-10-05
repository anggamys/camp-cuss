import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isUsernameActive, setIsUsernameActive] = useState(false);
  const [isPasswordActive, setIsPasswordActive] = useState(false);

  // Animasi values
  const usernameAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;
  const usernameInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;

  const handleLogin = async () => {
    const user = await login(username, password);
    if (user) {
      if (user.role === 'admin') navigation.replace('HomeAdmin');
      else if (user.role === 'driver') navigation.replace('HomeDriver');
      else navigation.replace('HomeUser');
    }
  };

  const handleRegister = async () => {
    navigation.navigate('Register');
  };

  const activateUsername = () => {
    setIsUsernameActive(true);
    Animated.parallel([
      Animated.timing(usernameAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(usernameInputAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const activatePassword = () => {
    setIsPasswordActive(true);
    Animated.parallel([
      Animated.timing(passwordAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(passwordInputAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  };

  const deactivateUsername = () => {
    if (!username) {
      setIsUsernameActive(false);
      Animated.parallel([
        Animated.timing(usernameAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(usernameInputAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const deactivatePassword = () => {
    if (!password) {
      setIsPasswordActive(false);
      Animated.parallel([
        Animated.timing(passwordAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(passwordInputAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  // Animasi untuk Username
  const usernameTop = usernameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const usernameFontSize = usernameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const underlineOpacity = usernameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const usernameInputHeight = usernameInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const usernameInputOpacity = usernameInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Animasi untuk Password
  const passwordTop = passwordAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const passwordFontSize = passwordAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const passwordUnderlineOpacity = passwordAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const passwordInputHeight = passwordInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const passwordInputOpacity = passwordInputAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo-name.png')}
        style={styles.logoName}
      />

      {/* Username Section */}
      <View style={styles.inputSection}>
        <TouchableOpacity onPress={activateUsername} activeOpacity={0.8}>
          <Animated.Text
            style={[
              styles.fieldLabel,
              {
                top: usernameTop,
                fontSize: usernameFontSize,
              },
            ]}
          >
            Username
          </Animated.Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              height: usernameInputHeight,
              opacity: usernameInputOpacity,
            },
          ]}
        >
          <TextInput
            placeholder="Masukkan username"
            style={styles.animatedInput}
            value={username}
            onChangeText={setUsername}
            onFocus={activateUsername}
            onBlur={deactivateUsername}
            autoFocus={isUsernameActive}
          />
        </Animated.View>

        {/* Garis bawah di bawah input */}
        <Animated.View
          style={[
            styles.underline,
            {
              opacity: underlineOpacity,
            },
          ]}
        />
      </View>

      {/* Password Section */}
      <View style={styles.inputSection}>
        <TouchableOpacity onPress={activatePassword} activeOpacity={0.8}>
          <Animated.Text
            style={[
              styles.fieldLabel,
              {
                top: passwordTop,
                fontSize: passwordFontSize,
              },
            ]}
          >
            Password
          </Animated.Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.inputContainer,
            {
              height: passwordInputHeight,
              opacity: passwordInputOpacity,
            },
          ]}
        >
          <TextInput
            placeholder="Masukkan password"
            secureTextEntry
            style={styles.animatedInput}
            value={password}
            onChangeText={setPassword}
            onFocus={activatePassword}
            onBlur={deactivatePassword}
            autoFocus={isPasswordActive}
          />
        </Animated.View>

        {/* Garis bawah di bawah input */}
        <Animated.View
          style={[
            styles.underline,
            {
              opacity: passwordUnderlineOpacity,
            },
          ]}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Belum punya akun?{'  '}</Text>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.link}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1F1A',
    justifyContent: 'center',
    padding: 35,
  },
  logoName: {
    width: 280,
    height: 60,
    marginBottom: 80,
    alignContent: 'center',
    alignSelf: 'center',
  },
  inputSection: {
    marginBottom: 30,
    height: 50,
    backgroundColor: '#D9D9D9',
    opacity: 0.2,
  },
  fieldLabel: {
    color: '#fff',
    position: 'absolute',
    textAlign: 'left',
  },
  inputContainer: {
    overflow: 'hidden',
  },
  animatedInput: {
    backgroundColor: '#D9D9D9',
    opacity: 0.2,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FCEBD7',
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
  },
  btnText: {
    textAlign: 'center',
    color: '#4E1F1A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    textAlign: 'center',
    color: '#fff',
    paddingBottom: 10,
  },
  link: {
    color: '#FCEBD7',
    textDecorationLine: 'underline',
  },
});
