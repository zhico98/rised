import { sql } from "@vercel/postgres"

export async function getLeaderboardScores() {
  try {
    const { rows } = await sql`
      SELECT player_name, score
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 10;
    `
    return rows
  } catch (error) {
    console.error("Error fetching leaderboard scores:", error)
    return []
  }
}
