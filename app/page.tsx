"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { OXFORD_3000 } from "../constants"
import { GameStatus, type GameState, type VocabularyItem } from "../types"
import WordDisplay from "../components/WordDisplay"
import InlineResult from "../components/InlineResult"
import confetti from "canvas-confetti"

const GAME_DURATION_SEC = 10

const Page: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    score: 0,
    status: GameStatus.IDLE,
    inputValue: "",
  })

  // Timer State
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC)

  const [isErrorShake, setIsErrorShake] = useState(false)
  const [showError, setShowError] = useState(false)
  const [inputDisplay, setInputDisplay] = useState("")
  const [isInputVisible, setIsInputVisible] = useState(true)
  const [displayedWord, setDisplayedWord] = useState<VocabularyItem | null>(null)

  // High Score State
  const [highScore, setHighScore] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const isPickingWord = useRef(false)

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem("vocab_game_highscore")
    if (saved) {
      setHighScore(parseInt(saved, 10))
    }
  }, [])

  // Save High Score
  const updateHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore)
      localStorage.setItem("vocab_game_highscore", newScore.toString())
    }
  }

  // Word management
  const usedIndicesRef = useRef<Set<number>>(new Set())

  const getNextRandomWord = useCallback(() => {
    const totalWords = OXFORD_3000.length
    if (totalWords === 0) return null

    let availableIndices: number[] = []

    // If we've used all words (or close to), reset
    if (usedIndicesRef.current.size >= totalWords) {
      usedIndicesRef.current.clear()
    }

    if (usedIndicesRef.current.size < totalWords / 2) {
      let candidate = Math.floor(Math.random() * totalWords)
      while (usedIndicesRef.current.has(candidate)) {
        candidate = Math.floor(Math.random() * totalWords)
      }
      usedIndicesRef.current.add(candidate)
      return OXFORD_3000[candidate]
    } else {
      for (let i = 0; i < totalWords; i++) {
        if (!usedIndicesRef.current.has(i)) {
          availableIndices.push(i)
        }
      }

      if (availableIndices.length === 0) {
        usedIndicesRef.current.clear()
        return OXFORD_3000[Math.floor(Math.random() * totalWords)]
      }

      const randomIndex = Math.floor(Math.random() * availableIndices.length)
      const originalIndex = availableIndices[randomIndex]
      usedIndicesRef.current.add(originalIndex)
      return OXFORD_3000[originalIndex]
    }
  }, [])

  const pickNewWord = useCallback(
    (resetScore = false) => {
      if (isPickingWord.current) return
      isPickingWord.current = true

      setIsErrorShake(false)
      setShowError(false)
      setDisplayedWord(null)
      setIsInputVisible(false)
      setInputDisplay("")
      setTimeLeft(GAME_DURATION_SEC) // Reset Timer

      const word = getNextRandomWord()
      if (!word) return

      const firstChar = word.english[0].toLowerCase()

      if (resetScore) {
        setGameState((prev) => ({ ...prev, score: 0 }))
      }

      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          currentWord: word,
          status: GameStatus.FALLING, // We keep the enum name 'FALLING' as "Active Game State" for simplicity
          inputValue: firstChar,
          score: resetScore ? 0 : prev.score,
        }))

        // Reset timer again explicitly to be safe
        setTimeLeft(GAME_DURATION_SEC)

        setTimeout(() => {
          setInputDisplay(firstChar)
          setIsInputVisible(true)
          isPickingWord.current = false
          setTimeout(() => inputRef.current?.focus(), 50)
        }, 100)
      }, 150)
    },
    [getNextRandomWord],
  )

  const startGame = () => {
    pickNewWord(true)
  }

  const handleNextLevel = () => {
    if (gameState.status === GameStatus.LOSS) {
      startGame()
    } else {
      pickNewWord(false)
    }
  }

  // Timer Loop
  useEffect(() => {
    if (gameState.status === GameStatus.FALLING) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(interval)
            handleTimeOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [gameState.status])

  const handleTimeOut = () => {
    if (!gameState.currentWord) return
    setGameState((prev) => ({
      ...prev,
      status: GameStatus.LOSS,
    }))
    setDisplayedWord(gameState.currentWord)
    setIsInputVisible(false)
  }

  const triggerError = () => {
    setIsErrorShake(true)
    setShowError(true)
    setTimeout(() => setIsErrorShake(false), 400)
    inputRef.current?.focus()
  }

  const triggerWinEffect = () => {
    const duration = 2000
    const end = Date.now() + duration

      ; (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#10b981', '#3b82f6']
        })
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#10b981', '#3b82f6']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      })()
  }

  const handleWin = () => {
    triggerWinEffect()
    setGameState((prev) => {
      const newScore = prev.score + 1
      updateHighScore(newScore)
      return {
        ...prev,
        status: GameStatus.WIN,
        score: newScore,
      }
    })
    setDisplayedWord(gameState.currentWord)
    setIsInputVisible(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING || !isInputVisible) return

    let value = e.target.value.toLowerCase()
    const target = gameState.currentWord?.english.toLowerCase() || ""
    if (value.length < 1) value = target[0]

    setGameState((prev) => ({ ...prev, inputValue: value }))
    setInputDisplay(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If Result is showing, Enter -> Next Level
    if (gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS) {
      if (e.key === "Enter") {
        e.preventDefault() // Prevent default newline
        handleNextLevel()
      }
      return
    }

    if (gameState.status !== GameStatus.FALLING) return

    if (e.key === "Enter") {
      const target = gameState.currentWord?.english.toLowerCase() || ""
      const current = gameState.inputValue.toLowerCase()

      if (current === target) {
        handleWin()
      } else {
        triggerError()
      }
    }
  }

  const isGameActive = gameState.status === GameStatus.FALLING
  const isResultShowing = gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS

  // Auto-focus management to keep keyboard up
  useEffect(() => {
    if (gameState.status !== GameStatus.IDLE) {
      const focusInput = () => {
        // Force focus if lost, but check strict equality to avoid loop
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus()
        }
      }

      const timeout = setTimeout(focusInput, 100)
      return () => clearTimeout(timeout)
    }
  }, [gameState.status, displayedWord])

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-[url('/vocab-game/background.png')] bg-cover bg-center font-sans relative">
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm font-bold text-gray-700 border border-white/50">
          🏆 Top: {highScore}
        </div>
        <div className="bg-amber-100 px-4 py-2 rounded-lg shadow-sm font-bold text-amber-800 border border-amber-200">
          ⭐ Score: {gameState.score}
        </div>
      </div>

      <main className="flex-grow flex flex-col items-center justify-start pt-8 pb-4 relative w-full overflow-y-auto min-h-0">
        {gameState.status === GameStatus.IDLE && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500 p-8">
            <h1 className="text-6xl font-black text-amber-500 tracking-tighter drop-shadow-sm">
              Học từ vựng Tiếng Anh
            </h1>
            <p className="text-gray-500 font-medium text-lg max-w-md mx-auto">
              Gõ từ tiếng Anh tương ứng với nghĩa tiếng Việt đang hiển thị.
            </p>
            <button
              onClick={startGame}
              className="px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl shadow-xl shadow-amber-200 transition-all hover:scale-105 active:scale-95 text-xl"
            >
              BẮT ĐẦU
            </button>
          </div>
        )}

        {isGameActive && (
          <WordDisplay
            word={gameState.currentWord}
            timeLeft={timeLeft}
            totalTime={GAME_DURATION_SEC}
          />
        )}

        {isResultShowing && (
          <InlineResult
            status={gameState.status}
            word={displayedWord}
            onNext={handleNextLevel}
          />
        )}
      </main>

      <footer className="p-6 bg-white border-t border-gray-100 z-20 shrink-0">
        {gameState.status !== GameStatus.IDLE && (
          <div className="max-w-m mx-auto relative">
            <input
              ref={inputRef}
              value={inputDisplay}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              // Always keep enabled to keep keyboard open
              disabled={false}
              className={`w-full text-center text-2xl md:text-4xl font-mono py-2 md:py-4 rounded-xl border-2 transition-all outline-none
              ${showError
                  ? "border-red-400 bg-red-50 text-red-600 animate-shake"
                  : "border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                }
              ${isErrorShake ? "translate-x-[-2px]" : ""} 
              ${!isInputVisible ? "opacity-50 bg-gray-50 text-gray-400" : ""}
            `}
              placeholder={isGameActive ? "Gõ từ tiếng Anh..." : "Nhấn Enter để tiếp tục"}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {isGameActive && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-bold pointer-events-none hidden sm:block">
                PRESS ENTER
              </div>
            )}
          </div>
        )}
      </footer>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  )
}

export default Page
