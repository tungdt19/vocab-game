"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { OXFORD_3000 } from "../constants"
import { GameStatus, type GameState, type VocabularyItem } from "../types"
import GameCanvas from "../components/GameCanvas"

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

  const inputRef = useRef<HTMLInputElement>(null)
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPickingWord = useRef(false)
  const wordQueueRef = useRef<number[]>([])

  const shuffleArray = useCallback((array: number[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const refreshWordQueue = useCallback(() => {
    const indices = Array.from({ length: OXFORD_3000.length }, (_, i) => i)
    wordQueueRef.current = shuffleArray(indices)
  }, [shuffleArray])

  const clearAutoNext = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current)
      autoNextTimerRef.current = null
    }
  }, [])

  const pickNewWord = useCallback(
    (resetScore = false) => {
      if (isPickingWord.current) return
      isPickingWord.current = true

      clearAutoNext()
      setIsErrorShake(false)
      setShowError(false)
      setDisplayedWord(null)
      setIsInputVisible(false)
      setInputDisplay("")

      if (wordQueueRef.current.length === 0) {
        refreshWordQueue()
      }

      const nextIndex = wordQueueRef.current.shift()!
      const word = OXFORD_3000[nextIndex]
      const firstChar = word.english[0].toLowerCase()

      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          currentWord: word,
          status: GameStatus.FALLING,
          inputValue: firstChar,
          score: resetScore ? 0 : prev.score,
        }))
        setPosPercent(0)

        setTimeout(() => {
          setInputDisplay(firstChar)
          setIsInputVisible(true)
          isPickingWord.current = false
          inputRef.current?.focus()
        }, 100)
      }, 150)
    },
    [clearAutoNext, refreshWordQueue],
  )

  const startGame = () => {
    refreshWordQueue()
    pickNewWord(true)
  }

  useEffect(() => {
    if (gameState.status === GameStatus.FALLING) {
      const interval = setInterval(() => {
        setPosPercent((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            handleTimeOut()
            return 100
          }
          return prev + 0.1
        })
      }, 10)
      return () => clearInterval(interval)
    }
  }, [gameState.status])

  const handleTimeOut = () => {
    if (!gameState.currentWord) return
    const fullWord = gameState.currentWord.english
    setGameState((prev) => ({
      ...prev,
      status: GameStatus.LOSS,
      inputValue: fullWord,
    }))
    setInputDisplay(fullWord)
    setDisplayedWord(gameState.currentWord)
  }

  const triggerError = () => {
    setIsErrorShake(true)
    setShowError(true)
    setTimeout(() => setIsErrorShake(false), 400)
  }

  const handleWin = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: GameStatus.WIN,
      score: prev.score + 1,
    }))
    setShowError(false)
    setDisplayedWord(gameState.currentWord)

    autoNextTimerRef.current = setTimeout(() => {
      pickNewWord(false)
    }, 3000)
  }, [pickNewWord, gameState.currentWord])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING || !isInputVisible) return

    let value = e.target.value.toLowerCase()
    const target = gameState.currentWord?.english.toLowerCase() || ""

    if (value.length < 1) value = target[0]

    setGameState((prev) => ({ ...prev, inputValue: value }))
    setInputDisplay(value)

    if (!target.startsWith(value)) {
      triggerError()
    }

    if (value === target) {
      handleWin()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING) return
    const target = gameState.currentWord?.english.toLowerCase() || ""
    if (e.key === "Enter" && gameState.inputValue !== target) {
      triggerError()
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <main className="flex-grow flex items-center justify-center">
        {gameState.status === GameStatus.IDLE ? (
          <button
            onClick={startGame}
            className="px-10 py-6 bg-amber-500 text-white font-black rounded-full"
          >
            BẮT ĐẦU NGAY
          </button>
        ) : (
          <GameCanvas
            word={gameState.currentWord}
            posPercent={posPercent}
            status={gameState.status}
          />
        )}
      </main>

      <footer className="p-6 bg-white">
        <input
          ref={inputRef}
          value={inputDisplay}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full text-center text-4xl font-mono"
          autoComplete="off"
          spellCheck={false}
        />
      </footer>
    </div>
  )
}

export default Page
