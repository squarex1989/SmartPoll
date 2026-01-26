import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// 排除或恢复投票
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { voteId, pollId, adminToken, excluded } = body

    if (!voteId || !pollId || !adminToken) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证管理员权限
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      return NextResponse.json(
        { success: false, error: '投票不存在' },
        { status: 404 }
      )
    }

    if (poll.adminToken !== adminToken) {
      return NextResponse.json(
        { success: false, error: '无管理员权限' },
        { status: 403 }
      )
    }

    // 更新投票状态
    const vote = await prisma.vote.update({
      where: { id: voteId },
      data: { excluded: excluded },
    })

    return NextResponse.json({
      success: true,
      vote: {
        id: vote.id,
        excluded: vote.excluded,
      },
    })
  } catch (error) {
    console.error('Exclude vote error:', error)
    return NextResponse.json(
      { success: false, error: '操作失败' },
      { status: 500 }
    )
  }
}
