"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function saveScore(formData: FormData) {
  const playerName = formData.get("playerName") as string
  const score = Number.parseInt(formData.get("score") as string)

  if (!playerName || isNaN(score)) {
    return { success: false, message: "Invalid player name or score." }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase.from("leaderboard").insert({
      player_name: playerName,
      score: score,
    })

    if (error) {
      console.error("Error saving score:", error)
      return { success: false, message: "Failed to save score." }
    }

    revalidatePath("/")
    return { success: true, message: "Score saved successfully!" }
  } catch (error) {
    console.error("Error saving score:", error)
    return { success: false, message: "Failed to save score." }
  }
}

export async function getLeaderboardScores() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("leaderboard")
      .select("player_name, score")
      .order("score", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching leaderboard scores:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching leaderboard scores:", error)
    return []
  }
}
