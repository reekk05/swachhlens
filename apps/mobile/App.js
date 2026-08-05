import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthScreen from "./screens/AuthScreen";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { API_URL } from "./config";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission is needed to report waste.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
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
        } catch (e) {
        }

      const formData = new FormData();
      formData.append("photo", {
        uri: photo.uri,
        name: "photo.jpg",
        type: "image/jpeg",
      });
      formData.append("latitude", String(location.coords.latitude));
      formData.append("longitude", String(location.coords.longitude));
      formData.append("description", description);
      formData.append("address_text", addressText);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;

      const response = await fetch(`${API_URL}/complaints/`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${accessToken}`,
      },
    });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      Alert.alert("Report submitted!", data.message, [
        {
          text: "OK",
          onPress: () => {
            setPhoto(null);
            setDescription("");
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Submission failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };
  if (!session) {
    return <AuthScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Waste</Text>
      
      <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ position: "absolute", top: 60, right: 20 }}>
        <Text style={{ color: "#6fcf97" }}>Log out</Text>
      </TouchableOpacity>

      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.preview} />
      ) : (
        <TouchableOpacity style={styles.cameraBox} onPress={takePhoto}>
          <Text style={styles.cameraBoxText}>Tap to take a photo</Text>
        </TouchableOpacity>
      )}

      {photo && (
        <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
          <Text style={styles.retakeButtonText}>Retake photo</Text>
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        placeholder="Add a description (optional)"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={submitReport}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1b0f",
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  cameraBox: {
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2e7d4f",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#132618",
  },
  cameraBoxText: {
    color: "#6fcf97",
    fontSize: 16,
  },
  preview: {
    height: 280,
    borderRadius: 16,
    marginBottom: 10,
  },
  retakeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  retakeButtonText: {
    color: "#6fcf97",
  },
  input: {
    backgroundColor: "#132618",
    color: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#2e7d4f",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});