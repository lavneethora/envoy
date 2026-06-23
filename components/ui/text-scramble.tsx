"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*"

interface TextScrambleProps {
  text: string
  /** Optional word to scramble INTO on hover. Defaults to `text` (scrambles in place). */
  revealText?: string
  className?: string
}

export function TextScramble({ text, revealText, className = "" }: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isHovering, setIsHovering] = useState(false)
  const [isScrambling, setIsScrambling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const frameRef = useRef(0)
  const targetRef = useRef(text)

  const scrambleTo = useCallback((target: string) => {
    targetRef.current = target
    setIsScrambling(true)
    frameRef.current = 0
    const duration = target.length * 3

    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      frameRef.current++

      const progress = frameRef.current / duration
      const revealedLength = Math.floor(progress * target.length)

      const newText = target
        .split("")
        .map((char, i) => {
          if (char === " ") return " "
          if (i < revealedLength) return target[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join("")

      setDisplayText(newText)

      if (frameRef.current >= duration) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setDisplayText(target)
        setIsScrambling(false)
      }
    }, 30)
  }, [])

  const handleMouseEnter = () => {
    setIsHovering(true)
    scrambleTo(revealText ?? text)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (revealText) scrambleTo(text)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const target = targetRef.current

  return (
    <div
      className={cn(
        "group relative inline-flex flex-col cursor-pointer select-none font-mono text-lg tracking-widest uppercase",
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="relative">
        {displayText.split("").map((char, i) => (
          <span
            key={i}
            className={`inline-block transition-all duration-150 ${
              isScrambling && char !== target[i] ? "text-primary scale-110" : "text-foreground"
            }`}
            style={{
              transitionDelay: `${i * 10}ms`,
            }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </span>

      {/* Animated underline */}
      <span className="relative h-px w-full mt-2 overflow-hidden">
        <span
          className={`absolute inset-0 bg-foreground transition-transform duration-500 ease-out origin-left ${
            isHovering ? "scale-x-100" : "scale-x-0"
          }`}
        />
        <span className="absolute inset-0 bg-border" />
      </span>

      {/* Subtle glow on hover */}
      <span
        className={`absolute -inset-4 rounded-lg bg-primary/5 transition-opacity duration-300 -z-10 ${
          isHovering ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  )
}
