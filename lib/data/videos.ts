import "server-only";
import { createClient } from "@/lib/supabase/server";

export type VideoSubmission = {
  id: number;
  week: number;
  url: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
};

export async function getVideos(userId: string): Promise<VideoSubmission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("video_submissions")
    .select("id, week, url, status, submitted_at")
    .eq("user_id", userId)
    .order("week");
  return (data ?? []) as VideoSubmission[];
}
