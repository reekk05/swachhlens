import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colors, fonts } from "../theme";
import { API_URL } from "../config";

export default function WorkerProfileTab({ session }) {
  const [profile, setProfile] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("staff_profiles")
      .select("full_name, role, ward")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

const handleChangePassword = async () => {
  if (newPassword.length < 6) {
    Alert.alert("Password must be at least 6 characters.");
    return;
  }

  if (newPassword !== confirmPassword) {
    Alert.alert("Passwords don't match.");
    return;
  }

  try {
    setLoading(true);

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    const accessToken = currentSession?.access_token;

    if (!accessToken) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }

    const response = await fetch(`${API_URL}/worker/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        new_password: newPassword,
      }),
    });

    if (response.ok) {
      Alert.alert("Password updated");

      setShowChangePassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const errorText = await response.text();
      console.log("Change password error:", errorText);

      Alert.alert("Something went wrong", "Please try again.");
    }
  } catch (error) {
    console.error("Change password request failed:", error);
    Alert.alert(
      "Connection error",
      "Could not connect to the server. Please try again."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: 24, paddingTop: 10 }}>
        <View style={{ width: 80, height: 80, borderRadius: 100, backgroundColor: colors.slate, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
          <Feather name="truck" size={32} color="#4FB0E8" />
        </View>
        <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 22 }}>
          {profile?.full_name || "Field Worker"}
        </Text>
        <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginTop: 2, textTransform: "capitalize" }}>
          {profile?.role?.replace(/_/g, " ") || "Field Officer"}
        </Text>
      </View>

      <View style={{ backgroundColor: colors.slate, borderRadius: 12, overflow: "hidden" }}>
        <TouchableOpacity onPress={() => setShowChangePassword(true)}
          style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2A303B" }}
        >
          <Feather name="lock" size={18} color={colors.mist} />
          <Text style={{ color: colors.paper, fontFamily: fonts.body, fontSize: 14, marginLeft: 12 }}>Change Password</Text>
        </TouchableOpacity>

        {showChangePassword && (
  <View
    style={{
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#2A303B",
    }}
  >
    <TextInput
      placeholder="New password"
      placeholderTextColor={colors.mist}
      value={newPassword}
      onChangeText={setNewPassword}
      secureTextEntry
      style={{
        backgroundColor: colors.ink,
        color: colors.paper,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        fontFamily: fonts.body,
      }}
    />

    <TextInput
      placeholder="Confirm new password"
      placeholderTextColor={colors.mist}
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      secureTextEntry
      style={{
        backgroundColor: colors.ink,
        color: colors.paper,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontFamily: fonts.body,
      }}
    />

    <TouchableOpacity
      onPress={handleChangePassword}
      disabled={loading}
      style={{
        backgroundColor: colors.mint,
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Text
          style={{
            color: colors.ink,
            fontFamily: fonts.body,
            fontSize: 14,
          }}
        >
          Update Password
        </Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity
      onPress={() => {
        setShowChangePassword(false);
        setNewPassword("");
        setConfirmPassword("");
      }}
      disabled={loading}
      style={{
        padding: 8,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: colors.mist,
          fontFamily: fonts.body,
          fontSize: 13,
        }}
      >
        Cancel
      </Text>
    </TouchableOpacity>
  </View>
)}
        <TouchableOpacity
          onPress={() => supabase.auth.signOut()}
          style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
        >
          <Feather name="log-out" size={18} color={colors.signal} />
          <Text style={{ color: colors.signal, fontFamily: fonts.body, fontSize: 14, marginLeft: 12 }}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}