'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { PollResults, PollStatus } from '@/lib/types'

interface PollInfo {
  id: string
  title: string
  optionATitle: string
  optionADescription?: string | null
  optionBTitle: string
  optionBDescription?: string | null
  deadline?: string | null
  isClosed: boolean
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const routeParams = useParams()
  const pollId = (routeParams?.id as string) || params?.id
  const [poll, setPoll] = useState<PollInfo | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
  }, [pollId])

  const loadResults = async () => {
    try {
      // 检查是否有管理员令牌
      const adminToken = localStorage.getItem(`poll_admin_${pollId}`)
      const url = adminToken
        ? `/api/results?pollId=${pollId}&admin=${adminToken}`
        : `/api/results?pollId=${pollId}`

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        setPoll(data.poll)
        setResults(data.results)
        setIsAdmin(data.isAdmin)
      } else {
        setError(data.error || '获取结果失败')
      }
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status: PollStatus) => {
    switch (status) {
      case 'CLEAR_WIN':
        return 'status-clear-win'
      case 'CLOSE_CALL':
        return 'status-close-call'
      case 'VETO_RISK':
        return 'status-veto-risk'
      case 'TIE':
        return 'status-tie'
      default:
        return ''
    }
  }

  const getStatusIcon = (status: PollStatus) => {
    switch (status) {
      case 'CLEAR_WIN':
        return '🎉'
      case 'CLOSE_CALL':
        return '📊'
      case 'VETO_RISK':
        return '⚠️'
      case 'TIE':
        return '🤝'
      default:
        return '📋'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-poll-muted animate-pulse">加载中...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <Link href={`/poll/${pollId}`} className="text-poll-accent hover:underline">
            返回投票页
          </Link>
        </div>
      </main>
    )
  }

  if (!poll || !results) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-poll-muted">无数据</div>
      </main>
    )
  }

  const total = results.aTotal + results.bTotal
  const aPercent = total > 0 ? (results.aTotal / total) * 100 : 50
  const bPercent = total > 0 ? (results.bTotal / total) * 100 : 50

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <Link href={`/poll/${pollId}`} className="text-poll-accent text-sm hover:underline mb-4 inline-block">
            ← 返回投票
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            {poll.title}
          </h1>
          <p className="text-poll-muted">
            投票结果
            {isAdmin && <span className="ml-2 text-xs bg-poll-accent/20 text-poll-accent px-2 py-1 rounded">管理员</span>}
          </p>
        </div>

        {/* Status Card */}
        <div className={`glass rounded-2xl p-6 mb-8 border-2 animate-slide-up animate-stagger-1 ${getStatusClass(results.status)}`}>
          <div className="text-center">
            <div className="text-4xl mb-3">{getStatusIcon(results.status)}</div>
            <p className="text-lg font-medium text-white">{results.statusMessage}</p>
          </div>
        </div>

        {/* Score Comparison */}
        <div className="glass rounded-2xl p-8 mb-8 animate-slide-up animate-stagger-2">
          <h2 className="font-display text-xl font-semibold text-white mb-6 text-center">
            总分对比
          </h2>

          {/* Visual Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-poll-accent font-semibold">{poll.optionATitle}</span>
              <span className="text-poll-secondary font-semibold">{poll.optionBTitle}</span>
            </div>
            <div className="h-8 rounded-full overflow-hidden flex bg-poll-dark/50">
              <div
                className="bg-gradient-to-r from-poll-accent to-emerald-400 transition-all duration-1000 progress-bar-animated flex items-center justify-center"
                style={{ width: `${aPercent}%` }}
              >
                {aPercent >= 15 && (
                  <span className="text-poll-dark font-bold text-sm">{results.aTotal}</span>
                )}
              </div>
              <div
                className="bg-gradient-to-r from-rose-400 to-poll-secondary transition-all duration-1000 flex items-center justify-center"
                style={{ width: `${bPercent}%` }}
              >
                {bPercent >= 15 && (
                  <span className="text-poll-dark font-bold text-sm">{results.bTotal}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{aPercent.toFixed(1)}%</span>
              <span>{bPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-poll-accent/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-poll-accent">{results.aTotal}</div>
              <div className="text-sm text-gray-400">{poll.optionATitle} 总分</div>
            </div>
            <div className="bg-poll-secondary/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-poll-secondary">{results.bTotal}</div>
              <div className="text-sm text-gray-400">{poll.optionBTitle} 总分</div>
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="glass rounded-2xl p-8 mb-8 animate-slide-up animate-stagger-3">
          <h2 className="font-display text-xl font-semibold text-white mb-6 text-center">
            投票分布
          </h2>

          <div className="space-y-4">
            {/* Total Voters */}
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">总投票人数</span>
              <span className="text-white font-semibold text-xl">{results.totalVotes} 人</span>
            </div>

            {/* Preference Distribution */}
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">偏好 A 的人数</span>
              <span className="text-poll-accent font-semibold">{results.aHigherCount} 人</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">平分 (5/5) 的人数</span>
              <span className="text-gray-300 font-semibold">{results.tieCount} 人</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">偏好 B 的人数</span>
              <span className="text-poll-secondary font-semibold">{results.bHigherCount} 人</span>
            </div>

            {/* Zero Counts (Veto indicator) */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-gray-500 mb-3">强烈反对指标（0分）</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-poll-dark/30 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-poll-accent">{results.aZeroCount}</div>
                  <div className="text-xs text-gray-500">给 A 打 0 分</div>
                  <div className="text-xs text-gray-600">
                    ({results.totalVotes > 0 ? ((results.aZeroCount / results.totalVotes) * 100).toFixed(0) : 0}%)
                  </div>
                </div>
                <div className="bg-poll-dark/30 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-poll-secondary">{results.bZeroCount}</div>
                  <div className="text-xs text-gray-500">给 B 打 0 分</div>
                  <div className="text-xs text-gray-600">
                    ({results.totalVotes > 0 ? ((results.bZeroCount / results.totalVotes) * 100).toFixed(0) : 0}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Diff Percentage */}
        <div className="glass rounded-2xl p-6 mb-8 animate-slide-up animate-stagger-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">差距百分比</span>
            <span className={`text-lg font-semibold ${
              results.diffPercent < 0.05 ? 'text-yellow-400' : 'text-white'
            }`}>
              {(results.diffPercent * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            差距小于 5% 会触发"差距较小"提示
          </p>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="glass rounded-2xl p-6 animate-slide-up animate-stagger-4">
            <h3 className="font-semibold text-white mb-4">管理员操作</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/poll/${pollId}`
                  navigator.clipboard.writeText(shareUrl)
                  alert('投票链接已复制！')
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
              >
                📋 复制投票链接
              </button>
              <button
                onClick={() => {
                  const adminToken = localStorage.getItem(`poll_admin_${pollId}`)
                  const shareUrl = `${window.location.origin}/poll/${pollId}/results?admin=${adminToken}`
                  navigator.clipboard.writeText(shareUrl)
                  alert('管理员结果链接已复制！')
                }}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
              >
                🔑 复制管理员结果链接
              </button>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href={`/poll/${pollId}`}
            className="inline-flex items-center gap-2 text-poll-muted hover:text-white transition-colors"
          >
            <span>←</span>
            <span>返回投票页</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
