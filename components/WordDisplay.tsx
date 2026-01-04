import React from "react"
import { VocabularyItem } from "../types"

interface WordDisplayProps {
    word: VocabularyItem | null
    timeLeft: number
    totalTime: number
}

const WordDisplay: React.FC<WordDisplayProps> = ({ word, timeLeft, totalTime }) => {
    if (!word) return null

    const progressPercent = (timeLeft / totalTime) * 100

    // Color transition based on time left
    let progressColor = "bg-green-500"
    if (progressPercent < 60) progressColor = "bg-amber-500"
    if (progressPercent < 30) progressColor = "bg-red-500"

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-8 animate-in zoom-in duration-300">
            {/* Word Card */}
            <div className="w-full bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 text-center relative overflow-hidden">

                {/* Progress Bar (Background or Top) */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                    <div
                        className={`h-full transition-all duration-1000 ease-linear ${progressColor}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Timer Badge */}
                <div className="absolute top-4 right-4 text-gray-400 font-mono text-sm font-bold border border-gray-100 rounded-lg px-2 py-1">
                    {timeLeft}s
                </div>

                <div className="mt-4 space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight leading-tight">
                        {word.vietnamese}
                    </h2>
                    <p className="text-lg text-gray-500 font-medium italic">
                        ({word.type})
                    </p>
                </div>
            </div>
        </div>
    )
}

export default WordDisplay
