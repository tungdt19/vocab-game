"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { OXFORD_3000 } from "../constants"
import { GameStatus, type GameState, type VocabularyItem } from "../types"
import GameCanvas from "../components/GameCanvas"
import InlineResult from "../components/InlineResult"
import confetti from "canvas-confetti"

const GAME_DURATION_MS = 10000
const UPDATE_INTERVAL_MS = 10
const STEP_INCREMENT = 100 / (GAME_DURATION_MS / UPDATE_INTERVAL_MS)

const Page: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    score: 0,
    status: GameStatus.IDLE,
    inputValue: "",
  })

  const [posPercent, setPosPercent] = useState(0)
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

    // Optimization: If density of used is low, just pick random until unique
    // If density is high, build available list
    if (usedIndicesRef.current.size < totalWords / 2) {
      let candidate = Math.floor(Math.random() * totalWords)
      while (usedIndicesRef.current.has(candidate)) {
        candidate = Math.floor(Math.random() * totalWords)
      }
      usedIndicesRef.current.add(candidate)
      return OXFORD_3000[candidate]
    } else {
      // Build available list for the second half to guarantee termination
      for (let i = 0; i < totalWords; i++) {
        if (!usedIndicesRef.current.has(i)) {
          availableIndices.push(i)
        }
      }

      if (availableIndices.length === 0) {
        // Should not happen due to reset check above, but purely safe fallback
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

      const word = getNextRandomWord()
      if (!word) return // Should not happen

      const firstChar = word.english[0].toLowerCase()

      // Reset score if requested
      if (resetScore) {
        setGameState((prev) => ({ ...prev, score: 0 }))
      }

      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          currentWord: word,
          status: GameStatus.FALLING,
          inputValue: firstChar, // Hint first char
          score: resetScore ? 0 : prev.score,
        }))
        setPosPercent(0)

        setTimeout(() => {
          setInputDisplay(firstChar)
          setIsInputVisible(true)
          isPickingWord.current = false
          // Auto focus
          setTimeout(() => inputRef.current?.focus(), 50)
        }, 100)
      }, 150)
    },
    [getNextRandomWord],
  )

  const startGame = () => {
    // Reset used indices on new game?
    // Maybe not, we want to encounter new words across games.
    // user said "auto random new words", implying ignoring previously seen?
    // Let's keep the set persistent across retries, but if they refresh page it clears.
    pickNewWord(true)
  }

  const handleNextLevel = () => {
    if (gameState.status === GameStatus.LOSS) {
      startGame()
    } else {
      pickNewWord(false)
    }
  }

  // Game Loop
  useEffect(() => {
    if (gameState.status === GameStatus.FALLING) {
      const interval = setInterval(() => {
        setPosPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            handleTimeOut()
            return 100
          }
          return prev + STEP_INCREMENT
        })
      }, UPDATE_INTERVAL_MS)
      return () => clearInterval(interval)
    }
  }, [gameState.status])

  const handleTimeOut = () => {
    if (!gameState.currentWord) return

    // Time out = Wrong
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
          colors: ['#f59e0b', '#10b981', '#3b82f6'] // Amber, Emerald, Blue
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
    setIsInputVisible(false) // Hide input on win
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING || !isInputVisible) return

    let value = e.target.value.toLowerCase()

    // Hint logic: ensure first char is always present/correct if start
    const target = gameState.currentWord?.english.toLowerCase() || ""
    if (value.length < 1) value = target[0]

    setGameState((prev) => ({ ...prev, inputValue: value }))
    setInputDisplay(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING) return

    if (e.key === "Enter") {
      const target = gameState.currentWord?.english.toLowerCase() || ""
      const current = gameState.inputValue.toLowerCase()

      if (current === target) {
        handleWin()
      } else {
        triggerError()
        // Do NOT change status, just shake and let user try again
      }
    }
  }

  const isGameActive = gameState.status === GameStatus.FALLING
  const isResultShowing = gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 font-sans relative">
      <div className="absolute top-4 right-4 z-10 flex gap-4">
        <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm font-bold text-gray-700 border border-white/50">
          🏆 Top: {highScore}
        </div>
        <div className="bg-amber-100 px-4 py-2 rounded-lg shadow-sm font-bold text-amber-800 border border-amber-200">
          ⭐ Score: {gameState.score}
        </div>
      </div>

      <main className="flex-grow flex items-center justify-center relative w-full">
        {gameState.status === GameStatus.IDLE && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500 p-8">
            <h1 className="text-6xl font-black text-amber-500 tracking-tighter drop-shadow-sm">
              FALLING WORDS
            </h1>
            <p className="text-gray-500 font-medium text-lg max-w-md mx-auto">
              Gõ từ tiếng Anh tương ứng với nghĩa tiếng Việt đang rơi xuống.
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
          <GameCanvas
            word={gameState.currentWord}
            posPercent={posPercent}
            status={gameState.status}
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

      <footer className="p-6 bg-white border-t border-gray-100 z-20">
        {gameState.status !== GameStatus.IDLE && (
          <div className="max-w-2xl mx-auto relative">
            <input
              ref={inputRef}
              value={inputDisplay}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isInputVisible}
              className={`w-full text-center text-4xl font-mono py-4 rounded-xl border-2 transition-all outline-none
              ${showError
                  ? "border-red-400 bg-red-50 text-red-600 animate-shake"
                  : "border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                }
              ${isErrorShake ? "translate-x-[-2px]" : ""} 
              ${!isInputVisible ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}
            `}
              placeholder={isGameActive ? "Gõ từ tiếng Anh..." : ""}
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
