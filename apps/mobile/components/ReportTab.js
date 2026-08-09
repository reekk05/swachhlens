import { useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { API_URL } from "../config";
import { colors, fonts } from "../theme";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

export default function ReportTab() {
  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission is needed to report waste.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
  };

  const submitReport = async () => {
    if (!photo) {
      Alert.alert("Please take a photo first.");
      return;
    }
    setSubmitting(true);
    try {
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (!locationPermission.granted) {
        Alert.alert("Location permission is needed to submit a report.");
        setSubmitting(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      let addressText = "";
      try {
        const geocoded = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocoded.length > 0) {
          const a = geocoded[0];
          addressText = [a.name, a.street, a.city, a.region].filter(Boolean).join(", ");
        }
      } catch (e) {}

      const formData = new FormData();
      formData.append("photo", { uri: photo.uri, name: "photo.jpg", type: "image/jpeg" });
      formData.append("latitude", String(location.coords.latitude));
      formData.append("longitude", String(location.coords.longitude));
      formData.append("description", description);
      formData.append("address_text", addressText);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;

      const response = await fetch(`${API_URL}/complaints/`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();

      Alert.alert("Report submitted!", data.message, [
        { text: "OK", onPress: () => { setPhoto(null); setDescription(""); } },
      ]);
    } catch (error) {
      Alert.alert("Submission failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View>
      {photo ? (
        <View>
          <Image source={{ uri: photo.uri }} style={{ height: 220, borderRadius: 8 }} />
          <TouchableOpacity
            onPress={takePhoto}
            style={{ position: "absolute", top: 10, right: 10, backgroundColor: colors.ink, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ color: colors.mint, fontFamily: fonts.bodyMedium, fontSize: 12 }}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={takePhoto}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.slate,
            borderRadius: 8,
            padding: 16,
            borderWidth: 1,
            borderColor: "#2A303B",
          }}
        >
          <View style={{ width: 48, height: 48, borderRadius: 100, backgroundColor: colors.mint, justifyContent: "center", alignItems: "center", marginRight: 14 }}>
            <Text style={{ fontSize: 20 }}>📷</Text>
          </View>
          <View>
            <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15 }}>Add a photo</Text>
            <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 12, marginTop: 2 }}>Tap to open camera</Text>
          </View>
        </TouchableOpacity>
      )}

      <TextInput
        style={{ backgroundColor: colors.slate, color: colors.paper, fontFamily: fonts.body, borderRadius: 8, padding: 14, marginTop: 16, minHeight: 60, textAlignVertical: "top" }}
        placeholder="Add a description (optional)"
        placeholderTextColor={colors.mist}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={{ backgroundColor: colors.mint, borderRadius: 8, paddingVertical: 16, alignItems: "center", marginTop: 20, opacity: submitting ? 0.5 : 1 }}
        onPress={submitReport}
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={{ color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16 }}>Submit Report</Text>}
      </TouchableOpacity>
    </View>
  </TouchableWithoutFeedback>
);
}