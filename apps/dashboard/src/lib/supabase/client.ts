import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    "https://vumthonyqjexzhfijjni.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bXRob255cWpleHpoZmlqam5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODc0NjUsImV4cCI6MjEwMTM2MzQ2NX0.4WkaZBYWNjwNNA2S1gYndtwYYM7-FJ7Nf91kdzg16js"
  );
}