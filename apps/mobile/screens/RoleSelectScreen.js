import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

export default function RoleSelectScreen({ onSelect }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: "center", paddingHorizontal: 24 }}>
      <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 36, marginBottom: 8, textAlign: "center" }}>
        SwachhLens
      </Text>
      <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 14, marginBottom: 40, textAlign: "center" }}>
        Continue as
      </Text>

      <TouchableOpacity
        onPress={() => onSelect("citizen")}
        style={{ backgroundColor: colors.slate, borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center" }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 100, backgroundColor: colors.mint, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
          <Feather name="camera" size={24} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 17 }}>Citizen</Text>
          <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginTop: 2 }}>Report waste in your area</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mist} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onSelect("worker")}
        style={{ backgroundColor: colors.slate, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center" }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 100, backgroundColor: "#4FB0E8", justifyContent: "center", alignItems: "center", marginRight: 16 }}>
          <Feather name="truck" size={24} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 17 }}>Field Worker</Text>
          <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 13, marginTop: 2 }}>Manage dispatched cleanups</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mist} />
      </TouchableOpacity>
    </View>
  );
}