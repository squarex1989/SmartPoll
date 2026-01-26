import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// 提交投票
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pollId, name, scoreA, location } = body

    // 基本验证
    if (!pollId || !name || scoreA === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证分数
    const scoreANum = parseInt(scoreA, 10)
    if (isNaN(scoreANum) || scoreANum < 0 || scoreANum > 10) {
      return NextResponse.json(
        { success: false, error: '分数必须在 0-10 之间' },
        { status: 400 }
      )
    }

    const scoreBNum = 10 - scoreANum

    // 获取投票配置
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    })

    if (!poll) {
      return NextResponse.json(
        { success: false, error: '投票不存在' },
        { status: 404 }
      )
    }

    // 检查截止时间
    if (poll.deadline && new Date() > poll.deadline) {
      return NextResponse.json(
        { success: false, error: '投票已截止' },
        { status: 400 }
      )
    }

    // 获取额外信息
    const userAgent = request.headers.get('user-agent') || undefined

    // Upsert: 同名则更新，否则创建
    const vote = await prisma.vote.upsert({
      where: {
        pollId_name: {
          pollId,
          name: name.trim(),
        },
      },
      update: {
        scoreA: scoreANum,
        scoreB: scoreBNum,
        userAgent,
        location: location || undefined,
        updatedAt: new Date(),
      },
      create: {
        pollId,
        name: name.trim(),
        scoreA: scoreANum,
        scoreB: scoreBNum,
        userAgent,
        location: location || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      vote: {
        id: vote.id,
        name: vote.name,
        scoreA: vote.scoreA,
        scoreB: vote.scoreB,
      },
    })
  } catch (error) {
    console.error('Submit vote error:', error)
    return NextResponse.json(
      { success: false, error: '提交投票失败' },
      { status: 500 }
    )
  }
}

// 查询当前用户的投票
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pollId = searchParams.get('pollId')
  const name = searchParams.get('name')

  if (!pollId || !name) {
    return NextResponse.json(
      { success: false, error: '缺少参数' },
      { status: 400 }
    )
  }

  try {
    const vote = await prisma.vote.findUnique({
      where: {
        pollId_name: {
          pollId,
          name,
        },
      },
    })

    return NextResponse.json({
      success: true,
      vote: vote
        ? {
            scoreA: vote.scoreA,
            scoreB: vote.scoreB,
          }
        : null,
    })
  } catch (error) {
    console.error('Get vote error:', error)
    return NextResponse.json(
      { success: false, error: '查询失败' },
      { status: 500 }
    )
  }
}
