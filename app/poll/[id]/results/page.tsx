'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
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

interface VoteDetail {
  name: string
  scoreA: number
  scoreB: number
  createdAt: string
}

interface AnonymousVote {
  index: number
  scoreA: number
  scoreB: number
}

export default function ResultsPage({ params }: { params: { id: string } }) {
  const routeParams = useParams()
  const searchParams = useSearchParams()
  const pollId = (routeParams?.id as string) || params?.id
  const [poll, setPoll] = useState<PollInfo | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSharedView, setIsSharedView] = useState(false)
  const [voteDetails, setVoteDetails] = useState<VoteDetail[] | null>(null)
  const [anonymousVotes, setAnonymousVotes] = useState<AnonymousVote[] | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedShare, setCopiedShare] = useState(false)

  useEffect(() => {
    loadResults()
  }, [pollId])

  const loadResults = async () => {
    try {
      // 检查 URL 中的参数
      const adminTokenFromUrl = searchParams.get('admin')
      const shareTokenFromUrl = searchParams.get('share')
      
      // 检查 localStorage 中的管理员令牌
      const adminToken = adminTokenFromUrl || localStorage.getItem(`poll_admin_${pollId}`)
      
      let url = `/api/results?pollId=${pollId}`
      if (adminToken) url += `&admin=${adminToken}`
      if (shareTokenFromUrl) url += `&share=${shareTokenFromUrl}`

      const res = await fetch(url)
      const data = await res.json()

      if (data.success) {
        setPoll(data.poll)
        setResults(data.results)
        setIsAdmin(data.isAdmin)
        setIsSharedView(data.isSharedView)
        setVoteDetails(data.voteDetails)
        setAnonymousVotes(data.anonymousVotes)
        setShareToken(data.shareToken)
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

  const copyShareLink = () => {
    if (shareToken) {
      const shareUrl = `${window.location.origin}/poll/${pollId}/results?share=${shareToken}`
      navigator.clipboard.writeText(shareUrl)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
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
            {isSharedView && !isAdmin && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">公开分享</span>}
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

        {/* Vote Details - Admin View (with names) */}
        {isAdmin && voteDetails && voteDetails.length > 0 && (
          <div className="glass rounded-2xl p-8 mb-8 animate-slide-up animate-stagger-3">
            <h2 className="font-display text-xl font-semibold text-white mb-6 text-center">
              投票详情 <span className="text-xs text-poll-accent">（仅管理员可见姓名）</span>
            </h2>
            <div className="space-y-3">
              {voteDetails.map((vote, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-poll-dark/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm text-gray-400">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{vote.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-3 py-1 rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: `rgba(0, 212, 170, ${0.1 + vote.scoreA * 0.05})`,
                        color: vote.scoreA >= 5 ? '#00d4aa' : '#6b7280'
                      }}
                    >
                      A:{vote.scoreA}
                    </span>
                    <span 
                      className="px-3 py-1 rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: `rgba(255, 107, 107, ${0.1 + vote.scoreB * 0.05})`,
                        color: vote.scoreB >= 5 ? '#ff6b6b' : '#6b7280'
                      }}
                    >
                      B:{vote.scoreB}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anonymous Vote Details - Shared View */}
        {isSharedView && !isAdmin && anonymousVotes && anonymousVotes.length > 0 && (
          <div className="glass rounded-2xl p-8 mb-8 animate-slide-up animate-stagger-3">
            <h2 className="font-display text-xl font-semibold text-white mb-4 text-center">
              投票明细
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              为保护隐私，投票者姓名已隐藏，但每票均真实记录
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {anonymousVotes.map((vote) => (
                <div 
                  key={vote.index}
                  className="flex items-center justify-between p-2 bg-poll-dark/30 rounded-lg text-sm"
                >
                  <span className="text-gray-500">#{vote.index}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-poll-accent">{vote.scoreA}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-poll-secondary">{vote.scoreB}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up animate-stagger-4">
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
              <button
                onClick={copyShareLink}
                className="w-full py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-white rounded-xl transition-all border border-blue-500/30"
              >
                {copiedShare ? '✅ 已复制！' : '🔗 复制公开分享链接（隐私保护）'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                公开分享链接：任何人可查看结果，但投票者姓名会被隐藏
              </p>
            </div>
          </div>
        )}

        {/* Shared View Notice */}
        {isSharedView && !isAdmin && (
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up border border-blue-500/30">
            <div className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-gray-300 text-sm">
                这是公开分享的投票结果，为保护投票者隐私，姓名已隐藏。
                <br />
                每张选票均已真实记录，确保结果公平透明。
              </p>
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
