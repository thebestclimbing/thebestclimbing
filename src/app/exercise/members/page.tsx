import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MemberExerciseView } from "./MemberExerciseView";

export default async function ExerciseMembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/exercise/members");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "admin") redirect("/exercise");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name")
    .order("name");

  return <MemberExerciseView profiles={profiles ?? []} />;
}
