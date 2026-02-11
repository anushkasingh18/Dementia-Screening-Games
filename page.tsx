'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export default function ReactionGame() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'waitingClick' | 'tooEarly' | 'finished'>('waiting')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [round, setRound] = useState(0)
  const [maxRounds, setMaxRounds] = useState(10)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [correctClicks, setCorrectClicks] = useState(0)
  const [waitStartTime, setWaitStartTime] = useState<number>(0)
  const [clickTime, setClickTime] = useState<number>(0)
  const [user, setUser] = useState<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startGame = () => {
    const settings: any = {
      easy: { rounds: 10, minDelay: 1000, maxDelay: 4000 },
      medium: { rounds: 15, minDelay: 800, maxDelay: 3000 },
      hard: { rounds: 20, minDelay: 500, maxDelay: 2500 },
    }
    const setting = settings[difficulty]
    setMaxRounds(setting.rounds)
    setRound(0)
    setReactionTimes([])
    setCorrectClicks(0)
    nextRound(setting)
  }

  const nextRound = (setting?: any) => {
    if (!setting) {
      const settings: any = {
        easy: { rounds: 10, minDelay: 1000, maxDelay: 4000 },
        medium: { rounds: 15, minDelay: 800, maxDelay: 3000 },
        hard: { rounds: 20, minDelay: 500, maxDelay: 2500 },
      }
      setting = settings[difficulty]
    }

    if (round >= maxRounds) {
      finishGame()
      return
    }

    setGameState('ready')
    const delay = setting.minDelay + Math.random() * (setting.maxDelay - setting.minDelay)
    setWaitStartTime(Date.now())

    timeoutRef.current = setTimeout(() => {
      setGameState('waitingClick')
      setWaitStartTime(Date.now())
    }, delay)
  }

  const handleClick = () => {
    if (gameState === 'ready') {
      // Too early
      setGameState('tooEarly')
      setTimeout(() => {
        setRound(round + 1)
        const settings: any = {
          easy: { rounds: 10, minDelay: 1000, maxDelay: 4000 },
          medium: { rounds: 15, minDelay: 800, maxDelay: 3000 },
          hard: { rounds: 20, minDelay: 500, maxDelay: 2500 },
        }
        nextRound(settings[difficulty])
      }, 1500)
      return
    }

    if (gameState === 'waitingClick') {
      const reactionTime = Date.now() - waitStartTime
      setReactionTimes([...reactionTimes, reactionTime])
      setCorrectClicks(correctClicks + 1)
      setRound(round + 1)

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setTimeout(() => {
        const settings: any = {
          easy: { rounds: 10, minDelay: 1000, maxDelay: 4000 },
          medium: { rounds: 15, minDelay: 800, maxDelay: 3000 },
          hard: { rounds: 20, minDelay: 500, maxDelay: 2500 },
        }
        nextRound(settings[difficulty])
      }, 1000)
    }
  }

  const finishGame = () => {
    const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    const variance = reactionTimes.reduce((acc, time) => acc + Math.pow(time - averageTime, 2), 0) / reactionTimes.length
    const variability = Math.sqrt(variance) / averageTime
    const accuracy = correctClicks / maxRounds

    const results = {
      gameType: 'reaction',
      score: correctClicks,
      level: Math.round((1000 / averageTime) * 10),
      accuracy,
      averageResponseTime: averageTime,
      variability,
      difficulty,
      maxRounds,
      completedAt: new Date().toISOString(),
    }

    setClickTime(Date.now())
    setGameState('finished')

    // Auto-save
    fetch('/api/games/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    }).then(() => {
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    }).catch(console.error)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (gameState === 'waiting') {
    return (
      <div className="container mx-auto px-4 py-12">
        {!user && (
          <div className="mb-4 text-center">
            <div className="inline-block bg-yellow-50 border border-yellow-200 px-4 py-2 rounded">
              <strong>Tip:</strong> <span className="ml-2">Sign in to save your scores to your account.</span>
              <a className="ml-3 text-primary-600 font-medium" href="/auth/login">Sign in</a>
            </div>
          </div>
        )}
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Reaction Time</h1>
            <p className="text-gray-600">Test your reflexes</p>
          </div>

          {/* Difficulty Selection */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Select Difficulty</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-4 px-4 rounded-lg font-medium transition-all ${
                    difficulty === d
                      ? 'bg-primary-600 text-white scale-105'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                  {d === 'easy' && <div className="text-xs">10 rounds</div>}
                  {d === 'medium' && <div className="text-xs">15 rounds</div>}
                  {d === 'hard' && <div className="text-xs">20 rounds</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-2xl font-semibold mb-4">Ready to test your reaction time?</h2>
            <p className="text-gray-600 mb-6">
              Click as quickly as possible when the screen turns green.<br />
              Don&apos;t click too early!
            </p>
            <button onClick={startGame} className="game-button">
              Start Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'finished') {
    const averageTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
    const accuracy = correctClicks / maxRounds

    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card">
            <h2 className="text-3xl font-bold mb-4">Game Complete!</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600">Correct Clicks</p>
                <p className="text-4xl font-bold text-primary-600">{correctClicks}/{maxRounds}</p>
              </div>
              <div>
                <p className="text-gray-600">Average Reaction Time</p>
                <p className="text-3xl font-bold text-primary-600">{averageTime.toFixed(0)}ms</p>
              </div>
              <div>
                <p className="text-gray-600">Accuracy</p>
                <p className="text-3xl font-bold text-primary-600">{(accuracy * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Difficulty</p>
                <p className="text-2xl font-bold text-primary-600">{difficulty.toUpperCase()}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const getScreenColor = () => {
    if (gameState === 'ready') return 'bg-yellow-500'
    if (gameState === 'waitingClick') return 'bg-green-500'
    if (gameState === 'tooEarly') return 'bg-red-500'
    return 'bg-gray-300'
  }

  const getScreenText = () => {
    if (gameState === 'ready') return 'Wait for green...'
    if (gameState === 'waitingClick') return 'CLICK NOW!'
    if (gameState === 'tooEarly') return 'Too early! Wait for green.'
    return ''
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between mb-8">
          <div className="card">
            <div className="text-2xl font-bold text-primary-600">{round}/{maxRounds}</div>
            <div className="text-gray-600">Round</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-primary-600">{correctClicks}</div>
            <div className="text-gray-600">Correct</div>
          </div>
        </div>

        <div
          onClick={handleClick}
          className={`${getScreenColor()} rounded-xl h-96 flex items-center justify-center cursor-pointer transition-colors duration-200`}
        >
          <div className="text-white text-4xl font-bold text-center">
            {getScreenText()}
          </div>
        </div>

        {reactionTimes.length > 0 && (
          <div className="card mt-4">
            <h3 className="font-semibold mb-2">Recent Reaction Times:</h3>
            <div className="flex gap-2 flex-wrap">
              {reactionTimes.slice(-5).map((time, idx) => (
                <span key={idx} className="px-3 py-1 bg-primary-100 text-primary-800 rounded">
                  {time.toFixed(0)}ms
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

