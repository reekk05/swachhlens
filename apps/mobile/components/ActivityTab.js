import { View, Text, ScrollView } from "react-native";
import { colors, fonts, categoryColors, categoryIcons } from "../theme";

const STAT_CARDS = [
  { key: "total_reports", label: "Reports Filed", icon: "📋", suffix: "" },
  { key: "total_weight_kg", label: "Waste Flagged", icon: "⚖️", suffix: " kg" },
  { key: "resolved_count", label: "Resolved", icon: "✅", suffix: "" },
];

export default function ActivityTab({ stats, reports }) {
  return (
    <View>
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {STAT_CARDS.map((card) => {
            const rawValue = stats[card.key];
            const value = typeof rawValue === "number" ? (Number.isInteger(rawValue) ? rawValue : rawValue.toFixed(1)) : rawValue;
            return (
              <View
                key={card.key}
                style={{
                  backgroundColor: colors.slate,
                  borderRadius: 12,
                  padding: 18,
                  marginRight: 12,
                  width: 150,
                  borderTopWidth: 3,
                  borderTopColor: colors.mint,
                }}
              >
                <Text style={{ fontSize: 20, marginBottom: 10 }}>{card.icon}</Text>
                <Text style={{ color: colors.paper, fontFamily: fonts.display, fontSize: 30 }}>
                  {value}{card.suffix}
                </Text>
                <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 12, marginTop: 4 }}>
                  {card.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, marginBottom: 12 }}>
        Your Reports
      </Text>

      {(!reports || reports.length === 0) && (
        <Text style={{ color: colors.mist, fontFamily: fonts.body }}>
          No reports yet. Your submitted reports will appear here.
        </Text>
      )}

      {reports && reports.map((r) => (
        <View
          key={r.id}
          style={{ backgroundColor: colors.slate, padding: 16, borderRadius: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: categoryColors[r.category] || colors.mist }}
        >
          <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, textTransform: "capitalize" }}>
            {r.category ? `${categoryIcons[r.category] || ""} ${r.category.replace(/_/g, " ")}` : "Pending classification"}
          </Text>
          <Text style={{ color: colors.mint, marginTop: 6, textTransform: "uppercase", fontSize: 11, fontFamily: fonts.bodyMedium, letterSpacing: 0.5 }}>
            {r.status}
          </Text>
          <Text style={{ color: colors.mist, marginTop: 4, fontSize: 12, fontFamily: fonts.body }}>
            {new Date(r.reported_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </Text>
        </View>
      ))}
    </View>
  );
}