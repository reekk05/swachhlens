import { View, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colors, fonts } from "../theme";

export default function ProfileTab({ session }) {
  return (
    <View>
      <View style={{ alignItems: "center", marginBottom: 24, paddingTop: 10 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 100,
            backgroundColor: colors.slate,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Feather name="user" size={30} color={colors.mint} />
        </View>
        <Text style={{ color: colors.paper, fontFamily: fonts.bodyMedium, fontSize: 16 }}>
          {session?.user?.email}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => supabase.auth.signOut()}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.slate,
          borderRadius: 10,
          padding: 16,
        }}
      >
        <Feather name="log-out" size={18} color={colors.signal} />
        <Text style={{ color: colors.signal, fontFamily: fonts.bodyMedium, fontSize: 14, marginLeft: 10 }}>
          Log out
        </Text>
      </TouchableOpacity>
    </View>
  );
}