import { View, Text } from "react-native";
import { colors, fonts } from "../theme";

export default function HistoryTab({ reports }) {
  if (!reports || reports.length === 0) {
    return (
      <Text style={{ color: colors.mist, fontFamily: fonts.body, marginTop: 10 }}>
        No reports yet. Your submitted reports will appear here.
      </Text>
    );
  }

  return (
    <View>
      {reports.map((r) => (
        <View
          key={r.id}
          style={{ backgroundColor: colors.slate, padding: 16, borderRadius: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: colors.marigold }}
        >
          <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, textTransform: "capitalize" }}>
            {r.category ? r.category.replace(/_/g, " ") : "Pending classification"}
          </Text>
          <Text style={{ color: colors.marigold, marginTop: 6, textTransform: "uppercase", fontSize: 11, fontFamily: fonts.bodyMedium, letterSpacing: 0.5 }}>
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