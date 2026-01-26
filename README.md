# SmartPoll - 智能投票系统

一个公平、透明的团队投票系统，支持预算分配式投票，带有情绪保护机制。

## 功能特点

### 投票机制
- 每位投票者有 **10 分预算**，分配给 A、B 两个方案
- 要求 `A + B = 10`（必须用完）
- 支持 `10/0、7/3、5/5` 等任意整数分配

### 情绪保护
- **反对保护阈值（Veto）**：若某方案 0 分人数占比 ≥ 20%，触发警告
- **微弱优势阈值（Close-call）**：若差距 < 5%，标记为"差距很小"

### 输出状态
1. `CLEAR_WIN` - 明确胜出且无 veto
2. `CLOSE_CALL` - 差距小，建议折中
3. `VETO_RISK` - 胜出方案有较多 0 分反对
4. `TIE` - 完全平局

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npx prisma db push
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 使用流程

1. **创建投票**：在首页填写投票标题和两个方案的信息
2. **分享链接**：将投票链接分享给团队成员
3. **投票**：成员输入名字，使用滑条分配分数
4. **查看结果**：在结果页查看统计数据和状态判断

## 技术栈

- **前端**：Next.js 14 + React 18 + TypeScript
- **样式**：Tailwind CSS
- **数据库**：SQLite + Prisma ORM
- **部署**：支持 Vercel / 自托管

## 项目结构

```
SmartPoll/
├── app/
│   ├── api/
│   │   ├── poll/route.ts      # 投票配置 API
│   │   ├── vote/route.ts      # 投票提交 API
│   │   └── results/route.ts   # 结果查询 API
│   ├── poll/[id]/
│   │   ├── page.tsx           # 投票页面
│   │   └── results/page.tsx   # 结果页面
│   ├── page.tsx               # 首页（创建投票）
│   ├── layout.tsx             # 布局
│   └── globals.css            # 全局样式
├── lib/
│   ├── db.ts                  # 数据库连接
│   └── types.ts               # 类型定义和结果计算
├── prisma/
│   └── schema.prisma          # 数据库模型
└── package.json
```

## 配置说明

### 投票配置参数
- `vetoZeroPctThreshold`：反对保护阈值，默认 0.2（20%）
- `closeDiffPctThreshold`：微弱优势阈值，默认 0.05（5%）
- `showResultsToAll`：是否公开结果，默认 false
- `allowEditBeforeDeadline`：截止前是否允许修改，默认 true

## License

MIT
