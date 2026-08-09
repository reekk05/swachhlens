import { View, Text, TouchableOpacity } from "react-native";
import { colors, fonts } from "../theme";
import { Feather } from "@expo/vector-icons";

const TABS = [
  { key: "home", label: "Home", icon: "home" },
  { key: "activity", label: "Activity", icon: "activity" },
  { key: "profile", label: "Profile", icon: "user" },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.slate,
        borderTopWidth: 1,
        borderTopColor: "#2A303B",
        paddingTop: 10,
        paddingBottom: 24,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Feather name={tab.icon} size={22} color={isActive ? colors.mint : colors.mist} />
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 11,
                color: isActive ? colors.mint : colors.mist,
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={{ width: 4, height: 4, borderRadius: 100, backgroundColor: colors.mint, marginTop: 3 }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}