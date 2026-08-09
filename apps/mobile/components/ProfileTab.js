import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colors, fonts } from "../theme";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { API_URL } from "../config";

export default function ProfileTab({ session }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("citizen_profiles")
      .select("display_name, avatar_url")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

const pickAvatar = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.5,
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
  });

  if (result.canceled) return;

  const photo = result.assets[0];
  const fileExt = photo.uri.split(".").pop();
  const fileName = `${session.user.id}.${fileExt}`;

  const base64 = photo.base64;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, decode(base64), { upsert: true, contentType: `image/${fileExt}` });

  if (uploadError) {
    Alert.alert("Upload failed", uploadError.message);
    return;
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
  const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("citizen_profiles")
    .update({ avatar_url: cacheBustedUrl })
    .eq("id", session.user.id);

  if (updateError) {
    Alert.alert("Profile update failed", updateError.message);
    return;
  }

  setProfile((prev) => ({ ...prev, avatar_url: cacheBustedUrl }));
};

const deleteAccount = () => {
  Alert.alert(
    "Delete Account",
    "This permanently deletes your account and profile. Your past reports stay on record for municipal purposes but will no longer be linked to you. This cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          const accessToken = currentSession?.access_token;

          const response = await fetch(`${API_URL}/complaints/me/account`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (response.ok) {
            await supabase.auth.signOut();
          } else {
            Alert.alert("Something went wrong", "Please try again.");
          }
        },
      },
    ]
  );
};

  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: 24, paddingTop: 10 }}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 100, marginBottom: 12 }} />
        ) : (
          <View style={{ width: 80, height: 80, borderRadius: 100, backgroundColor: colors.slate, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <Feather name="user" size={32} color={colors.mint} />
          </View>
        )}
        <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 22 }}>
          {profile?.display_name || "Citizen"}
        </Text>
      </View>
      <View style={{ backgroundColor: colors.slate, borderRadius: 12, overflow: "hidden" }}>
        <TouchableOpacity
          onPress={pickAvatar}
          style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2A303B" }}
        >
          <Feather name="edit-3" size={18} color={colors.mist} />
          <Text style={{ color: colors.paper, fontFamily: fonts.body, fontSize: 14, marginLeft: 12 }}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2A303B" }}
        >
          <Feather name="settings" size={18} color={colors.mist} />
          <Text style={{ color: colors.paper, fontFamily: fonts.body, fontSize: 14, marginLeft: 12 }}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={deleteAccount}
          style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#2A303B" }}
        >
          <Feather name="trash-2" size={18} color={colors.signal} />
          <Text style={{ color: colors.signal, fontFamily: fonts.body, fontSize: 14, marginLeft: 12 }}>Delete Account</Text>
        </TouchableOpacity>

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