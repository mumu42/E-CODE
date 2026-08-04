# 英语学习 Web Agent 技术文档（TSD）

---

## 1. 文档目的

本文档用于指导“英语学习 Web Agent”项目的技术实现，明确系统架构、模块划分、数据流转、本地文件存储方案、AI 接入方式及开发计划。

---

## 2. 技术架构

### 2.1 整体架构

```
─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
│  ┌─────────────┐  ┌─────────────┐  ─────────────────────┐  │
│  │   页面 UI   │  │  状态管理   │  │  本地文件读写模块   │  │
│  │  (Next.js)  │  │  (Zustand)  │  │  (xlsx / docx)      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│  ┌───────────────────────┴────────────────────────────┐   │
│  │            localStorage / IndexedDB                   │   │
│  │              （运行时临时状态）                        │   │
│  └───────────────────────────────────────────────────────┘   │
│                          │                                   │
│         ┌────────────────┘                                   │
│         │                                                     │
│  ──────▼────────────────────────────────────────────────┐  │
│  │              Next.js API Route                         │  │
│  │         （仅用于转发 AI 请求，不存储数据）              │  │
│  └───────────────────────────────────────────────────────┘  │
│         │                                                       │
│  ┌──────▼──────────┐                                            │
│  │  Claude / GPT   │                                            │
│  │   AI Service     │                                            │
│  └───────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 架构特点

- **无数据库**：不依赖 SQLite、PostgreSQL 等任何数据库。
- **无服务端状态**：服务器不存储任何用户数据。
- **本地文件持久化**：用户数据通过 Excel/Word 文件保存在本地。
- **浏览器临时状态**：运行时使用 `localStorage` / `IndexedDB` 缓存。

---

## 3. 技术栈

| 层级 | 技术 | 版本建议 | 说明 |
|------|------|----------|------|
| 前端框架 | **Next.js** | 14+ (App Router) | React 全栈框架，支持 API Route |
| 语言 | **TypeScript** | 5.x | 类型安全 |
| UI 组件 | **Tailwind CSS + shadcn/ui** | 3.x / latest | 原子化样式与组件库 |
| 状态管理 | **Zustand** | 4.x | 轻量全局状态 |
| 本地持久化 | **localStorage / IndexedDB** | - | 运行时临时缓存 |
| Excel 处理 | **xlsx** | latest | 导入/导出 `.xlsx` |
| Word 处理 | **docx** | latest | 导出 `.docx` 报告 |
| Word 解析 | **mammoth** | latest | 读取 `.docx` 内容 |
| AI 调用 | **Claude API / OpenAI API** | latest | 测评、纠错、生成题目 |
| 语音识别/合成 | **Web Speech API** | - | 浏览器原生能力 |
| 部署 | **Vercel** | - | 静态站点部署 |

---

## 4. 目录结构

```
e-code/
├── app/                        # Next.js App Router
│   ├── api/                    # API Route（仅 AI 代理）
│   │   └── ai/
│   │       ├── assess/route.ts
│   │       ├── speak/route.ts
│   │       └── write/route.ts
│   ├── page.tsx                # 首页
│   ├── layout.tsx              # 根布局
│   ├── onboarding/
│   │   └── page.tsx            # 目标选择 + 级别测定
│   ├── dashboard/
│   │   └── page.tsx            # 今日任务面板
│   ├── speak/
│   │   └── page.tsx            # 口语练习
│   ├── write/
│   │   └── page.tsx            # 写作练习
│   └── progress/
│       └── page.tsx            # 学习进度
├── components/                 # 可复用组件
│   ├── ui/                     # shadcn/ui 组件
│   ├── FileImporter.tsx        # 本地文件导入组件
│   ├── FileExporter.tsx        # 本地文件导出组件
│   ├── VoiceRecorder.tsx       # 语音录制/识别组件
│   └── ProgressChart.tsx       # 进度图表
├── lib/                        # 工具库
│   ├── storage/
│   │   ├── local.ts            # localStorage 操作
│   │   ├── excel.ts            # Excel 导入/导出
│   │   └── docx.ts             # Word 导入/导出
│   ├── ai/
│   │   ├── prompts.ts          # Prompt 模板
│   │   └── client.ts           # AI 调用封装
│   └── types.ts                # TypeScript 类型定义
├── hooks/                      # 自定义 Hooks
│   ├── useLocalProfile.ts
│   └── useSpeechRecognition.ts
├── public/                     # 静态资源
├── docs/                       # 文档
│   ├── PRD.md
│   └── TSD.md
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 5. 核心模块设计

### 5.1 状态管理（Zustand + localStorage）

```typescript
// lib/store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  profile: UserProfile | null;
  assessments: AssessmentRecord[];
  sessions: PracticeRecord[];
  setProfile: (p: UserProfile) => void;
  addAssessment: (a: AssessmentRecord) => void;
  addSession: (s: PracticeRecord) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      assessments: [],
      sessions: [],
      setProfile: (p) => set({ profile: p }),
      addAssessment: (a) => set((state) => ({ assessments: [...state.assessments, a] })),
      addSession: (s) => set((state) => ({ sessions: [...state.sessions, s] })),
    }),
    {
      name: 'english-agent-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 5.2 本地文件导入/导出模块

#### 5.2.1 Excel 导入

```typescript
// lib/storage/excel.ts
import * as XLSX from 'xlsx';

export function parseExcelFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      // 解析 profile / sessions / assessments 三个 sheet
      resolve(parseWorkbook(workbook));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
```

#### 5.2.2 Excel 导出

```typescript
export function exportToExcel(data: ExcelData) {
  const workbook = XLSX.utils.book_new();

  const profileSheet = XLSX.utils.json_to_sheet([data.profile]);
  XLSX.utils.book_append_sheet(workbook, profileSheet, 'profile');

  const sessionsSheet = XLSX.utils.json_to_sheet(data.sessions);
  XLSX.utils.book_append_sheet(workbook, sessionsSheet, 'sessions');

  const assessmentsSheet = XLSX.utils.json_to_sheet(data.assessments);
  XLSX.utils.book_append_sheet(workbook, assessmentsSheet, 'assessments');

  XLSX.writeFile(workbook, `english-agent-sessions-${getToday()}.xlsx`);
}
```

#### 5.2.3 Word 导出（学习报告）

```typescript
// lib/storage/docx.ts
import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function exportReportToDocx(report: ReportData) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: '英语学习报告', bold: true, size: 32 })] }),
          new Paragraph({ children: [new TextRun({ text: `日期：${report.date}` })] }),
          ...report.sessions.map((s) => new Paragraph(s.topic)),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `english-agent-report-${report.date}.docx`;
  a.click();
}
```

### 5.3 文件选择器组件

```tsx
// components/FileImporter.tsx
export function FileImporter({ onImport }: { onImport: (data: ExcelData) => void }) {
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx')) {
      const data = await parseExcelFile(file);
      onImport(data);
    } else if (file.name.endsWith('.docx')) {
      // 解析 Word 报告
    }
  };

  return <input type="file" accept=".xlsx,.docx" onChange={handleFile} />;
}
```

### 5.4 AI 调用模块

```typescript
// lib/ai/client.ts
export async function assessLevel(input: AssessmentInput): Promise<AssessmentResult> {
  const res = await fetch('/api/ai/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return res.json();
}
```

```typescript
// app/api/ai/assess/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { answers, sample } = await req.json();

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `根据以下测试答案和样本，评估用户的英语水平，输出 CEFR 等级和各维度得分...\n\n测试答案：${JSON.stringify(answers)}\n口语/写作样本：${sample}`,
      },
    ],
  });

  return Response.json({ result: parseAssessmentResponse(response.content) });
}
```

---

## 6. 数据结构与文件格式

### 6.1 运行时数据结构

```typescript
// lib/types.ts
export type Target = 'SCHOOL' | 'STUDY_ABROAD' | 'CET' | 'IELTS_TOEFL';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type SessionType = 'SPEAK' | 'WRITE';

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  target: Target;
  level: Level;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRecord {
  id: string;
  userId: string;
  date: string;
  target: Target;
  scores: {
    listening?: number;
    speaking?: number;
    reading?: number;
    writing?: number;
    grammar?: number;
  };
  level: Level;
}

export interface PracticeRecord {
  id: string;
  userId: string;
  type: SessionType;
  date: string;
  topic: string;
  scenario: string;
  userInput: string;
  aiFeedback: string;
  grammarScore?: number;
  fluencyScore?: number;
}

export interface ExcelData {
  profile: UserProfile;
  assessments: AssessmentRecord[];
  sessions: PracticeRecord[];
}
```

### 6.2 Excel 文件格式规范

每个 `.xlsx` 文件包含三个 sheet：

| Sheet | 字段 | 说明 |
|-------|------|------|
| **profile** | id, email, name, target, level, createdAt, updatedAt | 用户档案 |
| **assessments** | id, userId, date, target, scores, level | 测评记录 |
| **sessions** | id, userId, type, date, topic, scenario, userInput, aiFeedback, grammarScore, fluencyScore | 练习记录 |

### 6.3 文件命名规范

```
english-agent-profile-{yyyy-MM-dd}.xlsx    # 用户档案与测评记录
english-agent-sessions-{yyyy-MM-dd}.xlsx  # 练习记录
english-agent-report-{yyyy-MM-dd}.docx    # 学习报告
```

---

## 7. 页面路由

| 路由 | 页面 | 功能 |
|------|------|------|
| `/` | 首页 | 产品介绍、开始学习入口 |
| `/onboarding` | 目标选择 + 级别测定 | 选择目标、完成测评 |
| `/dashboard` | 今日任务面板 | 展示今日口语/写作任务 |
| `/speak` | 口语练习 | 场景、录音、AI 反馈 |
| `/write` | 写作练习 | 题目、作文、AI 批改 |
| `/progress` | 学习进度 | 历史记录、能力分析 |

---

## 8. 关键交互流程

### 8.1 首次使用流程

```
用户访问 /
   ↓
点击“开始学习”
   ↓
/onboarding：选择目标 → 完成测评
   ↓
AI 返回级别评定
   ↓
/dasboard：展示今日任务
   ↓
完成练习 → 导出 Excel/Word 到本地
```

### 8.2 导入历史记录流程

```
用户访问 /progress
   ↓
点击“导入历史记录”
   ↓
弹出系统文件选择器 / 拖拽文件
   ↓
浏览器解析 .xlsx / .docx
   ↓
数据写入 Zustand store 和 localStorage
   ↓
页面刷新展示历史记录
```

### 8.3 数据导出流程

```
用户完成练习 / 查看进度
   ↓
点击“导出学习记录”
   ↓
系统读取 Zustand store
   ↓
生成 .xlsx（结构化数据）或 .docx（报告）
   ↓
浏览器触发文件下载
```

---

## 9. AI Prompt 设计

### 9.1 级别测定 Prompt

```text
你是一名专业的英语测评老师。请根据用户的测试答案和口语/写作样本，评估其英语水平。

测试答案：{answers}
样本：{sample}

请输出：
1. CEFR 等级（A1/A2/B1/B2/C1/C2）
2. 各维度得分（满分 100）：听力、口语、阅读、写作、语法
3. 简要评语
4. 学习建议

输出为 JSON 格式。
```

### 9.2 口语练习反馈 Prompt

```text
你是一位英语口语教练。用户的目标人群是 {target}，当前水平为 {level}。

练习场景：{scenario}
题目：{topic}
用户回答：{userInput}

请提供：
1. 语法与表达纠错
2. 更地道的表达方式
3. 发音提示（基于文本中可能的易错点）
4. 综合评分（0-100）
5. 改进建议

输出为 JSON 格式。
```

### 9.3 写作练习批改 Prompt

```text
你是一位英语写作批改老师。用户的目标人群是 {target}，当前水平为 {level}。

题目：{topic}
用户作文：{userInput}

请提供：
1. 语法错误列表（含错误位置、错误类型、正确表达、解释）
2. 词汇/句型升级建议
3. 结构评分（0-100）
4. 总分（0-100）
5. 改进建议

输出为 JSON 格式。
```

---

## 10. 错误处理

| 场景 | 处理方式 |
|------|----------|
| AI 接口超时 | 重试 2 次，仍失败则提示用户稍后重试 |
| AI 返回格式异常 | 前端 fallback 解析，无法解析时展示原始文本 |
| 语音识别失败 | 降级为文字输入，提示用户手动输入 |
| 文件导入失败 | 提示文件格式错误，支持重新选择 |
| 浏览器不支持 Web Speech API | 隐藏语音按钮，提供文字输入 |
| localStorage 容量不足 | 提示用户导出并清理历史记录 |

---

## 11. 安全与隐私

1. **无服务端数据持久化**：用户数据仅保存在浏览器本地和本地文件中。
2. **API Key 安全**：AI 接口 Key 存储在服务端环境变量中，不暴露给前端。
3. **本地文件安全**：文件生成和读取完全在浏览器端完成，不上传服务器。
4. **HTTPS**：生产环境必须启用 HTTPS，保护 API 通信安全。

---

## 12. 性能考虑

1. **AI 请求限制**：单次请求文本长度控制在合理范围，避免过长导致超时或费用过高。
2. **文件解析优化**：大文件解析使用 Web Worker，避免阻塞主线程。
3. **localStorage 容量**：建议单个用户数据不超过 5MB，超出时提示导出。
4. **语音识别**：Web Speech API 为异步调用，注意加载状态提示。

---

## 13. 开发计划

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| Phase 1 | 项目初始化、配置 Tailwind/shadcn、搭建路由 | 0.5 天 |
| Phase 2 | 本地文件导入/导出模块（Excel/Word） | 1 天 |
| Phase 3 | Onboarding：目标选择 + 级别测定 | 1 天 |
| Phase 4 | Dashboard + 口语练习（Web Speech + AI 反馈） | 1.5 天 |
| Phase 5 | 写作练习 + 语法纠错 | 1 天 |
| Phase 6 | Progress 页面 + 历史记录查看 | 0.5 天 |
| Phase 7 | 测试、优化、部署 | 1 天 |

---

## 14. 依赖安装

```bash
# Next.js + shadcn
npx shadcn@latest init --yes --template next --base-color neutral

# 状态管理
npm install zustand

# Excel / Word
npm install xlsx docx mammoth

# AI
npm install @anthropic-ai/sdk

# 图标
npm install lucide-react
```

---

## 15. 环境变量

```env
# .env.local
ANTHROPIC_API_KEY=your_anthropic_api_key
# 或
OPENAI_API_KEY=your_openai_api_key
```
