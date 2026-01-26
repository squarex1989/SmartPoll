import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// 创建新投票
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const poll = await prisma.poll.create({
      data: {
        title: body.title || '团队投票',
        optionATitle: body.optionATitle || '方案 A',
        optionADescription: body.optionADescription,
        optionAImage: body.optionAImage,
        optionBTitle: body.optionBTitle || '方案 B',
        optionBDescription: body.optionBDescription,
        optionBImage: body.optionBImage,
        deadline: body.deadline ? new Date(body.deadline) : null,
        vetoZeroPctThreshold: body.vetoZeroPctThreshold ?? 0.2,
        closeDiffPctThreshold: body.closeDiffPctThreshold ?? 0.05,
        showResultsToAll: body.showResultsToAll ?? false,
        allowEditBeforeDeadline: body.allowEditBeforeDeadline ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      poll: {
        id: poll.id,
        adminToken: poll.adminToken,
      },
    })
  } catch (error) {
    console.error('Create poll error:', error)
    return NextResponse.json(
      { success: false, error: '创建投票失败' },
      { status: 500 }
    )
  }
}

// 获取投票信息
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pollId = searchParams.get('id')

  if (!pollId) {
    return NextResponse.json(
      { success: false, error: '缺少投票ID' },
      { status: 400 }
    )
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      return NextResponse.json(
        { success: false, error: '投票不存在' },
        { status: 404 }
      )
    }

    // 不返回 adminToken
    const { adminToken, ...safePoll } = poll

    return NextResponse.json({
      success: true,
      poll: safePoll,
    })
  } catch (error) {
    console.error('Get poll error:', error)
    return NextResponse.json(
      { success: false, error: '获取投票失败' },
      { status: 500 }
    )
  }
}
