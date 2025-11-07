"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function ExitLifeLanding() {
  const router = useRouter()
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null)
  const clickSoundRef = useRef<HTMLAudioElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      )
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const playBackgroundMusic = useCallback(() => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
      backgroundMusicRef.current.currentTime = 0
    }
    try {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background-music-WdUWzp8HGgjly0kgXb5ZbWjgrULg8j.mp3")
      audio.volume = 0.3
      audio.loop = true
      audio.preload = "auto"
      backgroundMusicRef.current = audio

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("Background music autoplay blocked:", err)
          const playOnInteraction = () => {
            audio.play().catch(console.error)
            document.removeEventListener("click", playOnInteraction)
            document.removeEventListener("touchstart", playOnInteraction)
          }
          document.addEventListener("click", playOnInteraction, { once: true })
          document.addEventListener("touchstart", playOnInteraction, { once: true })
        })
      }

      if (audio.readyState >= 2) {
        playAudio()
      } else {
        audio.addEventListener("canplay", playAudio, { once: true })
        audio.addEventListener("loadeddata", playAudio, { once: true })
      }
      audio.load()
    } catch (error) {
      console.error("Failed to create background audio:", error)
    }
  }, [])

  const playClickSound = useCallback(() => {
    if (clickSoundRef.current) {
      clickSoundRef.current.pause()
      clickSoundRef.current.currentTime = 0
    }
    try {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/click-sound-Yld8MeNGnVGuRXX4U62Rh9DS821nUm.mp3")
      audio.volume = 0.4
      audio.preload = "auto"
      clickSoundRef.current = audio

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("Click sound failed:", err)
        })
      }

      if (audio.readyState >= 2) {
        playAudio()
      } else {
        audio.addEventListener("canplay", playAudio, { once: true })
        audio.addEventListener("loadeddata", playAudio, { once: true })
      }
      audio.load()
    } catch (error) {
      console.error("Failed to create click audio:", error)
    }
  }, [])

  useEffect(() => {
    playBackgroundMusic()

    const enableAudioOnInteraction = () => {
      playBackgroundMusic()
      document.removeEventListener("click", enableAudioOnInteraction)
      document.removeEventListener("touchstart", enableAudioOnInteraction)
      document.removeEventListener("keydown", enableAudioOnInteraction)
    }

    document.addEventListener("click", enableAudioOnInteraction, { once: true })
    document.addEventListener("touchstart", enableAudioOnInteraction, { once: true })
    document.addEventListener("keydown", enableAudioOnInteraction, { once: true })

    return () => {
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause()
        backgroundMusicRef.current.currentTime = 0
      }
      document.removeEventListener("click", enableAudioOnInteraction)
      document.removeEventListener("touchstart", enableAudioOnInteraction)
      document.removeEventListener("keydown", enableAudioOnInteraction)
    }
  }, [playBackgroundMusic])

  const handlePlayClick = () => {
    playClickSound()
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
      backgroundMusicRef.current.currentTime = 0
    }
    router.push("/")
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `url("/hell-background.gif")`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* Sol üst - About ve Leaderboard butonları */}
      <div className={`absolute ${isMobile ? "top-2 left-2" : "top-4 left-4"} flex gap-1 z-10`}>
        <Button
          variant="outline"
          className={`border-red-600 text-red-600 hover:bg-red-600 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
          style={{ fontFamily: '"8-BIT WONDER", monospace', fontSize: isMobile ? "10px" : "12px" }}
          onClick={() => {
            playClickSound()
            // Add logic to open About modal if needed, or navigate
          }}
        >
          About
        </Button>
        <Button
          variant="outline"
          className={`border-red-600 text-red-600 hover:bg-red-600 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
          style={{ fontFamily: '"8-BIT WONDER", monospace', fontSize: isMobile ? "10px" : "12px" }}
          onClick={() => {
            playClickSound()
            // Add logic to open Leaderboard modal if needed, or navigate
          }}
        >
          Leaderboard
        </Button>
      </div>

      {/* Sağ üst - Sosyal medya butonları */}
      <div className={`absolute ${isMobile ? "top-2 right-2" : "top-4 right-4"} flex gap-1 z-10`}>
        <Button
          variant="outline"
          className={`border-red-600 text-red-600 hover:bg-red-600 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1" : "px-3 py-2"}`}
          style={{ fontFamily: '"8-BIT WONDER", monospace', fontSize: isMobile ? "8px" : "10px" }}
          onClick={() => {
            playClickSound()
            window.open("https://x.com/exitsbags", "_blank")
          }}
        >
          {isMobile ? "X" : "Twitter"}
        </Button>
        <Button
          variant="outline"
          className={`border-red-600 text-red-600 hover:bg-red-600 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1" : "px-3 py-2"}`}
          style={{ fontFamily: '"8-BIT WONDER", monospace', fontSize: isMobile ? "8px" : "10px" }}
          onClick={() => {
            playClickSound()
            window.open("https://t.me/exitbags", "_blank")
          }}
        >
          {isMobile ? "TG" : "Telegram"}
        </Button>
        <Button
          variant="outline"
          className={`border-red-600 text-red-600 hover:bg-red-600 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1" : "px-3 py-2"}`}
          style={{ fontFamily: '"8-BIT WONDER", monospace', fontSize: isMobile ? "8px" : "10px" }}
          onClick={() => {
            playClickSound()
            window.open("https://bags.fm/HvwKBXeuyHUHDRF1c6fwQGhcDV154HsNsy6CvjxHBAGS", "_blank")
          }}
        >
          {isMobile ? "BAGS" : "BAGS"}
        </Button>
      </div>

      <Card
        className={`bg-black/80 border-4 border-red-600 text-white text-center ${isMobile ? "p-4 w-full max-w-sm" : "p-8 max-w-lg"}`}
      >
        <CardContent className="flex flex-col items-center justify-center gap-6">
          <h1
            className={`${isMobile ? "text-4xl" : "text-6xl"} font-bold text-red-600`}
            style={{
              fontFamily: '"8-BIT WONDER", monospace',
              textShadow: "4px 4px 0px #000000, -4px -4px 0px #000000, 4px -4px 0px #000000, -4px 4px 0px #000000",
              WebkitTextStroke: "1px #000000",
            }}
          >
            EXITS
          </h1>
          <p className={`${isMobile ? "text-sm" : "text-lg"} mb-4`} style={{ fontFamily: '"8-BIT WONDER", monospace' }}>
            The ultimate game of knowing when to exit gracefully.
          </p>
          <Button
            onClick={handlePlayClick}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold ${isMobile ? "py-4 text-base" : "py-3 px-8"}`}
            style={{
              fontFamily: '"8-BIT WONDER", monospace',
              textShadow: "2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000",
              WebkitTextStroke: "0.5px #000000",
            }}
          >
            PLAY NOW
          </Button>
        </CardContent>
      </Card>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p
          className={`text-white ${isMobile ? "text-xs" : "text-xs"} opacity-70`}
          style={{
            fontFamily: '"8-BIT WONDER", monospace',
            textShadow: "1px 1px 0px #000000",
          }}
        >
          © 2025 EXITS. All rights reserved
        </p>
      </div>
    </div>
  )
}
