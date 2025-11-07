"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveScore } from "@/actions/leaderboard"

interface SaveScoreFormModalProps {
  onClose: () => void
  isMobile: boolean
  lastScore: number
  onSaveSuccess: () => void
}

export default function SaveScoreFormModal({ onClose, isMobile, lastScore, onSaveSuccess }: SaveScoreFormModalProps) {
  const [playerName, setPlayerName] = useState("")
  const [message, setMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsSaving(true)

    const formData = new FormData()
    formData.append("playerName", playerName)
    formData.append("score", lastScore.toString())

    const result = await saveScore(formData)

    if (result.success) {
      setMessage(result.message)
      setPlayerName("")
      setTimeout(() => {
        onClose()
        onSaveSuccess() // Liderlik tablosunu aç
      }, 1500)
    } else {
      setMessage(result.message)
    }
    setIsSaving(false)
  }

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
          SAVE YOUR SCORE
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="playerName" className="text-white" style={{ fontFamily: '"AtariClassic", monospace' }}>
              Player Name:
            </Label>
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-800 text-white border-gray-600"
              style={{ fontFamily: '"AtariClassic", monospace' }}
            />
          </div>
          <div>
            <Label htmlFor="score" className="text-white" style={{ fontFamily: '"AtariClassic", monospace' }}>
              Score:
            </Label>
            <Input
              id="score"
              type="number"
              value={Math.floor(lastScore)}
              readOnly
              className="mt-1 block w-full bg-gray-800 text-white border-gray-600"
              style={{ fontFamily: '"AtariClassic", monospace' }}
            />
          </div>
          {message && (
            <p
              className={`text-center ${message.includes("successfully") ? "text-green-500" : "text-sky-500"}`}
              style={{ fontFamily: '"AtariClassic", monospace' }}
            >
              {message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white bg-transparent"
              style={{ fontFamily: '"AtariClassic", monospace' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-sky-500 hover:bg-sky-600 text-black"
              style={{ fontFamily: '"AtariClassic", monospace' }}
            >
              {isSaving ? "Saving..." : "Save Score"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
