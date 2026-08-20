import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { supabase } from "../lib/supabase";
import { API_URL } from "../config";
import { colors, fonts } from "../theme";
import * as ImagePicker from "expo-image-picker";
import { Alert, RefreshControl, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import WorkerProfileTab from "./WorkerProfileTab";
import { openGoogleMaps } from "../utils/openGoogleMaps";

export default function WorkerApp({ session }) {
  const [locationReady, setLocationReady] = useState(false);
  const [stops, setStops] = useState([]);
  const [viewMode, setViewMode] = useState("optimized");
  const [loadingStops, setLoadingStops] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workerTab, setWorkerTab] = useState("stops");

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStops();
    setRefreshing(false);
  };

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

if (workerTab === "profile") {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <View style={{ flex: 1, paddingTop: 70, paddingHorizontal: 20 }}>
        <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 28, marginBottom: 20 }}>Profile</Text>
        <WorkerProfileTab session={session} />
      </View>
      <View style={{ flexDirection: "row", backgroundColor: colors.slate, borderTopWidth: 1, borderTopColor: "#2A303B", paddingTop: 10, paddingBottom: 24 }}>
        <TouchableOpacity onPress={() => setWorkerTab("stops")} style={{ flex: 1, alignItems: "center" }}>
          <Feather name="list" size={22} color={colors.mist} />
          <Text style={{ color: colors.mist, fontFamily: fonts.bodyMedium, fontSize: 11, marginTop: 4 }}>Stops</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setWorkerTab("profile")} style={{ flex: 1, alignItems: "center" }}>
          <Feather name="user" size={22} color={colors.mint} />
          <Text style={{ color: colors.mint, fontFamily: fonts.bodyMedium, fontSize: 11, marginTop: 4 }}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

return (
  <View style={{ flex: 1, backgroundColor: colors.ink }}>
  <ScrollView
    style={{ paddingTop: 70, paddingHorizontal: 20 }}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.mint}
        title="Refreshing..."
        titleColor={colors.mist}
        colors={[colors.mint]}
      />
    }
  >
    <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 28, marginBottom: 20 }}>Field Worker</Text>
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

          {(() => {
            if (viewMode === "manual") {
              const allStops = stops.manual_order || [];
              if (allStops.length === 0) {
                return <Text style={{ color: colors.mist, fontFamily: fonts.body }}>No stops assigned right now. Great work!</Text>;
              }
              return (
                <View>
                  {allStops.map((stop) => (
                    <View key={stop.id} style={{ backgroundColor: colors.slate, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                      <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, textTransform: "capitalize" }}>
                        {stop.category?.replace(/_/g, " ")}
                      </Text>
                      <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>
                        {stop.address || "Location pending"}
                      </Text>
<TouchableOpacity
  onPress={() => openGoogleMaps(stop)}
  style={{
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  }}
>
  <Text
    style={{
      color: colors.mint,
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
    }}
  >
    Get Directions — Google Maps
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => completeStop(stop.id)}
  style={{
    backgroundColor: colors.mint,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  }}
>
  <Text
    style={{
      color: colors.ink,
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
    }}
  >
    Mark Complete — Upload Photo
  </Text>
</TouchableOpacity>                    </View>
                  ))}
                </View>
              );
            }

            const activeList = stops.stops || [];
            if (activeList.length === 0) {
              return <Text style={{ color: colors.mist, fontFamily: fonts.body }}>No stops assigned right now. Great work!</Text>;
            }

            const currentStop = activeList[0];
            const remaining = activeList.length - 1;

            return (
              <View>
                <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginBottom: 12 }}>
                  {remaining > 0 ? `${remaining} more after this` : "Last stop"}
                </Text>
                <View style={{ backgroundColor: colors.slate, borderRadius: 12, padding: 16 }}>
                  <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, textTransform: "capitalize" }}>
                    {currentStop.category?.replace(/_/g, " ")}
                  </Text>
                  <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginTop: 4 }}>
                    {currentStop.address || "Location pending"}
                  </Text>
                  {currentStop.distance_from_previous_m !== undefined && (
                    <Text style={{ color: colors.mint, fontFamily: fonts.body, fontSize: 12, marginTop: 4 }}>
                      {currentStop.distance_from_previous_m}m away
                    </Text>
                  )}
<TouchableOpacity
  onPress={() => openGoogleMaps(currentStop)}
  style={{
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 12,
  }}
>
  <Text
    style={{
      color: colors.mint,
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
    }}
  >
    Get Directions — Google Maps
  </Text>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => completeStop(currentStop.id)}
  style={{
    backgroundColor: colors.mint,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  }}
>
  <Text
    style={{
      color: colors.ink,
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
    }}
  >
    Mark Complete — Upload Photo
  </Text>
</TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </>
      )}
    </ScrollView>

    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.slate,
        borderTopWidth: 1,
        borderTopColor: "#2A303B",
        paddingTop: 10,
        paddingBottom: 24,
      }}
    >
      <TouchableOpacity
        onPress={() => setWorkerTab("stops")}
        style={{ flex: 1, alignItems: "center" }}
      >
        <Feather name="list" size={22} color={colors.mint} />
        <Text
          style={{
            color: colors.mint,
            fontFamily: fonts.bodyMedium,
            fontSize: 11,
            marginTop: 4,
          }}
        >
          Stops
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setWorkerTab("profile")}
        style={{ flex: 1, alignItems: "center" }}
      >
        <Feather name="user" size={22} color={colors.mist} />
        <Text
          style={{
            color: colors.mist,
            fontFamily: fonts.bodyMedium,
            fontSize: 11,
            marginTop: 4,
          }}
        >
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  </View>
  );
}