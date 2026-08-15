import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { API_URL } from "../config";
import { colors, fonts } from "../theme";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export default function WorkerApp({ session }) {
  const [locationReady, setLocationReady] = useState(false);
  const [stops, setStops] = useState([]);
  const [viewMode, setViewMode] = useState("optimized");
  const [loadingStops, setLoadingStops] = useState(true);  
  
  useEffect(() => {
    const updateLocation = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;

      const position = await Location.getCurrentPositionAsync({});
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const accessToken = currentSession?.access_token;

      await fetch(`${API_URL}/worker/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      setLocationReady(true);
    };

    updateLocation();
    const interval = setInterval(updateLocation, 60000);
    return () => clearInterval(interval);
    }, []);

    const fetchStops = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const accessToken = currentSession?.access_token;

    const response = await fetch(`${API_URL}/worker/my-stops`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      setStops(data);
    }
    setLoadingStops(false);
  };

const completeStop = async (stopId) => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return;

  const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
  if (result.canceled) return;

  const photo = result.assets[0];
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  const accessToken = currentSession?.access_token;

  const formData = new FormData();
  formData.append("photo", {
    uri: photo.uri,
    name: "after.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(`${API_URL}/worker/complaints/${stopId}/complete`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    Alert.alert("Submitted", "Waiting for office confirmation.");
    fetchStops();
  } else {
    Alert.alert("Failed", "Please try again.");
  }
};

  useEffect(() => {
    if (locationReady) {
      fetchStops();
    }
  }, [locationReady]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, paddingTop: 70, paddingHorizontal: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 28 }}>Field Worker</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13 }}>Log out</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13 }}>
        {locationReady ? "📍 Location active" : "Getting your location..."}
      </Text>
      {loadingStops ? (
  <Text style={{ color: colors.mist, fontFamily: fonts.body, marginTop: 20 }}>Loading stops...</Text>
) : (
  <>
    <View style={{ flexDirection: "row", gap: 8, marginTop: 20, marginBottom: 16 }}>
      <TouchableOpacity
        onPress={() => setViewMode("optimized")}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 100,
          alignItems: "center",
          backgroundColor: viewMode === "optimized" ? colors.mint : colors.slate,
        }}
      >
        <Text style={{ color: viewMode === "optimized" ? colors.ink : colors.mist, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
          Optimized Route
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setViewMode("manual")}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 100,
          alignItems: "center",
          backgroundColor: viewMode === "manual" ? colors.mint : colors.slate,
        }}
      >
        <Text style={{ color: viewMode === "manual" ? colors.ink : colors.mist, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
          Choose Manually
        </Text>
      </TouchableOpacity>
    </View>

    {(viewMode === "optimized" ? stops.stops : stops.manual_order || []).length === 0 && (
      <Text style={{ color: colors.mist, fontFamily: fonts.body }}>No stops assigned right now.</Text>
    )}

    {(viewMode === "optimized" ? stops.stops : stops.manual_order || []).map((stop, i) => (
      <View key={stop.id} style={{ backgroundColor: colors.slate, borderRadius: 12, padding: 16, marginBottom: 10 }}>
        <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, textTransform: "capitalize" }}>
          {viewMode === "optimized" ? `${i + 1}. ` : ""}{stop.category?.replace(/_/g, " ")}
        </Text>
        <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>
          {stop.address || "Location pending"}
        </Text>
        {stop.distance_from_previous_m !== undefined && (
          <Text style={{ color: colors.mint, fontFamily: fonts.body, fontSize: 12, marginTop: 4 }}>
            {stop.distance_from_previous_m}m from previous
          </Text>
        )}

        <TouchableOpacity
          onPress={() => completeStop(stop.id)}
          style={{ backgroundColor: colors.mint, borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 12 }}
        >
          <Text style={{ color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 13 }}>Mark Complete — Upload Photo</Text>
        </TouchableOpacity>
      </View>
    ))}
  </>
)}
    </View>
  );
}