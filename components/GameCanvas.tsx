"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { GameStatus, type VocabularyItem } from "../types"

interface GameCanvasProps {
  word: VocabularyItem | null
  posPercent: number
  status: GameStatus
}

const GameCanvas: React.FC<GameCanvasProps> = ({ word, posPercent, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (word && status === GameStatus.FALLING) {
      // Draw falling word
      ctx.fillStyle = "#374151" // gray-800
      ctx.font = "bold 48px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const x = canvas.width / 2
      const y = (posPercent / 100) * canvas.height

      ctx.fillText(word.english, x, y)
    }
  }, [word, posPercent, status])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: "linear-gradient(to bottom, #f3f4f6, #e5e7eb)" }}
    />
  )
}

export default GameCanvas