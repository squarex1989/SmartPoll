'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    optionATitle: '',
    optionADescription: '',
    optionBTitle: '',
    optionBDescription: '',
    deadline: '',
    showResultsToAll: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          deadline: formData.deadline || null,
        }),
      })

      const data = await res.json()
      if (data.success) {
        // 保存管理员令牌到 localStorage
        localStorage.setItem(`poll_admin_${data.poll.id}`, data.poll.adminToken)
        router.push(`/poll/${data.poll.id}`)
      } else {
        alert(data.error || '创建失败')
      }
    } catch (err) {
      alert('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="font-display text-5xl font-bold mb-4 bg-gradient-to-r from-poll-accent via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            SmartPoll
          </h1>
          <p className="text-poll-muted text-lg">
            公平、透明的团队投票系统
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 animate-slide-up animate-stagger-1">
          <h2 className="font-display text-2xl font-semibold mb-6 text-white">
            创建新投票
          </h2>

          {/* 投票标题 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              投票标题
            </label>
            <input
              type="text"
              required
              placeholder="例如：周末团建活动选择"
              className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-poll-accent/50 focus:ring-2 focus:ring-poll-accent/20 transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* 方案 A */}
          <div className="mb-6 p-4 rounded-xl bg-poll-accent/5 border border-poll-accent/20">
            <h3 className="text-poll-accent font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-poll-accent/20 flex items-center justify-center text-sm">A</span>
              方案 A
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                required
                placeholder="方案名称（如：爬山）"
                className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-poll-accent/50 transition-all"
                value={formData.optionATitle}
                onChange={(e) => setFormData({ ...formData, optionATitle: e.target.value })}
              />
              <textarea
                placeholder="方案描述（地点、时间、费用等）"
                rows={3}
                className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-poll-accent/50 transition-all resize-none"
                value={formData.optionADescription}
                onChange={(e) => setFormData({ ...formData, optionADescription: e.target.value })}
              />
            </div>
          </div>

          {/* 方案 B */}
          <div className="mb-6 p-4 rounded-xl bg-poll-secondary/5 border border-poll-secondary/20">
            <h3 className="text-poll-secondary font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-poll-secondary/20 flex items-center justify-center text-sm">B</span>
              方案 B
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                required
                placeholder="方案名称（如：密室逃脱）"
                className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-poll-secondary/50 transition-all"
                value={formData.optionBTitle}
                onChange={(e) => setFormData({ ...formData, optionBTitle: e.target.value })}
              />
              <textarea
                placeholder="方案描述（地点、时间、费用等）"
                rows={3}
                className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-poll-secondary/50 transition-all resize-none"
                value={formData.optionBDescription}
                onChange={(e) => setFormData({ ...formData, optionBDescription: e.target.value })}
              />
            </div>
          </div>

          {/* 截止时间 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              截止时间（可选）
            </label>
            <input
              type="datetime-local"
              className="w-full px-4 py-3 bg-poll-dark/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-poll-accent/50 transition-all"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          {/* 公开结果 */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-white/20 bg-poll-dark/50 text-poll-accent focus:ring-poll-accent/20"
                checked={formData.showResultsToAll}
                onChange={(e) => setFormData({ ...formData, showResultsToAll: e.target.checked })}
              />
              <span className="text-gray-300">允许所有人查看结果</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-8">
              关闭后仅管理员可查看（使用管理链接）
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-poll-accent to-emerald-500 text-poll-dark font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-poll-accent/20"
          >
            {loading ? '创建中...' : '创建投票 →'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          每位投票者将获得 10 分预算，分配给两个方案
        </p>
      </div>
    </main>
  )
}
