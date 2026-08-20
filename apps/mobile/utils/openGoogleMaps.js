import { Alert, Linking } from "react-native";

export const openGoogleMaps = async (stop) => {
  const hasCoordinates =
    stop?.latitude !== undefined &&
    stop?.longitude !== undefined &&
    stop?.latitude !== null &&
    stop?.longitude !== null;

  const destination = hasCoordinates
    ? `${stop.latitude},${stop.longitude}`
    : stop?.address;

  if (!destination) {
    Alert.alert(
      "Location unavailable",
      "This stop does not have a location."
    );
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}&travelmode=driving`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error("Google Maps error:", error);

    Alert.alert(
      "Could not open Google Maps",
      "Please make sure Google Maps is installed."
    );
  }
};