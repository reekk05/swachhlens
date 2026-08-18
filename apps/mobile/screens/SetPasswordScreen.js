import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from "react-native";
import { supabase } from "../lib/supabase";
import { API_URL } from "../config";
import { colors, fonts } from "../theme";

export default function SetPasswordScreen({ onDone }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const response = await fetch(`${API_URL}/worker/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    setLoading(false);

    if (response.ok) {
      onDone();
    } else {
      Alert.alert("Something went wrong", "Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: "center", paddingHorizontal: 24 }}>
        <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 32, marginBottom: 4 }}>
          Set Your Password
        </Text>
        <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 14, marginBottom: 32 }}>
          Replace the temporary password given by your office with one only you know.
        </Text>

        <TextInput
          style={{ backgroundColor: colors.slate, color: colors.paper, fontFamily: fonts.body, borderRadius: 8, padding: 14, marginBottom: 12 }}
          placeholder="New password"
          placeholderTextColor={colors.mist}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          style={{ backgroundColor: colors.slate, color: colors.paper, fontFamily: fonts.body, borderRadius: 8, padding: 14, marginBottom: 12 }}
          placeholder="Confirm password"
          placeholderTextColor={colors.mist}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: colors.mint, borderRadius: 8, paddingVertical: 16, alignItems: "center", marginTop: 10, opacity: loading ? 0.5 : 1 }}
        >
          {loading ? <ActivityIndicator color={colors.ink} /> : <Text style={{ color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16 }}>Set Password</Text>}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}