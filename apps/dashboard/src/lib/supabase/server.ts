import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    "https://vumthonyqjexzhfijjni.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bXRob255cWpleHpoZmlqam5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODc0NjUsImV4cCI6MjEwMTM2MzQ2NX0.4WkaZBYWNjwNNA2S1gYndtwYYM7-FJ7Nf91kdzg16js",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
          }
        },
      },
    }
  );
}