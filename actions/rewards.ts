"use server"

import { createClient } from "@/lib/supabase/server"

export async function getRewards(walletAddress: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("rewards")
      .select("rewards_collected")
      .eq("wallet_address", walletAddress)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" error
      console.error("Error fetching rewards:", error)
      return { success: false, rewards: 0 }
    }

    return { success: true, rewards: data?.rewards_collected || 0 }
  } catch (error) {
    console.error("Error in getRewards:", error)
    return { success: false, rewards: 0 }
  }
}

export async function updateRewards(walletAddress: string, rewardsToAdd: number) {
  try {
    const supabase = await createClient()

    // First, try to get existing rewards
    const { data: existing } = await supabase
      .from("rewards")
      .select("rewards_collected")
      .eq("wallet_address", walletAddress)
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from("rewards")
        .update({
          rewards_collected: existing.rewards_collected + rewardsToAdd,
          last_updated: new Date().toISOString(),
        })
        .eq("wallet_address", walletAddress)

      if (error) {
        console.error("Error updating rewards:", error)
        return { success: false }
      }
    } else {
      // Insert new record
      const { error } = await supabase.from("rewards").insert({
        wallet_address: walletAddress,
        rewards_collected: rewardsToAdd,
      })

      if (error) {
        console.error("Error inserting rewards:", error)
        return { success: false }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateRewards:", error)
    return { success: false }
  }
}
