import type React from "react"
import { useEffect, useState } from "react"
import { GameStatus, type VocabularyItem } from "../types"
import { Check, X, ArrowRight } from "lucide-react"

interface InlineResultProps {
    status: GameStatus
    word: VocabularyItem | null
    onNext: () => void
}

const InlineResult: React.FC<InlineResultProps> = ({ status, word, onNext }) => {
    const [isVisible, setIsVisible] = useState(false)
    const [allowNext, setAllowNext] = useState(false)

    useEffect(() => {
        setIsVisible(true)
        // Safety delay 1s
        const timer = setTimeout(() => setAllowNext(true), 1000)

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && allowNext) {
                onNext()
            }
        }

        // Only attach listener if allowed, OR rely on state inside handler (closure might entrap old state if not careful with deps)
        // Better: attach always, check ref or state
        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            clearTimeout(timer)
        }
    }, [onNext, allowNext]) // Re-bind when allowNext changes

    if (!word || (status !== GameStatus.WIN && status !== GameStatus.LOSS)) {
        return null
    }

    const isWin = status === GameStatus.WIN

    return (
        <div className={`w-full max-w-2xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`
        relative overflow-hidden rounded-2xl border-2 shadow-xl bg-white
        ${isWin ? "border-green-100 shadow-green-100" : "border-red-100 shadow-red-100"}
      `}>
                {/* Header Indicator */}
                <div className={`
          absolute top-0 left-0 w-full h-1.5
          ${isWin ? "bg-green-500" : "bg-red-500"}
        `} />

                <div className="p-4 md:p-8">
                    {/* Status Badge */}
                    <div className="flex justify-center mb-4">
                        <div className={`
              flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider
              ${isWin ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
            `}>
                            {isWin ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            {isWin ? "Chính xác" : "Đã hết giờ"}
                        </div>
                    </div>

                    {/* Word Details */}
                    <div className="text-center space-y-3 mb-4">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-1">
                                {word.english}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-blue-600 font-medium">
                                <span>{word.vietnamese}</span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full uppercase tracking-wide">
                                    {word.type}
                                </span>
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100/50">
                            <div className="flex gap-3 mb-1">
                                <div className="w-1 h-full bg-amber-400 rounded-full shrink-0 min-h-[1rem]" />
                                <p className="text-gray-800 font-medium italic text-base leading-relaxed">
                                    "{word.example_en}"
                                </p>
                            </div>
                            <p className="text-gray-500 pl-4 text-sm">
                                {word.example_vn}
                            </p>
                        </div>
                    </div>

                    {/* Action */}
                    <button
                        onClick={onNext}
                        className={`
              group w-full py-3 md:py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98]
              flex items-center justify-center gap-2
              ${isWin
                                ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                                : "bg-red-500 hover:bg-red-600 shadow-red-200"}
            `}
                    >
                        <span>Tiếp tục</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs ml-1">Enter</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InlineResult
