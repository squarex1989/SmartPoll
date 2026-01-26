import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { calculateResults } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pollId = searchParams.get('pollId')
  const adminToken = searchParams.get('admin')
  const shareToken = searchParams.get('share')

  if (!pollId) {
    return NextResponse.json(
      { success: false, error: '缺少投票ID' },
      { status: 400 }
    )
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: {
          orderBy: { createdAt: 'asc' }
        },
      },
    })

    if (!poll) {
      return NextResponse.json(
        { success: false, error: '投票不存在' },
        { status: 404 }
      )
    }

    // 检查权限
    const isAdmin = adminToken === poll.adminToken
    // 分享令牌：使用 pollId 的前8位 + adminToken的前8位 组合
    const validShareToken = `${poll.id.slice(0, 8)}${poll.adminToken.slice(0, 8)}`
    const isSharedView = shareToken === validShareToken
    
    if (!poll.showResultsToAll && !isAdmin && !isSharedView) {
      return NextResponse.json(
        { success: false, error: '无权限查看结果' },
        { status: 403 }
      )
    }

    // 只计算未排除的投票
    const activeVotes = poll.votes.filter(v => !v.excluded)
    
    const results = calculateResults(
      activeVotes,
      poll.vetoZeroPctThreshold,
      poll.closeDiffPctThreshold
    )

    // 投票是否已截止
    const isClosed = poll.deadline ? new Date() > poll.deadline : false

    // 管理员可以看到完整投票详情（包括排除状态）
    const voteDetails = isAdmin ? poll.votes.map(v => ({
      id: v.id,
      name: v.name,
      scoreA: v.scoreA,
      scoreB: v.scoreB,
      comment: v.comment,
      location: v.location,
      excluded: v.excluded,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })) : null

    // 分享视图：匿名化的投票详情（仅显示未排除的）
    const anonymousVotes = (isSharedView || isAdmin) ? activeVotes.map((v, i) => ({
      index: i + 1,
      scoreA: v.scoreA,
      scoreB: v.scoreB,
    })) : null

    // 统计排除的票数
    const excludedCount = poll.votes.filter(v => v.excluded).length

    return NextResponse.json({
      success: true,
      poll: {
        id: poll.id,
        title: poll.title,
        optionATitle: poll.optionATitle,
        optionADescription: poll.optionADescription,
        optionBTitle: poll.optionBTitle,
        optionBDescription: poll.optionBDescription,
        deadline: poll.deadline,
        isClosed,
      },
      results,
      isAdmin,
      isSharedView,
      voteDetails,      // 仅管理员可见（包含所有票，含排除状态）
      anonymousVotes,   // 分享视图可见（仅未排除的匿名票）
      excludedCount,    // 被排除的票数
      shareToken: isAdmin ? validShareToken : undefined,
      adminToken: isAdmin ? poll.adminToken : undefined,
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { success: false, error: '获取结果失败' },
      { status: 500 }
    )
  }
}
