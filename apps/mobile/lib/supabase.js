import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vumthonyqjexzhfijjni.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bXRob255cWpleHpoZmlqam5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODc0NjUsImV4cCI6MjEwMTM2MzQ2NX0.4WkaZBYWNjwNNA2S1gYndtwYYM7-FJ7Nf91kdzg16js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});