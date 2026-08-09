import { View, Text, ScrollView } from "react-native";
import { colors, fonts } from "../theme";

const STAT_CARDS = [
  { key: "total_reports", label: "Reports Filed", icon: "📋", suffix: "" },
  { key: "total_weight_kg", label: "Waste Flagged", icon: "⚖️", suffix: " kg" },
  { key: "resolved_count", label: "Resolved", icon: "✅", suffix: "" },
];

export default function ImpactTab({ stats }) {
  if (!stats) {
    return (
      <Text style={{ color: colors.mist, fontFamily: fonts.body, marginTop: 10 }}>
        Loading your impact...
      </Text>
    );
  }

  return (
    <View>
      <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, marginBottom: 12 }}>
        Your contribution so far
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {STAT_CARDS.map((card) => {
          const rawValue = stats[card.key];
          const value = typeof rawValue === "number" ? (Number.isInteger(rawValue) ? rawValue : rawValue.toFixed(1)) : rawValue;
          return (
            <View
              key={card.key}
              style={{
                backgroundColor: colors.slate,
                borderRadius: 8,
                padding: 18,
                marginRight: 12,
                width: 150,
                borderTopWidth: 3,
                borderTopColor: colors.mint,
              }}
            >
              <Text style={{ fontSize: 22, marginBottom: 10 }}>{card.icon}</Text>
              <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 32 }}>
                {value}{card.suffix}
              </Text>
              <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 12, marginTop: 4 }}>
                {card.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}