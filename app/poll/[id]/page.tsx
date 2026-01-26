'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Poll {
  id: string
  title: string
  optionATitle: string
  optionADescription?: string | null
  optionBTitle: string
  optionBDescription?: string | null
  deadline?: string | null
  allowEditBeforeDeadline: boolean
  showResultsToAll: boolean
}

export default function VotePage({ params }: { params: { id: string } }) {
  const routeParams = useParams()
  const pollId = (routeParams?.id as string) || params?.id
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [scoreA, setScoreA] = useState(5)
  const [submitted, setSubmitted] = useState(false)
  const [existingVote, setExistingVote] = useState<{ scoreA: number; scoreB: number } | null>(null)
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    loadPoll()
    // 恢复之前输入的名字
    const savedName = localStorage.getItem(`poll_name_${pollId}`)
    if (savedName) {
      setName(savedName)
    }
  }, [pollId])

  // 当名字变化时，检查是否已投票
  useEffect(() => {
    if (name && pollId) {
      checkExistingVote()
    }
  }, [name, pollId])

  const loadPoll = async () => {
    try {
      const res = await fetch(`/api/poll?id=${pollId}`)
      const data = await res.json()
      if (data.success) {
        setPoll(data.poll)
        // 检查是否已截止
        if (data.poll.deadline) {
          setIsClosed(new Date() > new Date(data.poll.deadline))
        }
      }
    } catch (err) {
      console.error('Load poll error:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingVote = async () => {
    try {
      const res = await fetch(`/api/vote?pollId=${pollId}&name=${encodeURIComponent(name)}`)
      const data = await res.json()
      if (data.success && data.vote) {
        setExistingVote(data.vote)
        setScoreA(data.vote.scoreA)
      } else {
        setExistingVote(null)
      }
    } catch (err) {
      console.error('Check vote error:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('请输入你的名字')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          name: name.trim(),
          scoreA,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // 保存名字
        localStorage.setItem(`poll_name_${pollId}`, name.trim())
        setSubmitted(true)
        setExistingVote({ scoreA, scoreB: 10 - scoreA })
      } else {
        alert(data.error || '提交失败')
      }
    } catch (err) {
      alert('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const scoreB = 10 - scoreA
  const sliderProgress = (scoreA / 10) * 100

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-poll-muted animate-pulse">加载中...</div>
      </main>
    )
  }

  if (!poll) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">投票不存在</h1>
          <Link href="/" className="text-poll-accent hover:underline">
            返回首页
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <Link href="/" className="text-poll-accent text-sm hover:underline mb-4 inline-block">
            ← SmartPoll
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {poll.title}
          </h1>
          {poll.deadline && (
            <p className={`text-sm ${isClosed ? 'text-red-400' : 'text-poll-muted'}`}>
              {isClosed ? '⏰ 投票已截止' : `截止时间：${new Date(poll.deadline).toLocaleString('zh-CN')}`}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up animate-stagger-1">
          {/* Option A */}
          <div className="glass rounded-2xl p-6 border-2 border-poll-accent/30 hover:border-poll-accent/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-poll-accent/20 flex items-center justify-center text-poll-accent font-bold text-sm">
                A
              </span>
              <h3 className="font-semibold text-white">{poll.optionATitle}</h3>
            </div>
            {poll.optionADescription && (
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{poll.optionADescription}</p>
            )}
          </div>

          {/* Option B */}
          <div className="glass rounded-2xl p-6 border-2 border-poll-secondary/30 hover:border-poll-secondary/50 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-full bg-poll-secondary/20 flex items-center justify-center text-poll-secondary font-bold text-sm">
                B
              </span>
              <h3 className="font-semibold text-white">{poll.optionBTitle}</h3>
            </div>
            {poll.optionBDescription && (
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{poll.optionBDescription}</p>
            )}
          </div>
        </div>

        {/* Vote Form */}
        {!isClosed ? (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 animate-slide-up animate-stagger-2">
            {/* Name Input */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                你的名字 / 花名
              </label>
              <input
                type="text"
                required
                placeholder="输入你的名字"
                className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-poll-accent/50 focus:ring-2 focus:ring-poll-accent/20 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={checkExistingVote}
              />
              {existingVote && (
                <p className="text-sm text-poll-accent mt-2">
                  ✓ 你已投票：A:{existingVote.scoreA} / B:{existingVote.scoreB}，可以修改
                </p>
              )}
            </div>

            {/* 倾向标题 */}
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">你的倾向</h3>
              <p className="text-sm text-gray-500">
                如果没有明确倾向，可以选择 5/5；如果有强烈倾向，可以选择 10/0 或 0/10
              </p>
            </div>

            {/* Score Display - 数字大小随分数变化，固定高度 */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-center flex-1">
                <div className="h-20 flex items-center justify-center">
                  <div 
                    className="font-bold text-poll-accent transition-all duration-200"
                    style={{ 
                      fontSize: `${2 + scoreA * 0.3}rem`,
                      opacity: 0.4 + scoreA * 0.06
                    }}
                  >
                    {scoreA}
                  </div>
                </div>
                <div className="text-sm text-gray-400">给 A 的分数</div>
              </div>
              <div className="text-gray-500 text-2xl px-4">/</div>
              <div className="text-center flex-1">
                <div className="h-20 flex items-center justify-center">
                  <div 
                    className="font-bold text-poll-secondary transition-all duration-200"
                    style={{ 
                      fontSize: `${2 + scoreB * 0.3}rem`,
                      opacity: 0.4 + scoreB * 0.06
                    }}
                  >
                    {scoreB}
                  </div>
                </div>
                <div className="text-sm text-gray-400">给 B 的分数</div>
              </div>
            </div>

            {/* Slider - 翻转方向：左边给A，右边给B */}
            <div className="mb-8">
              <input
                type="range"
                min="0"
                max="10"
                value={scoreA}
                onChange={(e) => setScoreA(parseInt(e.target.value))}
                className="w-full slider-reversed"
                style={{ '--slider-progress': `${sliderProgress}%` } as React.CSSProperties}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>全给 A</span>
                <span>平分</span>
                <span>全给 B</span>
              </div>
            </div>

            {/* Quick Select */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[0, 3, 5, 7, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setScoreA(score)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    scoreA === score
                      ? 'bg-white text-poll-dark'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  A:{score} / B:{10 - score}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-4 bg-gradient-to-r from-poll-accent to-emerald-500 text-poll-dark font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-poll-accent/20"
            >
              {submitting ? '提交中...' : existingVote ? '更新投票' : '提交投票'}
            </button>

            {submitted && (
              <div className="mt-4 p-4 rounded-xl bg-poll-accent/10 border border-poll-accent/30 text-center animate-fade-in">
                <p className="text-poll-accent font-medium">
                  ✅ 投票成功！A:{scoreA} / B:{scoreB}
                </p>
              </div>
            )}
          </form>
        ) : (
          <div className="glass rounded-2xl p-8 text-center animate-slide-up animate-stagger-2">
            <p className="text-gray-400 mb-4">投票已截止，无法继续投票</p>
          </div>
        )}

        {/* View Results Link */}
        <div className="text-center mt-8 animate-slide-up animate-stagger-3">
          <Link
            href={`/poll/${pollId}/results`}
            className="inline-flex items-center gap-2 text-poll-muted hover:text-white transition-colors"
          >
            <span>查看投票结果</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
