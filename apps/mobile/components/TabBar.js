import { View, Text, TouchableOpacity } from "react-native";
import { colors, fonts } from "../theme";

const TABS = [
  { key: "report", label: "Report" },
  { key: "history", label: "My Reports" },
  { key: "impact", label: "Impact" },
];

export default function TabBar({ activeTab, onChange }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.slate, borderRadius: 100, padding: 4, marginBottom: 20 }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 100,
              alignItems: "center",
              backgroundColor: isActive ? colors.marigold : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyMedium,
                fontSize: 13,
                color: isActive ? colors.ink : colors.mist,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}