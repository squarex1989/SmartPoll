import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { calculateResults } from '@/lib/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pollId = searchParams.get('pollId')
  const adminToken = searchParams.get('admin')

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
        votes: true,
      },
    })

    if (!poll) {
      return NextResponse.json(
        { success: false, error: '投票不存在' },
        { status: 404 }
      )
    }

    // 检查权限：如果不是公开结果，需要管理员令牌
    const isAdmin = adminToken === poll.adminToken
    if (!poll.showResultsToAll && !isAdmin) {
      return NextResponse.json(
        { success: false, error: '无权限查看结果' },
        { status: 403 }
      )
    }

    const results = calculateResults(
      poll.votes,
      poll.vetoZeroPctThreshold,
      poll.closeDiffPctThreshold
    )

    // 投票是否已截止
    const isClosed = poll.deadline ? new Date() > poll.deadline : false

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
    })
  } catch (error) {
    console.error('Get results error:', error)
    return NextResponse.json(
      { success: false, error: '获取结果失败' },
      { status: 500 }
    )
  }
}
