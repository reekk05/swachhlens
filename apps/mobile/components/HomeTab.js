import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { colors, fonts } from "../theme";
import { API_URL } from "../config";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function HomeTab({ onGoToReport }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/complaints/leaderboard`)
      .then((res) => res.json())
      .then(setLeaderboard)
      .catch(() => {});
  }, []);

  return (
    <View>
      <TouchableOpacity
        onPress={onGoToReport}
        style={{
          backgroundColor: colors.mint,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ color: colors.ink, fontFamily: fonts.display, fontSize: 22 }}>
            Spot some waste?
          </Text>
          <Text style={{ color: colors.ink, fontFamily: fonts.body, fontSize: 13, marginTop: 2, opacity: 0.8 }}>
            Report it in seconds
          </Text>
        </View>
        <Feather name="camera" size={28} color={colors.ink} />
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: colors.slate,
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.mint,
          borderStyle: "dashed",
        }}
      >
        <Text style={{ color: colors.mint, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
          🎁 Coming soon
        </Text>
        <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, marginTop: 4 }}>
          Monthly Top 3 win gift vouchers
        </Text>
        <Text style={{ color: colors.mist, fontFamily: fonts.body, fontSize: 12, marginTop: 2 }}>
          Keep reporting to climb the leaderboard
        </Text>
      </View>

      <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 15, marginBottom: 12 }}>
        Top Reporters
      </Text>

      {leaderboard.length === 0 && (
        <Text style={{ color: colors.mist, fontFamily: fonts.body }}>No data yet.</Text>
      )}

      {leaderboard.map((entry) => (
        <View
          key={entry.rank}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.slate,
            borderRadius: 10,
            padding: 14,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 18, width: 32 }}>
            {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
          </Text>
          <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 14, flex: 1 }}>
            {entry.display_name}
          </Text>
          <Text style={{ color: colors.mint, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
            {entry.total_weight_kg.toFixed(1)} kg
          </Text>
        </View>
      ))}
    </View>
  );
}