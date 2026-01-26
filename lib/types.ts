export interface Poll {
  id: string
  title: string
  optionATitle: string
  optionADescription?: string | null
  optionAImage?: string | null
  optionBTitle: string
  optionBDescription?: string | null
  optionBImage?: string | null
  deadline?: Date | null
  vetoZeroPctThreshold: number
  closeDiffPctThreshold: number
  showResultsToAll: boolean
  allowEditBeforeDeadline: boolean
  adminToken: string
  createdAt: Date
  updatedAt: Date
}

export interface Vote {
  id: string
  pollId: string
  name: string
  scoreA: number
  scoreB: number
  userAgent?: string | null
  ipHash?: string | null
  createdAt: Date
  updatedAt: Date
}

export type PollStatus = 'CLEAR_WIN' | 'CLOSE_CALL' | 'VETO_RISK' | 'TIE' | 'NO_VOTES'

export interface PollResults {
  totalVotes: number
  aTotal: number
  bTotal: number
  aZeroCount: number
  bZeroCount: number
  aHigherCount: number
  bHigherCount: number
  tieCount: number
  diffPercent: number
  winner: 'A' | 'B' | 'TIE' | null
  status: PollStatus
  statusMessage: string
}

export function calculateResults(
  votes: Vote[],
  vetoThreshold: number = 0.2,
  closeThreshold: number = 0.05
): PollResults {
  const n = votes.length

  if (n === 0) {
    return {
      totalVotes: 0,
      aTotal: 0,
      bTotal: 0,
      aZeroCount: 0,
      bZeroCount: 0,
      aHigherCount: 0,
      bHigherCount: 0,
      tieCount: 0,
      diffPercent: 0,
      winner: null,
      status: 'NO_VOTES',
      statusMessage: '暂无投票数据',
    }
  }

  const aTotal = votes.reduce((sum, v) => sum + v.scoreA, 0)
  const bTotal = votes.reduce((sum, v) => sum + v.scoreB, 0)

  const aZeroCount = votes.filter((v) => v.scoreA === 0).length
  const bZeroCount = votes.filter((v) => v.scoreB === 0).length

  const aHigherCount = votes.filter((v) => v.scoreA > v.scoreB).length
  const bHigherCount = votes.filter((v) => v.scoreB > v.scoreA).length
  const tieCount = votes.filter((v) => v.scoreA === v.scoreB).length

  const total = aTotal + bTotal
  const diffPercent = total > 0 ? Math.abs(aTotal - bTotal) / total : 0

  let winner: 'A' | 'B' | 'TIE'
  if (aTotal > bTotal) {
    winner = 'A'
  } else if (bTotal > aTotal) {
    winner = 'B'
  } else {
    winner = 'TIE'
  }

  // 计算胜出方案的 0 分反对比例
  let winnerZeroPct: number
  if (winner === 'A') {
    winnerZeroPct = aZeroCount / n
  } else if (winner === 'B') {
    winnerZeroPct = bZeroCount / n
  } else {
    winnerZeroPct = Math.max(aZeroCount, bZeroCount) / n
  }

  let status: PollStatus
  let statusMessage: string

  if (winner === 'TIE') {
    status = 'TIE'
    statusMessage = '两个方案得分完全相同，建议抽签或折中！'
  } else if (winnerZeroPct >= vetoThreshold) {
    status = 'VETO_RISK'
    statusMessage = `⚠️ 方案 ${winner} 虽然总分较高，但有 ${Math.round(winnerZeroPct * 100)}% 的人给了 0 分，建议组织者介入协调`
  } else if (diffPercent < closeThreshold) {
    status = 'CLOSE_CALL'
    statusMessage = `📊 差距很小（仅 ${(diffPercent * 100).toFixed(1)}%），建议考虑折中方案或混合安排`
  } else {
    status = 'CLEAR_WIN'
    statusMessage = `🎉 方案 ${winner} 明确胜出！`
  }

  return {
    totalVotes: n,
    aTotal,
    bTotal,
    aZeroCount,
    bZeroCount,
    aHigherCount,
    bHigherCount,
    tieCount,
    diffPercent,
    winner,
    status,
    statusMessage,
  }
}
