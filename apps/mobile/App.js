import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthScreen from "./screens/AuthScreen";
import { useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

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

  useEffect(() => {
      if (session) {
        fetchStats();
      }
    }, [session]);

  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState("report");
  const [myReports, setMyReports] = useState([]);
  const [stats, setStats] = useState(null);

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

    const fetchMyReports = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;

      const response = await fetch(`${API_URL}/complaints/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return [];
    };

    const fetchStats = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;

      try {
        const response = await fetch(`${API_URL}/complaints/me/stats`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (e) {
      }
    };
  
  const openMyReports = async () => {
    const reports = await fetchMyReports();
    setMyReports(reports);
    setView("history");
  };
  if (view === "history") {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setView("report")} style={{ marginBottom: 16 }}>
          <Text style={{ color: "#6fcf97" }}>← Back to Report</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Reports</Text>
        {myReports.map((r) => (
          <View key={r.id} style={{ backgroundColor: "#132618", padding: 14, borderRadius: 12, marginBottom: 10 }}>
            <Text style={{ color: "#fff", fontWeight: "600", textTransform: "capitalize" }}>
              {r.category ? r.category.replace(/_/g, " ") : "Pending classification"}
            </Text>
            <Text style={{ color: "#6fcf97", marginTop: 4, textTransform: "uppercase", fontSize: 12 }}>
              {r.status}
            </Text>
            <Text style={{ color: "#888", marginTop: 4, fontSize: 12 }}>
              {new Date(r.reported_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </Text>
          </View>
        ))}
      </View>
    );
  }


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <Text style={styles.title}>Report Waste</Text>
      <TouchableOpacity onPress={openMyReports} style={{ marginBottom: 16 }}>
        <Text style={{ color: "#6fcf97" }}>View My Reports →</Text>
      </TouchableOpacity>

      {stats && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#132618", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#6fcf97", fontSize: 20, fontWeight: "700" }}>{stats.total_reports}</Text>
            <Text style={{ color: "#888", fontSize: 12 }}>Reports</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#6fcf97", fontSize: 20, fontWeight: "700" }}>{stats.total_weight_kg.toFixed(1)} kg</Text>
            <Text style={{ color: "#888", fontSize: 12 }}>Waste flagged</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#6fcf97", fontSize: 20, fontWeight: "700" }}>{stats.resolved_count}</Text>
            <Text style={{ color: "#888", fontSize: 12 }}>Resolved</Text>
          </View>
        </View>
      )}
      
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
    </TouchableWithoutFeedback>
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