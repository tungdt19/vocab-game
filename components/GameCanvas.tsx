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
      ctx.fillStyle = "#1f2937" // gray-900
      ctx.font = "bold 32px 'Inter', sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const x = canvas.width / 2
      const maxWidth = canvas.width * 0.8
      const lineHeight = 40

      const words = word.vietnamese.split(' ')
      let line = ''
      const lines = []

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width
        if (testWidth > maxWidth && n > 0) {
          lines.push(line)
          line = words[n] + ' '
        } else {
          line = testLine
        }
      }
      lines.push(line)

      const totalHeight = lines.length * lineHeight
      let y = (posPercent / 100) * (canvas.height - totalHeight)

      // Ensure y doesn't go below start
      if (y < totalHeight) y = totalHeight

      // Recalculate y based on center of text block? 
      // Simplified: current Y is top of the text block? 
      // The original code was y = (posPercent / 100) * canvas.height.
      // Let's stick to the center being roughly at posPercent

      const startY = (posPercent / 100) * canvas.height - (totalHeight / 2)

      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), x, startY + (i * lineHeight))
      })
      // Draw TYPE below
      ctx.font = "italic 20px 'Inter', sans-serif"
      ctx.fillStyle = "#6b7280" // gray-500
      ctx.fillText(`(${word.type})`, x, startY + (lines.length * lineHeight) + 10)
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