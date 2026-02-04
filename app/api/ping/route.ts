import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  await supabase.from("question").select("id").limit(1);
  return new Response("ok");
}