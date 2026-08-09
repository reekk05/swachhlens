import { useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthScreen from "./screens/AuthScreen";
import { useState } from "react";
import { Keyboard, TouchableWithoutFeedback } from "react-native";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { colors, fonts } from "./theme";
import TabBar from "./components/TabBar";
import ReportTab from "./components/ReportTab";
import HistoryTab from "./components/HistoryTab";
import ImpactTab from "./components/ImpactTab";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { API_URL } from "./config";

export default function App() {
  const [session, setSession] = useState(null);
  const [fontsLoaded] = useFonts({
  BebasNeue_400Regular,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
});
  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("report");  const [myReports, setMyReports] = useState([]);
  const [stats, setStats] = useState(null);

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
  
  useEffect(() => {
    if (session && activeTab === "history") {
      fetchMyReports().then(setMyReports);
    }
  }, [activeTab, session]);

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

if (!fontsLoaded) {
  return <View style={{ flex: 1, backgroundColor: colors.ink }} />;
}

if (!session) {
  return <AuthScreen />;
}

return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <Text style={styles.title}>SwachhLens</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ paddingTop: 14 }}>
          <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13 }}>Log out</Text>
        </TouchableOpacity>
      </View>

      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "report" && <ReportTab />}
      {activeTab === "history" && <HistoryTab reports={myReports} />}
      {activeTab === "impact" && <ImpactTab stats={stats} />}
    </ScrollView>
  </TouchableWithoutFeedback>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  title: {
    color: colors.paper,
    fontSize: 28,
    fontFamily: fonts.display,
    marginBottom: 20,
  },
  cameraBox: {
    height: 280,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.marigold,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.slate,
  },
  cameraBoxText: {
    color: colors.marigold,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  preview: {
    height: 280,
    borderRadius: 4,
    marginBottom: 10,
  },
  retakeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  retakeButtonText: {
    color: colors.marigold,
    fontFamily: fonts.body,
  },
  input: {
    backgroundColor: colors.slate,
    color: colors.paper,
    fontFamily: fonts.body,
    borderRadius: 4,
    padding: 14,
    marginTop: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: colors.marigold,
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.ink,
    fontSize: 16,
    fontFamily: fonts.bodyMedium,
  },
});