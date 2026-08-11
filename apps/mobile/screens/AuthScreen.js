import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { useState } from "react";
import { colors, fonts } from "../theme";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function AuthScreen({ intendedRole, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const isWorker = intendedRole === "worker";
  const handleAuth = async () => {
  if (!email || !password) {
    Alert.alert("Please enter email and password.");
    return;
  }
  if (isSignUp && !displayName.trim()) {
    Alert.alert("Please choose a username.");
    return;
  }
  setLoading(true);

  if (isSignUp) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert("Error", error.message);
      return;
    }
    if (data.user) {
      const { error: profileError } = await supabase
        .from("citizen_profiles")
        .insert({ id: data.user.id, display_name: displayName.trim() });
      if (profileError) {
        Alert.alert("Signed up, but username couldn't be saved", profileError.message);
      }
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      Alert.alert("Error", error.message);
    }
  }

  setLoading(false);
};
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 14 }}>← Back</Text>
      </TouchableOpacity>
        <Text style={styles.title}>SwachhLens</Text>
        <Text style={styles.subtitle}>
        {isWorker ? "Field Worker Login" : isSignUp ? "Create an account" : "Log in to report waste"}
      </Text>

      {isSignUp && !isWorker &&(
        <TextInput
          style={styles.input}
          placeholder="Choose a username"
          placeholderTextColor={colors.mist}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="none"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.mist}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.mist}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isSignUp ? "Sign Up" : "Log In"}</Text>
        )}
      </TouchableOpacity>

{!isWorker && (
  <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
    <Text style={styles.switchText}>
      {isSignUp ? "Already have an account? Log in" : "New here? Sign up"}
    </Text>
  </TouchableOpacity>
)}
{isWorker && (
  <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 12, textAlign: "center", marginTop: 20 }}>
    Worker accounts are created by your municipal office.
  </Text>
)}    </View>
    </TouchableWithoutFeedback>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: colors.paper,
    fontSize: 36,
    fontFamily: fonts.display,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.mist,
    fontFamily: fonts.body,
    fontSize: 14,
    marginBottom: 32,
  },
  input: {
    backgroundColor: colors.slate,
    color: colors.paper,
    fontFamily: fonts.body,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.mint,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: colors.ink,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },
  switchText: {
    color: colors.mint,
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 20,
  },
});