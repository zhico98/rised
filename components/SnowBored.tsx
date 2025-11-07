"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { GAME_CONSTANTS, COLORS, IMAGES } from "../constants"
import { Button } from "@/components/ui/button"
import LeaderboardModal from "./LeaderboardModal"
import SaveScoreFormModal from "./SaveScoreFormModal"
import { connectMetaMaskWallet, disconnectMetaMaskWallet } from "@/lib/metamask-wallet"
// import { getRewards, updateRewards } from "@/actions/rewards" // CHANGED: Commented out reward database imports since Supabase connection is not working

interface Obstacle {
  x: number
  y: number
  sprite: HTMLImageElement
  isFinnObstacle?: boolean // Add a flag for Finn's specific obstacles
}

interface Reward {
  x: number
  y: number
  sprite: HTMLImageElement
  collected: boolean
}

interface Player {
  x: number
  y: number
  velocityY: number
  isMovingUp: boolean
  sprite: HTMLImageElement | null
  specialAbilityActive: boolean
  specialAbilityCooldown: number
  specialAbilityDuration: number
  characterIndex: number
  displayWidth: number // Finn için yeni boyutlar
  displayHeight: number // Finn için yeni boyutlar
}

interface TrailPoint {
  x: number
  y: number
}

const CHARACTER_STORIES = [
  {
    name: "Soar",
    story: {
      page1:
        "Soar is a mystical cloud spirit born from the highest peaks of the sky realm. With a rainbow crest that shimmers with the colors of hope and dreams, Soar has the unique ability to ride the winds and navigate through any storm.",
      page2:
        "Legends say that Soar was created when the first rainbow touched the clouds after a great storm. Now, Soar travels the skies seeking adventure and helping lost travelers find their way. With unmatched agility and the power of the winds, Soar faces this new challenge with determination.",
    },
  },
  {
    name: "Captain Beef",
    story: {
      page1:
        "Captain Beef is a legendary pilot who soared through the skies with unmatched courage and determination. With his iconic uniform and aviator skills, he became a symbol of bravery and adventure across the lands.",
      page2:
        "Through countless flights and daring missions, Captain Beef honed his abilities to navigate any sky condition. His unwavering dedication to his crew and his iron will made him an unstoppable force. Now he faces a new challenge: mastering the art of the perfect descent.",
    },
  },
  {
    name: "Thief",
    story: {
      page1:
        "The mysterious figure known as Thief emerged from the shadows, a master of stealth and agility. With a mask concealing their identity, they became legendary for their ability to navigate any obstacle with precision and grace.",
      page2:
        "Their journey took them through countless daring escapes and impossible challenges. With each adventure, their skills grew sharper, unlocking hidden abilities within. Now, in this strange realm, they must use all their experience to find the way out.",
    },
  },
  {
    name: "Hostess",
    story: {
      page1:
        "The elegant and professional Hostess is known for her grace under pressure and exceptional service skills. With her signature uniform and warm smile, she navigates any situation with poise and determination.",
      page2:
        "With lightning-fast reflexes and unmatched precision, the Hostess glides through challenges with ease. Her goal is simple: achieve the ultimate score and prove her superiority in this realm while maintaining her professional excellence.",
    },
  },
]

const BACKGROUND_IMAGE = "/sky-background.png" // Updated to use new cloud background

export default function SnowBored() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null) // Fixed type here
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null) // Initialize to null
  const finnAbilityAudioRef = useRef<HTMLAudioElement | null>(null) // Finn'in özel yetenek sesi için yeni ref
  const ramyoAbilityAudioRef = useRef<HTMLAudioElement | null>(null) // RAMYO'nun özel yetenek sesi için yeni ref
  const hunterAbilityAudioRef = useRef<HTMLAudioElement | null>(null) // HUNTER'ın özel yetenek sesi için yeni ref

  const sessionRewardsRef = useRef(0)

  // </CHANGE>
  const backgroundImageRef = useRef<HTMLImageElement | null>(null)

  const [score, setScore] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [gameEndReason, setGameEndReason] = useState<"died" | "finn_completed" | null>(null) // Oyun bitiş nedeni
  const [showCharacterSelect, setShowCharacterSelect] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState(0)
  const [showAbout, setShowAbout] = useState(false)
  const [showStory, setShowStory] = useState(false)
  const [selectedStoryCharacter, setSelectedStoryCharacter] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showSaveScoreModal, setShowSaveScoreModal] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [totalRewards, setTotalRewards] = useState(0)
  const [sessionRewards, setSessionRewards] = useState(0)
  const [phantomAddress, setPhantomAddress] = useState<string | null>(null)
  // </CHANGE>

  // Ref to store loaded obstacle sprites for regeneration
  const obstacleSpritesRef = useRef<{
    treeSprites: HTMLImageElement[]
    snowmanSprites: HTMLImageElement[]
    finnObstacles: HTMLImageElement[]
  } | null>(null)

  // Add a ref for the reward sprite
  const rewardSpriteRef = useRef<HTMLImageElement | null>(null)

  const gameStateRef = useRef({
    player: {
      x: 120,
      y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
      velocityY: 0,
      isMovingUp: false,
      sprite: null,
      specialAbilityActive: false,
      specialAbilityCooldown: 0,
      specialAbilityDuration: 0,
      characterIndex: 0,
      displayWidth: GAME_CONSTANTS.PLAYER_WIDTH, // Varsayılan
      displayHeight: GAME_CONSTANTS.PLAYER_HEIGHT, // Varsayılan
    } as Player, // Player tipini belirt
    obstacles: [] as Obstacle[],
    rewards: [] as Reward[],
    trailPoints: [] as TrailPoint[],
    frameCount: 0,
    startTime: Date.now(),
    gameSpeedMultiplier: 1,
    obstacleGenerationInterval: GAME_CONSTANTS.TREE_GENERATION_INTERVAL,
    score: 0,
    isGameOver: false,
    isRunning: false,
    cameraX: 0,
    currentLevel: 1,
    backgroundX: 0, // Added background scroll position
  })

  // Mobile detection
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

  useEffect(() => {
    const font = new FontFace("AtariClassic", "url(/fonts/AtariClassic.ttf)")
    font
      .load()
      .then(() => {
        document.fonts.add(font)
      })
      .catch(console.error)
  }, [])

  // Add this useEffect to enable audio on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      document.removeEventListener("click", enableAudio)
      document.removeEventListener("touchstart", enableAudio)
      document.removeEventListener("keydown", enableAudio)
    }

    document.addEventListener("click", enableAudio, { once: true })
    document.addEventListener("touchstart", enableAudio, { once: true })
    document.addEventListener("keydown", enableAudio, { once: true })

    return () => {
      document.removeEventListener("click", enableAudio)
      document.removeEventListener("touchstart", enableAudio)
      document.removeEventListener("keydown", enableAudio)
    }
  }, [])

  const handleConnectWallet = async () => {
    playClickSound()
    const address = await connectMetaMaskWallet()
    if (address) {
      setWalletAddress(address)
      // CHANGED: Removed database calls - rewards are now session-only until Supabase is fixed
      setTotalRewards(0)
    }
  }

  const handleDisconnectWallet = async () => {
    playClickSound()
    await disconnectMetaMaskWallet()
    setWalletAddress(null)
    setTotalRewards(0)
  }

  // CHANGED: Commented out auto-connect effect that tries to load rewards from database
  /*
  useEffect(() => {
    const provider = window.phantom?.solana
    if (provider?.publicKey) {
      const address = provider.publicKey.toString()
      setWalletAddress(address)
      getRewards(address)
        .then((result) => {
          if (result && typeof result.rewards === "number") {
            setTotalRewards(result.rewards)
          } else {
            console.warn("[v0] Rewards table may not exist yet.")
            setTotalRewards(0)
          }
        })
        .catch((error) => {
          console.error("[v0] Error fetching rewards on mount. Database may not be set up:", error)
          setTotalRewards(0)
        })
    } else {
      setWalletAddress(null)
      setTotalRewards(0)
    }
  }, [])
  */

  const stopGame = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    gameStateRef.current.isRunning = false
  }

  const resetGameState = () => {
    const selectedCharData = IMAGES.CHARACTERS[selectedCharacter]
    const widthMult = selectedCharData.widthMultiplier ?? selectedCharData.sizeMultiplier ?? 1
    const heightMult = selectedCharData.heightMultiplier ?? selectedCharData.sizeMultiplier ?? 1
    // </CHANGE>

    gameStateRef.current = {
      player: {
        x: 120,
        y: GAME_CONSTANTS.CANVAS_HEIGHT / 2,
        velocityY: 0,
        isMovingUp: false,
        sprite: null,
        specialAbilityActive: false,
        specialAbilityCooldown: 0,
        specialAbilityDuration: 0,
        characterIndex: selectedCharacter,
        displayWidth: GAME_CONSTANTS.PLAYER_WIDTH * widthMult,
        displayHeight: GAME_CONSTANTS.PLAYER_HEIGHT * heightMult,
        // </CHANGE>
      },
      obstacles: [],
      rewards: [],
      trailPoints: [],
      frameCount: 0,
      startTime: Date.now(),
      gameSpeedMultiplier: 1,
      obstacleGenerationInterval: GAME_CONSTANTS.TREE_GENERATION_INTERVAL,
      score: 0,
      isGameOver: false,
      isRunning: false,
      cameraX: 0,
      currentLevel: 1,
      backgroundX: 0,
    }
    setGameEndReason(null) // Oyun bitiş nedenini sıfırla
    sessionRewardsRef.current = 0
    setSessionRewards(0) // Reset session rewards
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" && !gameStateRef.current.isGameOver && !showCharacterSelect) {
      e.preventDefault()
      gameStateRef.current.player.isMovingUp = true
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space" && !gameStateRef.current.isGameOver && !showCharacterSelect) {
      e.preventDefault()
      gameStateRef.current.player.isMovingUp = false
    }
  }

  // Mobile touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!gameStateRef.current.isGameOver && !showCharacterSelect) {
      gameStateRef.current.player.isMovingUp = true
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!gameStateRef.current.isGameOver && !showCharacterSelect) {
      gameStateRef.current.player.isMovingUp = false
    }
  }

  // — Stop all audio —
  const stopAllAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
      backgroundMusicRef.current.currentTime = 0
      backgroundMusicRef.current = null
    }
    if (finnAbilityAudioRef.current) {
      finnAbilityAudioRef.current.pause()
      finnAbilityAudioRef.current.currentTime = 0
      finnAbilityAudioRef.current = null
    }
    if (ramyoAbilityAudioRef.current) {
      ramyoAbilityAudioRef.current.pause()
      ramyoAbilityAudioRef.current.currentTime = 0
      ramyoAbilityAudioRef.current = null
    }
    if (hunterAbilityAudioRef.current) {
      hunterAbilityAudioRef.current.pause()
      hunterAbilityAudioRef.current.currentTime = 0
      hunterAbilityAudioRef.current = null
    }
  }, [])

  // — Play background music —
  const playBackgroundMusic = useCallback(() => {
    stopAllAudio()

    try {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background-music-WdUWzp8HGgjly0kgXb5ZbWjgrULg8j.mp3")
      audio.volume = 0.3
      audio.loop = true
      audio.preload = "auto"
      backgroundMusicRef.current = audio

      // Add multiple event listeners for better compatibility
      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("Background music autoplay blocked:", err)
          // Try to play on next user interaction
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
  }, [stopAllAudio])

  // — Play Finn Ability Sound —
  const playFinnAbilitySound = useCallback(() => {
    stopAllAudio() // Tüm sesleri durdur
    try {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Comethazine%20-%20Bands%20%28Directed%20by%20Cole%20Bennett%29%20%28mp3cut.net%29-ik9YSRCS5MOBldlSh8st1VVxMO372X.mp3") // Use the new sound
      audio.volume = 0.5
      audio.loop = true // Loop until game ends
      audio.preload = "auto"
      finnAbilityAudioRef.current = audio

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("Finn ability sound autoplay blocked:", err)
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
      console.error("Failed to create Finn ability audio:", error)
    }
  }, [stopAllAudio])

  // — Play RAMYO Ability Sound —
  const playRamyoAbilitySound = useCallback(() => {
    stopAllAudio() // Tüm sesleri durdur
    try {
      const audio = new Audio("/ramyo-ability-sound.mp3")
      audio.volume = 0.5
      audio.loop = true
      audio.preload = "auto"
      ramyoAbilityAudioRef.current = audio

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("RAMYO ability sound autoplay blocked:", err)
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
      console.error("Failed to create RAMYO ability audio:", error)
    }
  }, [stopAllAudio])

  // — Play HUNTER Ability Sound —
  const playHunterAbilitySound = useCallback(() => {
    stopAllAudio() // Tüm sesleri durdur
    try {
      const audio = new Audio("/hunter-ability-sound.mp3")
      audio.volume = 0.5
      audio.loop = true
      audio.preload = "auto"
      hunterAbilityAudioRef.current = audio

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("HUNTER ability sound autoplay blocked:", err)
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
      console.error("Failed to create HUNTER ability audio:", error)
    }
  }, [stopAllAudio])

  // — Play click sound —
  const playClickSound = useCallback(() => {
    try {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/click-sound-Yld8MeNGnVGuRXX4U62Rh9DS821nUm.mp3")
      audio.volume = 0.4
      audio.preload = "auto"

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

  const playCharacterSound = useCallback((characterIndex: number) => {
    // Stop any currently playing character audio (but not background music or Finn ability music)
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    let audioSrc = ""
    switch (characterIndex) {
      case 0: // Naruto
        audioSrc = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/naruto-I1ntw0ndBxjI5Di5MJd7N9W5F55uN9.mp3"
        break
      case 1: // Zoro
        audioSrc = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/zoro-bWGW9mnIcwTDQLhhTjOMcR1LqxswkZ.mp3"
        break
      case 2: // Ichigo
        audioSrc = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ichigo%20%28mp3cut.net%29-H7neagLiYJn4og72Is1yAEaNHu8axl.mp3"
        break
      case 3: // Finn - NO SOUND ON SELECTION
        return // Do not play any sound when Finn is selected
      default:
        return
    }

    try {
      const audio = new Audio(audioSrc)
      audio.volume = 0.5
      audio.preload = "auto"
      currentAudioRef.current = audio

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn(`Character sound ${characterIndex} failed:`, err)
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
      console.error("Failed to create character audio:", error)
    }
  }, [])

  // — Play Game Over Sound —
  const playGameOverSound = useCallback(() => {
    stopAllAudio() // Tüm sesleri durdur
    try {
      const audio = new Audio("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/game-over-sound-F1aM1v62BmmgUnbv9xN6CoxN2xjMJb.mp3")
      audio.volume = 0.6
      audio.preload = "auto"

      const playAudio = () => {
        audio.play().catch((err) => {
          console.warn("Game over sound failed:", err)
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
      console.error("Failed to create game over audio:", error)
    }
  }, [stopAllAudio])

  const openAbout = () => {
    playClickSound()
    setShowAbout(true)
    setShowLeaderboard(false)
    setShowSaveScoreModal(false)
  }

  const closeAbout = () => {
    playClickSound()
    setShowAbout(false)
    setShowStory(false)
  }

  const openStory = (index: number) => {
    setSelectedStoryCharacter(index)
    setShowStory(true)
  }

  const closeStory = () => {
    setShowStory(false)
  }

  const openLeaderboard = () => {
    playClickSound()
    setShowLeaderboard(true)
    setShowAbout(false)
    setShowSaveScoreModal(false)
  }

  const closeLeaderboard = () => {
    playClickSound()
    setShowLeaderboard(false)
  }

  const openSaveScoreModal = () => {
    playClickSound()
    setShowSaveScoreModal(true)
    setShowAbout(false)
    setShowLeaderboard(false)
  }

  const closeSaveScoreModal = () => {
    playClickSound()
    setShowSaveScoreModal(false)
  }

  const startGame = () => {
    resetGameState()
    setGameEndReason(null) // Oyunu başlatırken bitiş nedenini sıfırla
    setShowCharacterSelect(false)
    playBackgroundMusic()
  }

  const backToCharacterSelect = () => {
    stopGame()
    stopAllAudio()
    setShowCharacterSelect(true)
    resetGameState() // Rage modu da sıfırla
  }

  // Skor başarıyla kaydedildiğinde liderlik tablosunu aç
  const handleSaveScoreSuccess = () => {
    closeSaveScoreModal()
    openLeaderboard()
  }

  // Seviye geçiş animasyonu
  // Removed startLevelTransition function - no more rage mode transitions
  // Removed toggleRageMode function - no more rage mode button

  useEffect(() => {
    if (showCharacterSelect) {
      stopGame()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // smarter image loader: only add `crossOrigin` for absolute/remote URLs
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image()
        if (/^https?:\/\//.test(src)) {
          // remote image – need CORS
          img.crossOrigin = "anonymous"
        }
        img.src = src
        img.onload = () => resolve(img)
        img.onerror = (error) => {
          console.warn(`Failed to load image: ${src}. Using fallback.`, error)
          const canvas = document.createElement("canvas")
          canvas.width = 56
          canvas.height = 56
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.fillStyle = "#ff0000" // Red square fallback
            ctx.fillRect(0, 0, 56, 56)
          }
          const fallbackImg = new Image()
          fallbackImg.src = canvas.toDataURL()
          fallbackImg.onload = () => resolve(fallbackImg) // Resolve only when fallback is loaded
          fallbackImg.onerror = (e) => {
            console.error("Failed to load fallback image, resolving with empty image:", e)
            resolve(new Image()) // Fallback for the fallback, ensures a valid HTMLImageElement
          }
        }
      })
    }

    const loadObstacleSprites = async () => {
      const treeSprites = await Promise.all(IMAGES.TREES.map(loadImage))
      const snowmanSprites = await Promise.all(IMAGES.SNOWMEN.map(loadImage))
      const finnObstacles = await Promise.all(IMAGES.FINN_OBSTACLES.map(loadImage)) // Finn engellerini yükle
      const rewardSprite = await loadImage("/reward.png")
      return { treeSprites, snowmanSprites, finnObstacles, rewardSprite }
    }

    const loadBackgroundImage = async () => {
      const background = await loadImage(BACKGROUND_IMAGE)
      backgroundImageRef.current = background
    }
    // </CHANGE>

    const initGame = async () => {
      const selectedCharData = IMAGES.CHARACTERS[selectedCharacter]
      const playerSprite = await loadImage(selectedCharData.sprite)
      const { treeSprites, snowmanSprites, finnObstacles, rewardSprite } = await loadObstacleSprites()

      await loadBackgroundImage()
      // </CHANGE>

      obstacleSpritesRef.current = { treeSprites, snowmanSprites, finnObstacles } // Store loaded sprites
      rewardSpriteRef.current = rewardSprite // Store reward sprite

      gameStateRef.current.player.sprite = playerSprite
      gameStateRef.current.player.characterIndex = selectedCharacter
      const widthMult = selectedCharData.widthMultiplier ?? selectedCharData.sizeMultiplier ?? 1
      const heightMult = selectedCharData.heightMultiplier ?? selectedCharData.sizeMultiplier ?? 1
      gameStateRef.current.player.displayWidth = GAME_CONSTANTS.PLAYER_WIDTH * widthMult
      gameStateRef.current.player.displayHeight = GAME_CONSTANTS.PLAYER_HEIGHT * heightMult
      // </CHANGE>
      gameStateRef.current.isRunning = true

      const getRandomObstacleData = () => {
        let sprite: HTMLImageElement
        let isFinnObstacleFlag = false
        // Finn seçiliyse sadece Finn'in engellerini kullan
        if (selectedCharacter === 3) {
          isFinnObstacleFlag = true
          sprite = finnObstacles[Math.floor(Math.random() * finnObstacles.length)]
        } else {
          const useTree = Math.random() > 0.2
          const obstacleSet = useTree ? treeSprites : snowmanSprites
          sprite = obstacleSet[Math.floor(Math.random() * obstacleSet.length)]
        }
        return { sprite, isFinnObstacleFlag }
      }

      // İlk engelleri ekle
      for (let i = 0; i < 3; i++) {
        const { sprite: newObstacleSprite, isFinnObstacleFlag: newIsFinnObstacleFlag } = getRandomObstacleData()
        gameStateRef.current.obstacles.push({
          x: Math.random() * (GAME_CONSTANTS.CANVAS_WIDTH - 100) + GAME_CONSTANTS.CANVAS_WIDTH,
          y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
          sprite: newObstacleSprite,
          isFinnObstacle: newIsFinnObstacleFlag,
        })
      }

      for (let i = 0; i < 3; i++) {
        gameStateRef.current.rewards.push({
          x: Math.random() * (GAME_CONSTANTS.CANVAS_WIDTH - 100) + GAME_CONSTANTS.CANVAS_WIDTH + 500,
          y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
          sprite: rewardSprite,
          collected: false,
        })
      }

      const drawBackground = () => {
        const background = backgroundImageRef.current

        if (!background || !background.complete || background.naturalWidth === 0) {
          // Fallback gradient if image not loaded
          const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONSTANTS.CANVAS_HEIGHT)
          gradient.addColorStop(0, "#87CEEB")
          gradient.addColorStop(1, "#E0F6FF")
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT)
          return
        }

        const bgWidth = GAME_CONSTANTS.CANVAS_WIDTH
        const bgHeight = GAME_CONSTANTS.CANVAS_HEIGHT
        const scrollX = Math.floor(gameStateRef.current.backgroundX % bgWidth)

        // Draw three copies to ensure full coverage without gaps
        ctx.drawImage(background, -scrollX, 0, bgWidth, bgHeight)
        ctx.drawImage(background, bgWidth - scrollX, 0, bgWidth, bgHeight)
        ctx.drawImage(background, bgWidth * 2 - scrollX, 0, bgWidth, bgHeight)
        // </CHANGE>
      }
      // </CHANGE>

      const drawPlayer = () => {
        const { player } = gameStateRef.current
        if (player.sprite) {
          ctx.save()
          ctx.translate(player.x - gameStateRef.current.cameraX, player.y)

          if (gameStateRef.current.isGameOver) {
            ctx.rotate(-Math.PI / 2)
          }

          ctx.drawImage(
            player.sprite,
            -player.displayWidth / 2,
            -player.displayHeight / 2,
            player.displayWidth,
            player.displayHeight,
          )
          ctx.restore()
        }
      }

      const drawObstacles = () => {
        gameStateRef.current.obstacles.forEach((obstacle) => {
          // Check if sprite is loaded before drawing
          if (obstacle.sprite && obstacle.sprite.complete) {
            let obstacleDrawWidth = GAME_CONSTANTS.OBSTACLE_WIDTH
            let obstacleDrawHeight = GAME_CONSTANTS.OBSTACLE_HEIGHT

            if (obstacle.isFinnObstacle) {
              obstacleDrawWidth = GAME_CONSTANTS.FINN_OBSTACLE_WIDTH
              obstacleDrawHeight = GAME_CONSTANTS.FINN_OBSTACLE_HEIGHT
            }

            ctx.drawImage(
              obstacle.sprite,
              obstacle.x - gameStateRef.current.cameraX - obstacleDrawWidth / 2,
              obstacle.y - obstacleDrawHeight,
              obstacleDrawWidth,
              obstacleDrawHeight,
            )
          } else {
            // Optionally log a warning if a sprite is not ready
            console.warn("Obstacle sprite not loaded or invalid, skipping draw:", obstacle.sprite)
          }
        })
      }

      const drawRewards = () => {
        gameStateRef.current.rewards.forEach((reward) => {
          if (!reward.collected && reward.sprite && reward.sprite.complete) {
            ctx.drawImage(
              reward.sprite,
              reward.x - gameStateRef.current.cameraX - 20, // Centered x
              reward.y - 20, // Centered y
              40, // Fixed size for rewards
              40,
            )
          }
        })
      }

      const drawSkiTrail = () => {
        ctx.strokeStyle = COLORS.skiTrail
        ctx.lineWidth = 3
        ctx.beginPath()
        gameStateRef.current.trailPoints.forEach((point, index) => {
          const x = point.x - gameStateRef.current.cameraX
          if (index === 0) {
            ctx.moveTo(x, point.y)
          } else {
            ctx.lineTo(x, point.y)
          }
        })
        ctx.stroke()
      }

      const drawUI = () => {
        // Draw score
        const scoreText = `Score: ${gameStateRef.current.score}`
        ctx.font = isMobile ? "16px AtariClassic" : "20px AtariClassic"
        ctx.fillStyle = "#60A5FA"
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 3
        ctx.strokeText(scoreText, 20, 40)
        ctx.fillText(scoreText, 20, 40)

        const currentTime = gameStateRef.current.isGameOver
          ? gameTime
          : Math.floor((Date.now() - gameStateRef.current.startTime) / 1000)
        const timeString = new Date(currentTime * 1000).toISOString().substr(14, 5)
        ctx.strokeText(timeString, 20, 70) // Position adjusted to be below score
        ctx.fillText(timeString, 20, 70)

        if (sessionRewardsRef.current > 0) {
          const rewardsText = `Rewards: ${sessionRewardsRef.current}`
          ctx.fillStyle = "#00FF00" // Green color for rewards
          ctx.strokeText(rewardsText, 20, 100)
          ctx.fillText(rewardsText, 20, 100)
        }
      }

      const checkCollision = () => {
        const { player, obstacles } = gameStateRef.current
        const characterIndex = player.characterIndex

        // Ichigo dash sırasında çarpışmadan etkilenmez
        if (characterIndex === 2 && player.specialAbilityActive) {
          return false
        }
        // Diğer karakterler için AABB çarpışma kontrolü
        else {
          for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i]

            // Oyuncunun efektif çarpışma kutusu
            const playerCollisionWidth = player.displayWidth
            const playerCollisionHeight = player.displayHeight

            // Sakura (if added later) or other characters with adjusted hitbox
            // You can add specific character logic here if needed
            // For now, assuming a general player hitbox based on sprite size

            const pLeft = player.x - playerCollisionWidth / 2
            const pRight = player.x + playerCollisionWidth / 2
            const pTop = player.y - playerCollisionHeight / 2
            const pBottom = player.y + playerCollisionHeight / 2

            // Engelin çarpışma kutusu
            let obstacleCollisionWidth = GAME_CONSTANTS.OBSTACLE_WIDTH
            let obstacleDrawHeight = GAME_CONSTANTS.OBSTACLE_HEIGHT
            if (obstacle.isFinnObstacle) {
              obstacleCollisionWidth = GAME_CONSTANTS.FINN_OBSTACLE_WIDTH
              obstacleDrawHeight = GAME_CONSTANTS.FINN_OBSTACLE_HEIGHT
            }

            const oLeft = obstacle.x - obstacleCollisionWidth / 2
            const oRight = obstacle.x + obstacleCollisionWidth / 2
            const oTop = obstacle.y - obstacleDrawHeight
            const oBottom = obstacle.y

            // AABB çarpışma kontrolü
            if (pLeft < oRight && pRight > oLeft && pTop < oBottom && pBottom > oTop) {
              return true // Çarpışma tespit edildi
            }
          }
          return false // Çarpışma yok
        }
      }

      const checkRewardCollision = () => {
        try {
          const { player, rewards } = gameStateRef.current

          for (let i = 0; i < rewards.length; i++) {
            const reward = rewards[i]
            if (reward.collected) continue

            // Player's bounding box
            const pLeft = player.x - player.displayWidth / 2
            const pRight = player.x + player.displayWidth / 2
            const pTop = player.y - player.displayHeight / 2
            const pBottom = player.y + player.displayHeight / 2

            // Reward's bounding box (assuming 40x40 sprite centered)
            const rLeft = reward.x - 20
            const rRight = reward.x + 20
            const rTop = reward.y - 20
            const rBottom = reward.y + 20

            // Check for overlap
            if (pLeft < rRight && pRight > rLeft && pTop < rBottom && pBottom > rTop) {
              reward.collected = true
              sessionRewardsRef.current += 1
            }
          }
        } catch (error) {
          console.error("[v0] Error in checkRewardCollision:", error)
          // Don't break the game, just log the error
        }
      }

      // </CHANGE>

      const updateGame = () => {
        if (gameStateRef.current.isGameOver || !gameStateRef.current.isRunning) return

        const { player, obstacles, rewards, trailPoints } = gameStateRef.current
        const currentTime = Date.now()

        const gameElapsedTime = currentTime - gameStateRef.current.startTime
        const canSpawnObstacles = gameElapsedTime > 3000

        gameStateRef.current.backgroundX +=
          GAME_CONSTANTS.MOVEMENT_SPEED * gameStateRef.current.gameSpeedMultiplier * 0.3

        // </CHANGE>

        // Kamera takibi - oyuncuyu merkeze yakın tut
        const targetCameraX = player.x - GAME_CONSTANTS.CANVAS_WIDTH * 0.3
        gameStateRef.current.cameraX += (targetCameraX - gameStateRef.current.cameraX) * 0.1

        // Character-specific ability timers (only for characters with abilities other than Finn)
        // This section has been commented out as per the changes
        /*
        if (player.characterIndex !== 3) { // Finn does not use cooldowns in this way
          if (player.specialAbilityCooldown > 0) {
            player.specialAbilityCooldown--
          }
          if (player.specialAbilityDuration > 0) {
            player.specialAbilityDuration--
            if (player.specialAbilityDuration === 0) {
              player.specialAbilityActive = false
            }
          }
        }
        */

        // Karakter özel yetenekleri ve hızları
        const characterIndex = gameStateRef.current.player.characterIndex
        const currentSpeedMultiplier = gameStateRef.current.gameSpeedMultiplier

        if (player.isMovingUp) {
          player.velocityY = Math.max(player.velocityY - 0.5, -GAME_CONSTANTS.MOVEMENT_SPEED * 1.2)
        } else {
          player.velocityY = Math.min(player.velocityY + GAME_CONSTANTS.GRAVITY, GAME_CONSTANTS.MOVEMENT_SPEED * 1.2)
        }

        player.y += player.velocityY
        player.x += GAME_CONSTANTS.MOVEMENT_SPEED * currentSpeedMultiplier * 0.5 // Hız çarpanını kullan

        if (player.y < 50) player.y = 50
        if (player.y > GAME_CONSTANTS.CANVAS_HEIGHT - 70) player.y = GAME_CONSTANTS.CANVAS_HEIGHT - 70

        trailPoints.unshift({ x: player.x, y: player.y + 10 })
        if (trailPoints.length > 50) {
          trailPoints.pop()
        }

        gameStateRef.current.obstacles = obstacles
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - GAME_CONSTANTS.MOVEMENT_SPEED * currentSpeedMultiplier * 0.5, // Hız çarpanını kullan
          }))
          .filter((obstacle) => obstacle.x > gameStateRef.current.cameraX - 3000) // -1000 yerine -3000 yapıldı

        gameStateRef.current.rewards = rewards
          .filter((reward) => !reward.collected) // Remove collected rewards from the array
          .map((reward) => ({
            ...reward,
            x: reward.x - GAME_CONSTANTS.MOVEMENT_SPEED * currentSpeedMultiplier * 0.5,
          }))

        if (canSpawnObstacles && gameStateRef.current.frameCount % 200 === 0) {
          const newRewardX = gameStateRef.current.cameraX + GAME_CONSTANTS.CANVAS_WIDTH + 50
          const newRewardY = Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50

          const isTooCloseToObstacle = gameStateRef.current.obstacles.some((obstacle) => {
            const distance = Math.sqrt(Math.pow(obstacle.x - newRewardX, 2) + Math.pow(obstacle.y - newRewardY, 2))
            return distance < 500 // Increased minimum distance to 500 pixels
          })

          const playerDistance = Math.sqrt(Math.pow(player.x - newRewardX, 2) + Math.pow(player.y - newRewardY, 2))
          const isTooCloseToPlayer = playerDistance < 300

          // Only spawn reward if it's not too close to any obstacle or player
          if (!isTooCloseToObstacle && !isTooCloseToPlayer) {
            gameStateRef.current.rewards.push({
              x: newRewardX,
              y: newRewardY,
              sprite: rewardSpriteRef.current!,
              collected: false,
            })
          }
        }

        if (canSpawnObstacles && gameStateRef.current.frameCount % GAME_CONSTANTS.TREE_GENERATION_INTERVAL === 0) {
          const sprites = obstacleSpritesRef.current
          if (sprites) {
            const getRandomObstacleData = () => {
              let sprite: HTMLImageElement
              let isFinnObstacleFlag = false
              // Finn seçiliyse sadece Finn'in engellerini kullan
              if (selectedCharacter === 3) {
                isFinnObstacleFlag = true
                sprite = sprites.finnObstacles[Math.floor(Math.random() * sprites.finnObstacles.length)]
              } else {
                const useTree = Math.random() > 0.2
                const obstacleSet = useTree ? sprites.treeSprites : sprites.snowmanSprites
                sprite = obstacleSet[Math.floor(Math.random() * obstacleSet.length)]
              }
              return { sprite, isFinnObstacleFlag }
            }
            const { sprite: newObstacleSprite, isFinnObstacleFlag: newIsFinnObstacleFlag } = getRandomObstacleData()
            gameStateRef.current.obstacles.push({
              x: gameStateRef.current.cameraX + GAME_CONSTANTS.CANVAS_WIDTH + 50,
              y: Math.random() * (GAME_CONSTANTS.CANVAS_HEIGHT - 100) + 50,
              sprite: newObstacleSprite,
              isFinnObstacle: newIsFinnObstacleFlag,
            })
          }
        }

        checkRewardCollision()

        // State is now only updated when game ends
        // if (gameStateRef.current.frameCount % 60 === 0) {
        //   setSessionRewards(sessionRewardsRef.current)
        // }

        if (checkCollision()) {
          const characterIndex = gameStateRef.current.player.characterIndex
          gameStateRef.current.isGameOver = true
          setGameEndReason("died") // Set reason for other characters
          setGameTime(Math.floor((Date.now() - gameStateRef.current.startTime) / 1000))
          setSessionRewards(sessionRewardsRef.current)
          playGameOverSound()
          stopGame() // Stop the game loop
          return
        }

        if (gameStateRef.current.frameCount % 60 === 0) {
          gameStateRef.current.score += 10
        }

        gameStateRef.current.frameCount++
      }

      const gameLoop = () => {
        if (!gameStateRef.current.isRunning) return

        ctx.clearRect(0, 0, GAME_CONSTANTS.CANVAS_WIDTH, GAME_CONSTANTS.CANVAS_HEIGHT)

        drawBackground()
        drawSkiTrail()
        drawObstacles()
        drawRewards() // Draw rewards
        drawPlayer()
        drawUI()

        if (!gameStateRef.current.isGameOver) {
          updateGame()
          setScore(gameStateRef.current.score)
        }

        if (gameStateRef.current.isRunning) {
          animationFrameRef.current = requestAnimationFrame(gameLoop)
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      window.addEventListener("keyup", handleKeyUp)

      canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
      canvas.addEventListener("touchend", handleTouchEnd, { passive: false })

      gameLoop()

      return () => {
        stopGame()
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
        canvas.removeEventListener("touchstart", handleTouchStart)
        canvas.removeEventListener("touchend", handleTouchEnd)
      }
    }

    initGame()
  }, [
    gameEndReason, // gameOver yerine gameEndReason'ı dinle
    gameTime,
    showCharacterSelect,
    selectedCharacter,
    isMobile,
    playFinnAbilitySound, // Finn yetenek sesi bağımlılığı
    playRamyoAbilitySound, // RAMYO yetenek sesi bağımlılığı
    playHunterAbilitySound, // HUNTER yetenek sesi bağımlılığı
    stopAllAudio, // stopAllAudio bağımlılığı
    sessionRewards, // Added sessionRewards dependency
    // Add phantomAddress and walletAddress to dependencies
    phantomAddress,
    walletAddress,
    // </CHANGE>
  ])

  // </CHANGE>

  // CHANGED: Commented out the useEffect that saves rewards to database when game ends
  /*
  useEffect(() => {
    if (gameEndReason && walletAddress && sessionRewardsRef.current > 0) {
      updateRewards(walletAddress, sessionRewardsRef.current)
        .then((result) => {
          if (result && result.success) {
            setTotalRewards((prev) => prev + sessionRewardsRef.current)
            setSessionRewards(sessionRewardsRef.current)
          } else {
            console.warn("[v0] Failed to save rewards. Database may not be set up.")
          }
        })
        .catch((error) => {
          console.error("[v0] Error saving rewards. Database may not be set up:", error)
        })
    }
  }, [gameEndReason, walletAddress]) // Removed sessionRewardsRef.current as dependency here, as it is mutable and won't trigger effect reliably.
  */

  // </CHANGE>

  const connectPhantomWallet = async () => {
    playClickSound()
    try {
      const { solana } = window as any

      if (solana && solana.isPhantom) {
        const response = await solana.connect()
        const publicKey = response.publicKey.toString()
        setPhantomAddress(publicKey)
        console.log("[v0] Phantom wallet connected:", publicKey)
      } else {
        alert("Phantom wallet not found! Please install it from phantom.app")
        window.open("https://phantom.app/", "_blank")
      }
    } catch (error) {
      console.error("[v0] Error connecting Phantom wallet:", error)
    }
  }

  const disconnectPhantomWallet = () => {
    playClickSound()
    setPhantomAddress(null)
    console.log("[v0] Phantom wallet disconnected")
  }

  const handleCollectReward = () => {
    playClickSound()
    if (!phantomAddress) {
      alert("Please connect your Phantom wallet first!")
      return
    }
    alert(`Rewards collected to wallet: ${phantomAddress.slice(0, 4)}...${phantomAddress.slice(-4)}`)
  }
  // </CHANGE>

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen ${isMobile ? "p-2" : "p-4"} relative transition-all duration-[3000ms]`}
      style={{
        backgroundColor: "#5B9BD5",
        backgroundImage: `url('/pixel-sky-bg.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        imageRendering: "pixelated",
        // </CHANGE>
      }}
    >
      {/* Sol üst - About ve Leaderboard butonları */}
      <div className={`absolute ${isMobile ? "top-2 left-2" : "top-4 left-4"} flex gap-1 z-10`}>
        <Button
          variant="outline"
          className={`border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
          style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "10px" : "12px" }}
          onClick={openAbout}
        >
          About
        </Button>
        <Button
          variant="outline"
          className={`border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
          style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "10px" : "12px" }}
          onClick={openLeaderboard}
        >
          Leaderboard
        </Button>
      </div>

      <div className={`absolute ${isMobile ? "top-2 right-2" : "top-4 right-4"} flex gap-1 z-10`}>
        <Button
          variant="outline"
          className={`border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
          style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "10px" : "12px" }}
          onClick={() => window.open("https://twitter.com/risedfun", "_blank")}
        >
          Twitter
        </Button>
        {phantomAddress ? (
          <Button
            variant="outline"
            className={`border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
            style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "10px" : "12px" }}
            onClick={disconnectPhantomWallet}
          >
            {isMobile ? phantomAddress.slice(0, 4) : `${phantomAddress.slice(0, 4)}...${phantomAddress.slice(-4)}`}
          </Button>
        ) : (
          <Button
            variant="outline"
            className={`border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-black bg-black/80 ${isMobile ? "px-2 py-1 text-xs" : "px-4 py-2"}`}
            style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "10px" : "12px" }}
            onClick={connectPhantomWallet}
          >
            Connect Wallet
          </Button>
        )}
      </div>
      {/* </CHANGE> */}

      {/* Right bottom - Rage Mode button */}

      {showCharacterSelect ? (
        <>
          <h1
            className={`${isMobile ? "text-2xl" : "text-4xl"} font-bold mb-8 text-sky-500`}
            style={{
              fontFamily: '"AtariClassic", monospace',
              textShadow: "1px 1px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              WebkitTextStroke: "0.5px #000000",
            }}
          >
            RISED.FUN
          </h1>

          <div
            className={`bg-black/80 ${isMobile ? "p-4" : "p-8"} rounded-lg border-2 border-sky-500 ${isMobile ? "w-full max-w-sm" : "max-w-md"}`}
          >
            <h2
              className={`${isMobile ? "text-lg" : "text-2xl"} font-bold mb-6 text-white text-center`}
              style={{
                fontFamily: '"AtariClassic", monospace',
                textShadow: "1px 1px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              }}
            >
              Select Character
            </h2>

            <div className={`grid ${isMobile ? "grid-cols-2 gap-3" : "grid-cols-2 gap-4"} mb-6`}>
              {IMAGES.CHARACTERS.map((character, index) => (
                <div
                  key={index}
                  className={`${isMobile ? "p-3" : "p-4"} border-2 rounded cursor-pointer transition-all ${
                    selectedCharacter === index
                      ? "border-green-400 bg-green-400/20"
                      : "border-gray-400 bg-gray-400/20 hover:border-white"
                  } aspect-square flex flex-col items-center justify-center`}
                  onClick={() => {
                    setSelectedCharacter(index)
                  }}
                >
                  <div className={`${isMobile ? "w-16 h-16" : "w-20 h-20"} mb-2 flex items-center justify-center`}>
                    <img
                      src={character.sprite || "/placeholder.svg"}
                      alt={character.name}
                      style={{
                        imageRendering: "pixelated",
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=56&width=56&text=" + character.name
                      }}
                    />
                  </div>
                  <p
                    className="text-white text-center"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                      textShadow:
                        "0.5px 0.5px 0px #000000, -0.5px -0.5px 0px #000000, 0.5px -0.5px 0px #000000, -0.5px 0.5px 0px #000000",
                      WebkitTextStroke: "0.3px #000000",
                    }}
                  >
                    {character.name}
                  </p>
                </div>
              ))}
            </div>

            <Button
              onClick={startGame}
              className={`w-full bg-sky-500 hover:bg-sky-600 text-black font-bold ${isMobile ? "py-4 text-base" : "py-3"}`}
              style={{
                fontFamily: '"AtariClassic", monospace',
              }}
            >
              Start Game
            </Button>

            {/* Wallet connection buttons and display removed */}
          </div>
        </>
      ) : (
        <>
          <h1
            className={`${isMobile ? "text-2xl" : "text-4xl"} font-bold mb-2 ${gameEndReason === "died" ? "text-sky-500" : gameEndReason === "finn_completed" ? "text-green-400" : "text-sky-500"}`}
            style={{
              fontFamily: '"AtariClassic", monospace',
              textShadow: "1px 1px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
              WebkitTextStroke: "0.5px #000000",
            }}
          >
            {gameEndReason === "died" ? "GAME OVER - YOU DIE" : "RISED.FUN"}
          </h1>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={
                isMobile ? Math.min(GAME_CONSTANTS.CANVAS_WIDTH, window.innerWidth - 20) : GAME_CONSTANTS.CANVAS_WIDTH
              }
              height={isMobile ? Math.min(GAME_CONSTANTS.CANVAS_HEIGHT, 300) : GAME_CONSTANTS.CANVAS_HEIGHT}
              className={`border-4 border-gray-700 rounded-lg ${isMobile ? "w-full" : ""}`}
              style={{
                touchAction: "none",
                maxWidth: isMobile ? "100%" : "none",
                height: isMobile ? "auto" : "auto",
                backgroundColor: "transparent",
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
            {gameEndReason !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/75">
                <div className="text-white text-center space-y-4">
                  <button
                    onClick={backToCharacterSelect}
                    className={`${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2"} bg-sky-500 text-black rounded hover:bg-sky-600 mr-2`}
                    style={{ fontFamily: '"AtariClassic", monospace' }}
                  >
                    Select Character
                  </button>
                  <button
                    onClick={startGame}
                    className={`${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2"} bg-black text-white rounded hover:bg-gray-800`}
                    style={{ fontFamily: '"AtariClassic", monospace' }}
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>
          <p
            className={`text-white mt-4 text-center ${isMobile ? "text-xs px-4" : ""}`}
            style={{
              fontFamily: '"AtariClassic", monospace',
              textShadow: "1px 1px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000",
            }}
          >
            {isMobile ? "Touch and hold screen to move up" : "Press and hold SPACE to move up"}
          </p>
        </>
      )}

      {/* About Modal - Overlay for Game Screen */}
      {showAbout && !showStory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div
            className={`bg-black/90 ${isMobile ? "p-4 mx-2" : "p-8 mx-4"} rounded-lg border-4 border-sky-500 ${isMobile ? "w-full max-w-sm" : "max-w-4xl w-full"} relative`}
          >
            <div className="bg-black/80 p-6 rounded-lg">
              <h2
                className={`${isMobile ? "text-xl" : "text-3xl"} font-bold mb-6 text-sky-500 text-center`}
                style={{
                  fontFamily: '"AtariClassic", monospace',
                  textShadow: "2px 2px 0px #000000",
                }}
              >
                CHARACTER STORIES
              </h2>

              <p
                className="text-white text-center mb-8"
                style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "10px" : "12px" }}
              >
                Choose a character to learn their story
              </p>

              <div className={`grid ${isMobile ? "grid-cols-2 gap-4" : "grid-cols-4 gap-6"} mb-8 max-w-3xl mx-auto`}>
                {IMAGES.CHARACTERS.map((character, index) => (
                  <div
                    key={index}
                    className={`${isMobile ? "p-4" : "p-6"} border-2 border-sky-500 rounded cursor-pointer transition-all hover:border-sky-300 hover:bg-sky-400/10 bg-black/60 flex flex-col items-center justify-center`}
                    onClick={() => {
                      playClickSound()
                      openStory(index)
                    }}
                  >
                    <div className={`${isMobile ? "w-20 h-20" : "w-24 h-24"} mb-3 flex items-center justify-center`}>
                      <img
                        src={character.sprite || "/placeholder.svg"}
                        alt={character.name}
                        style={{
                          imageRendering: "pixelated",
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=64&width=64&text=" + character.name
                        }}
                      />
                    </div>
                    <p
                      className="text-sky-500 text-center font-bold"
                      style={{ fontFamily: '"AtariClassic", monospace', fontSize: isMobile ? "11px" : "13px" }}
                    >
                      {CHARACTER_STORIES[index].name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={closeAbout}
                  className={`bg-sky-500 hover:bg-sky-600 text-black font-bold ${isMobile ? "px-6 py-3" : "px-8 py-4"}`}
                  style={{ fontFamily: '"AtariClassic", monospace' }}
                >
                  Close Book
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Notebook Modal - Overlay for Game Screen */}
      {showStory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
          <div className={`relative ${isMobile ? "w-full max-w-sm" : "max-w-7xl w-full mx-4"}`}>
            {isMobile ? (
              <div className="bg-black/90 p-6 rounded-lg border-4 border-sky-500 max-h-[90vh] overflow-y-auto">
                <h3
                  className="text-xl font-bold mb-4 text-sky-500 text-center"
                  style={{
                    fontFamily: '"AtariClassic", monospace',
                    textShadow: "2px 2px 0px #000000",
                  }}
                >
                  {CHARACTER_STORIES[selectedStoryCharacter].name}
                </h3>

                <div className="space-y-6 mb-6">
                  <p
                    className="text-white leading-relaxed"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                      fontSize: "11px",
                      lineHeight: "18px",
                    }}
                  >
                    {CHARACTER_STORIES[selectedStoryCharacter].story.page1}
                  </p>

                  <div className="h-px bg-sky-500 my-4" />

                  <p
                    className="text-white leading-relaxed"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                      fontSize: "11px",
                      lineHeight: "18px",
                    }}
                  >
                    {CHARACTER_STORIES[selectedStoryCharacter].story.page2}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={closeStory}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 text-sm"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={closeAbout}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 text-black font-bold py-3 text-sm"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                    }}
                  >
                    Close Book
                  </Button>
                </div>
              </div>
            ) : (
              // Desktop Story View - Book Layout
              <div
                className="relative mx-auto"
                style={{
                  width: "800px",
                  height: "600px",
                  background: `
                  linear-gradient(135deg, #3B82F6 0%, #2563EB 25%, #60A5FA 50%, #2563EB 75%, #3B82F6 100%)
                `,
                  border: "12px solid #1E40AF",
                  borderRadius: "20px",
                  boxShadow: `
                  0 0 0 4px #1E3A8A,
                  0 20px 40px rgba(0,0,0,0.8),
                  inset 0 0 20px rgba(0,0,0,0.3)
                `,
                  imageRendering: "pixelated",
                }}
              >
                {/* Book Spine Details */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-16"
                  style={{
                    background: `
                    repeating-linear-gradient(
                      0deg,
                      #1E3A8A 0px,
                      #1E3A8A 8px,
                      #1E40AF 8px,
                      #1E40AF 12px,
                      #3B82F6 12px,
                      #3B82F6 20px
                    )
                  `,
                    borderRadius: "20px 0 0 20px",
                  }}
                />

                {/* Metal Rings */}
                <div className="absolute left-12 top-16 w-8 h-8 bg-gray-600 rounded-full border-4 border-gray-800" />
                <div className="absolute left-12 top-32 w-8 h-8 bg-gray-600 rounded-full border-4 border-gray-800" />
                <div className="absolute left-12 bottom-32 w-8 h-8 bg-gray-600 rounded-full border-4 border-gray-800" />
                <div className="absolute left-12 bottom-16 w-8 h-8 bg-gray-600 rounded-full border-4 border-gray-800" />

                {/* Pages Container */}
                <div className="flex gap-4 ml-20 p-8 pb-20 h-full">
                  {/* Left Page */}
                  <div
                    className="flex-1 relative"
                    style={{
                      background: "#FFFEF7",
                      border: "4px solid #E8E8E8",
                      borderRadius: "8px",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.1), 4px 4px 8px rgba(0,0,0,0.3)",
                      backgroundImage: `
                      repeating-linear-gradient(
                        transparent,
                        transparent 28px,
                        #E0E0E0 28px,
                        #E0E0E0 30px
                      )
                    `,
                    }}
                  >
                    <div className="p-6 h-full flex flex-col overflow-y-auto">
                      <h3
                        className="text-2xl font-bold mb-4 text-sky-600 text-center"
                        style={{
                          fontFamily: '"AtariClassic", monospace',
                          textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
                        }}
                      >
                        {CHARACTER_STORIES[selectedStoryCharacter].name}
                      </h3>
                      <div className="h-1 bg-sky-500 mb-6 rounded" />
                      <p
                        className="text-black leading-relaxed flex-1"
                        style={{
                          fontFamily: '"AtariClassic", monospace',
                          fontSize: "11px",
                          lineHeight: "30px",
                        }}
                      >
                        {CHARACTER_STORIES[selectedStoryCharacter].story.page1}
                      </p>
                    </div>
                  </div>

                  {/* Right Page */}
                  <div
                    className="flex-1 relative"
                    style={{
                      background: "#FFFEF7",
                      border: "4px solid #E8E8E8",
                      borderRadius: "8px",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.1), 4px 4px 8px rgba(0,0,0,0.3)",
                      backgroundImage: `
                      repeating-linear-gradient(
                        transparent,
                        transparent 28px,
                        #E0E0E0 28px,
                        #E0E0E0 30px
                      )
                    `,
                    }}
                  >
                    <div className="p-6 h-full flex flex-col overflow-y-auto">
                      <div className="h-8 mb-4" />
                      <div className="h-1 bg-sky-500 mb-6 rounded" />
                      <p
                        className="text-black leading-relaxed"
                        style={{
                          fontFamily: '"AtariClassic", monospace',
                          fontSize: "11px",
                          lineHeight: "30px",
                        }}
                      >
                        {CHARACTER_STORIES[selectedStoryCharacter].story.page2}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 px-24">
                  <Button
                    onClick={closeStory}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-2.5 border-4 border-gray-900"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                      fontSize: "12px",
                    }}
                  >
                    Back to Stories
                  </Button>
                  <Button
                    onClick={closeAbout}
                    className="bg-sky-600 hover:bg-sky-500 text-black font-bold px-6 py-2.5 border-4 border-sky-800"
                    style={{
                      fontFamily: '"AtariClassic", monospace',
                      fontSize: "12px",
                    }}
                  >
                    Close Book
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Leaderboard Modal */}
      {showLeaderboard && <LeaderboardModal onClose={closeLeaderboard} isMobile={isMobile} />}
      {/* Save Score Form Modal */}
      {showSaveScoreModal && (
        <SaveScoreFormModal
          onClose={closeSaveScoreModal}
          isMobile={isMobile}
          lastScore={score}
          onSaveSuccess={handleSaveScoreSuccess}
        />
      )}
      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p
          className={`text-white ${isMobile ? "text-xs" : "text-xs"} opacity-70`}
          style={{
            fontFamily: '"AtariClassic", monospace',
            textShadow: "1px 1px 0px #000000",
          }}
        >
          © 2025 RISED.FUN All rights reserved
        </p>
      </div>
    </div>
  )
}
