"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { OXFORD_3000 } from "./constants"
import { GameStatus, type GameState } from "./types"
import GameCanvas from "./components/GameCanvas"

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    score: 0,
    status: GameStatus.IDLE,
    inputValue: "",
  })

  const [posPercent, setPosPercent] = useState(0) // 0 to 100
  const [isErrorShake, setIsErrorShake] = useState(false)
  const [showError, setShowError] = useState(false)
  const [inputDisplay, setInputDisplay] = useState("") // Thêm state riêng để kiểm soát hiển thị input, tách biệt hoàn toàn với gameState.inputValue
  const [isInputVisible, setIsInputVisible] = useState(true) // Thêm state riêng để kiểm soát hiển thị input, tách biệt hoàn toàn với gameState.inputValue
  const inputRef = useRef<HTMLInputElement>(null)
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPickingWord = useRef(false) // Thêm ref để ngăn gọi pickNewWord nhiều lần

  const wordQueueRef = useRef<number[]>([])

  const shuffleArray = useCallback((array: number[]): number[] => {
    const shuffled = [...array] // Create copy first
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
      if (isPickingWord.current) return // Ngăn gọi pickNewWord nhiều lần
      isPickingWord.current = true

      clearAutoNext()
      setIsErrorShake(false)
      setShowError(false)

      setIsInputVisible(false) // Ẩn input value hoàn toàn trước khi làm bất cứ điều gì
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
          inputRef.current?.focus() // Focus lại input sau khi hiển thị
        }, 100)
      }, 150)
    },
    [clearAutoNext, refreshWordQueue],
  )

  const startGame = () => {
    refreshWordQueue() // Xáo trộn ngay khi bắt đầu
    pickNewWord(true) // Bắt đầu game với điểm 0
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
    if (gameState.currentWord) {
      const fullWord = gameState.currentWord.english
      setGameState((prev) => ({
        ...prev,
        status: GameStatus.LOSS,
        inputValue: fullWord,
      }))
      setInputDisplay(fullWord)
    }
  }

  const triggerError = () => {
    setIsErrorShake(true)
    setShowError(true)
    setTimeout(() => {
      setIsErrorShake(false)
    }, 400)
  }

  const handleWin = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: GameStatus.WIN,
      score: prev.score + 1,
    }))
    setShowError(false)

    autoNextTimerRef.current = setTimeout(() => {
      pickNewWord(false)
    }, 3000)
  }, [pickNewWord])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING || !isInputVisible) return

    let value = e.target.value.toLowerCase()
    const target = gameState.currentWord?.english.toLowerCase() || ""

    if (value.length < 1) {
      value = target[0]
    }

    setGameState((prev) => ({ ...prev, inputValue: value }))
    setInputDisplay(value)

    if (target.startsWith(value)) {
      setShowError(false)
    }

    if (value === target) {
      handleWin()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameState.status !== GameStatus.FALLING) return // Chỉ xử lý keydown khi đang FALLING, các trạng thái khác để global handler xử lý

    const target = gameState.currentWord?.english.toLowerCase() || ""

    if (e.key === "Enter") {
      if (gameState.inputValue === target) {
        handleWin()
      } else {
        triggerError()
      }
    }
  }

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isPickingWord.current) {
        // Global handler chỉ xử lý WIN/LOSS
        if (gameState.status === GameStatus.LOSS) {
          pickNewWord(true)
        } else if (gameState.status === GameStatus.WIN) {
          clearAutoNext()
          pickNewWord(false)
        }
      }
    }

    if (gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS) {
      window.addEventListener("keydown", handleGlobalKeyDown)
      return () => window.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [gameState.status, pickNewWord, clearAutoNext])

  useEffect(() => {
    if (gameState.status === GameStatus.FALLING && isInputVisible) {
      // Tự động focus input khi game chạy, không phụ thuộc vào isInputVisible
      inputRef.current?.focus()
    }
  }, [gameState.status, isInputVisible])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              ></path>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-tight text-gray-800">Typing Fall</h1>
            <span className="text-amber-600 font-mono text-[10px] uppercase tracking-widest">Oxford 3000 Edition</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Score</p>
            <p className="text-2xl font-mono text-amber-600 leading-none">{gameState.score}</p>
          </div>
        </div>
      </header>

      <main className="relative flex-grow bg-gray-200">
        {gameState.status === GameStatus.IDLE ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
            <div className="text-center px-4">
              <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter text-gray-800">Học Từ Vựng Oxford</h2>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Các từ sẽ xuất hiện ngẫu nhiên và không lặp lại. Gõ đúng để ghi điểm. Nếu thua, điểm sẽ bị reset về 0.
              </p>
            </div>
            <button
              onClick={startGame}
              className="px-10 py-5 bg-amber-500 text-white font-black rounded-full hover:bg-amber-400 transition-all transform hover:scale-105 shadow-lg active:scale-95"
            >
              BẮT ĐẦU NGAY
            </button>
          </div>
        ) : (
          <GameCanvas word={gameState.currentWord} posPercent={posPercent} status={gameState.status} />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 p-6 shadow-lg z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col items-center space-y-3">
            <div
              className={`relative w-full max-w-md transform transition-all duration-300 
              ${gameState.status === GameStatus.WIN ? "scale-105" : ""} 
              ${isErrorShake ? "animate-shake" : ""}`}
            >
              <input
                ref={inputRef}
                type="text"
                value={isInputVisible ? inputDisplay : ""} // Input không còn bị disable khi transition, chỉ dùng isInputVisible để ẩn value
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={gameState.status === GameStatus.IDLE}
                readOnly={gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS}
                className={`w-full bg-gray-100 text-center text-4xl font-mono py-5 px-6 rounded-2xl outline-none border-4 transition-all duration-200 text-gray-800
                  ${
                    gameState.status === GameStatus.WIN
                      ? "border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.3)] text-green-600 bg-green-50"
                      : gameState.status === GameStatus.LOSS
                        ? "border-red-500 text-red-600 shadow-[0_0_25px_rgba(239,68,68,0.3)] bg-red-50"
                        : showError
                          ? "border-red-500 text-red-600"
                          : "border-gray-300 focus:border-amber-500"
                  }`}
                placeholder="Gõ từ tại đây..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />

              {gameState.status === GameStatus.WIN && (
                <div className="absolute -top-8 left-0 right-0 text-center text-green-600 font-bold text-sm animate-pulse tracking-wide">
                  CHÍNH XÁC! TIẾP THEO SAU 3S...
                </div>
              )}
              {gameState.status === GameStatus.LOSS && (
                <div className="absolute -top-8 left-0 right-0 text-center text-red-600 font-bold text-sm tracking-wide">
                  THUA CUỘC! NHẤN ENTER ĐỂ CHƠI LẠI (RESET ĐIỂM)
                </div>
              )}
              {showError &&
                gameState.status === GameStatus.FALLING && ( // Chỉ hiển thị lỗi khi đang trong trạng thái FALLING
                  <div className="absolute -top-8 left-0 right-0 text-center text-red-600 font-bold text-sm tracking-wide">
                    SAI RỒI! HÃY GÕ LẠI...
                  </div>
                )}
            </div>

            {(gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS) && (
              <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                Nhấn{" "}
                <span className="bg-gray-200 border border-gray-300 px-2 py-0.5 rounded text-gray-700 font-mono">
                  ENTER
                </span>{" "}
                để tiếp tục ngay
              </div>
            )}
          </div>

          <div
            className={`transition-all duration-500 overflow-hidden ${gameState.status === GameStatus.WIN || gameState.status === GameStatus.LOSS ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
          >
            {gameState.currentWord && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-xs font-black px-3 py-1 rounded tracking-tighter uppercase ${gameState.status === GameStatus.WIN ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                    >
                      {gameState.status === GameStatus.WIN ? "PASSED" : "FAILED"}
                    </span>
                    <span className="text-gray-800 font-black text-2xl uppercase tracking-tight">
                      {gameState.currentWord.english}
                    </span>
                    <span className="text-gray-500 text-sm font-mono">/{gameState.currentWord.type}/</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-4">
                  <div className="border-l-4 border-amber-500 pl-4">
                    <p className="text-gray-800 text-lg italic leading-relaxed">"{gameState.currentWord.example_en}"</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="text-gray-600 text-lg leading-relaxed vietnamese">
                      {gameState.currentWord.example_vn}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
