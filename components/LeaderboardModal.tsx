"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getLeaderboardScores } from "@/actions/leaderboard"

interface LeaderboardModalProps {
  onClose: () => void
  isMobile: boolean
}

interface ScoreEntry {
  player_name: string
  score: number
}

export default function LeaderboardModal({ onClose, isMobile }: LeaderboardModalProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true)
        const fetchedScores = await getLeaderboardScores()
        setScores(fetchedScores)
      } catch (err) {
        console.error("Failed to fetch leaderboard scores:", err)
        setError("Failed to load leaderboard. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchScores()
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
      <div
        className={`bg-black/90 ${isMobile ? "p-4 mx-2" : "p-8 mx-4"} rounded-lg border-4 border-sky-500 ${isMobile ? "w-full max-w-sm" : "max-w-md w-full"} relative`}
      >
        <h2
          className={`${isMobile ? "text-xl" : "text-3xl"} font-bold mb-6 text-sky-500 text-center`}
          style={{
            fontFamily: '"AtariClassic", monospace',
            textShadow: "2px 2px 0px #000000",
          }}
        >
          LEADERBOARD
        </h2>
        {loading ? (
          <p className="text-white text-center" style={{ fontFamily: '"AtariClassic", monospace' }}>
            Loading scores...
          </p>
        ) : error ? (
          <p className="text-sky-500 text-center" style={{ fontFamily: '"AtariClassic", monospace' }}>
            {error}
          </p>
        ) : scores.length === 0 ? (
          <p className="text-white text-center" style={{ fontFamily: '"AtariClassic", monospace' }}>
            No scores yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2 mb-6">
            {scores.map((entry, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-gray-800 p-3 rounded-md border border-gray-700"
              >
                <span className="text-white font-bold" style={{ fontFamily: '"AtariClassic", monospace' }}>
                  {index + 1}. {entry.player_name}
                </span>
                <span className="text-green-400" style={{ fontFamily: '"AtariClassic", monospace' }}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="text-center">
          <Button
            onClick={onClose}
            className={`bg-sky-500 hover:bg-sky-600 text-black font-bold ${isMobile ? "px-4 py-2" : "px-6 py-3"}`}
            style={{ fontFamily: '"AtariClassic", monospace' }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
