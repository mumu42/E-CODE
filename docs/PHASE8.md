# 八期任务规划（Phase 8：翻译模块与翻译错题沉淀）

> 更新日期：2026-09-30
> 备注：Phase 1-7 已完成本地私有 AI 英语学习核心闭环及云化/社交/商业化扩展。本期聚焦翻译能力补齐：新增独立翻译页（单词/句子双模式、英↔中双向），用户自译后由 AI 自评纠错并附带结构化解析，错误自动沉淀为翻译类错题，接入既有 SM-2 复习体系。本期不依赖云化能力，仍遵循「本地优先、完全私有」。

---

## 1. 目标

在七期已有能力基础上，补齐翻译学习闭环：

1. **单词翻译**：输入单词/短语，得到释义、词性、例句与 AI 解析。
2. **句子翻译**：输入英/中句子并自译，AI 对照评分、给参考译文与逐段修正。
3. **AI 解析**：结构化输出语法结构分析、重点词组搭配、翻译技巧点拨、文化/语境注释。
4. **翻译错题沉淀**：AI 自评发现的错误自动入错题本，复用 SM-2 间隔复习。
5. **新增错题类型** `translation`，贯通错题本与复习模块（闪卡/听写/填空/挑战）。

---

## 2. 范围边界

### 2.1 本期包含

- 新增 `app/translate` 独立翻译页
- 单词 / 句子双模式、英→中 / 中→英双向
- `POST /api/ai/translate` 翻译 + 解析接口
- `TranslationAnalysis` 结构化解析（语法 / 搭配 / 技巧 / 文化）
- AI 自评评分（0–100，准确度/流畅度/完整度维度分）
- 翻译错题自动沉淀与去重（复用 `ErrorItem` + SM-2）
- 新增 `translation` 错题类型
- 错题本页面与四种复习模式适配翻译错题
- 翻译 Prompt 自定义（`PromptType: "translation"`）
- 仪表盘与移动端底栏新增翻译入口

### 2.2 本期不包含

- 翻译历史记录独立 UI（数据存 `translationRecords`，本期不做列表页）
- 双语对照导出（`FileExporter` 接入留待后续）
- 真人翻译社区 / 互译批改
- 图片/语音 OCR 翻译
- 多语种扩展（本期仅英↔中）

---

## 3. 需求变更记录

| 变更项 | 七期状态 | 八期计划 |
|--------|----------|----------|
| 翻译能力 | 无独立翻译页，仅有右键选词查词 | 新增 `/translate` 页，单词/句子双模式 + 双向 |
| AI 解析 | 查词返回释义/词性/例句 | 增结构化四区块（语法/搭配/技巧/文化） |
| 错题来源 | 口语/写作/对话纠错 + 模考客观题 | 新增「翻译自评纠错」来源 |
| 错题类型 | 6 类（grammar/vocabulary/spelling/structure/pronunciation/expression） | 追加第 7 类 `translation` |
| 复习模式 | 闪卡/听写/填空/挑战 | 适配翻译错题（正面原文→背面参考译文） |
| Prompt | 10 类自定义 | 增 `translation`，共 11 类 |

---

## 4. 任务清单

### ✅ 任务 1：类型与数据模型扩展（`lib/types.ts`）

- [x] `GrammarError.type` 与 `ErrorItem.errorType` 联合类型追加 `"translation"`。
- [x] 新增 `TranslationAnalysis`（`grammar` / `collocations` / `tips` / `cultureNotes`）。
- [x] 新增 `TranslationRecord`（`mode` / `direction` / `sourceText` / `userTranslation` / `aiTranslation` / `score` / `dimensionScores` / `analysis` / `errors` / `addedToReview`）。
- [x] `AppData` 与 `ProfileData` 增 `translationRecords: TranslationRecord[]`。
- [x] 同步更新数据迁移（`components/DataMigration.tsx`）与默认 store。

**验收**：`tsc` 编译无类型错误；旧档案加载时自动补默认字段。→ ✅

### ✅ 任务 2：翻译 API 与 Prompt

- [x] 新增 `POST /api/ai/translate`（`app/api/ai/translate/route.ts`），入参 `{ mode, direction, sourceText, userTranslation? }`。
- [x] `lib/ai/prompts.ts` 增 `translation` 模板，要求 AI 严格按响应结构输出 JSON（参考译文 + 评分 + 维度分 + errors + analysis）。
- [x] `PromptType` 联合类型追加 `"translation"`，`PromptSettings` 增 `translation` 字段。
- [x] `lib/ai/client.ts` 增 `translateText(params)` 封装。

**验收**：Postman/curl 调用返回合法 JSON；设置页可自定义翻译 Prompt。→ ✅

### ✅ 任务 3：翻译页前端（`app/translate/page.tsx`）

- [x] 模式切换（单词/句子）+ 方向切换（英→中/中→英）。
- [x] 输入区 + 自译区 + 提交按钮（长度限制：单词 ≤60、句子 ≤500；空原文禁用提交）。
- [x] 结果区渐进展示：参考译文（diff 高亮用户与 AI 差异）→ 评分卡片 → AI 解析四区块（可折叠）→ 已加入错题本提示。
- [x] 失败态：「解析失败，请重试」；加载态：骨架屏。
- [x] 翻译记录写入 `translationRecords`；`errors` 非空时写入 `ErrorItem`（`errorType: "translation"`、`sessionId` = 翻译记录 ID）并初始化 SM-2。

**验收**：单词/句子模式均能返回译文 + 四区块解析；句子模式填自译时出评分并自动沉淀错题。→ ✅

### ✅ 任务 4：错题沉淀与去重（`lib/review/utils.ts`）

- [x] 新增 `buildTranslationReviewErrors(record: TranslationRecord): ErrorItem[]`：按句/词粒度生成错题，`original` = 原文、`correction` = 参考译文、`explanation` = AI 错误点说明。
- [x] 复用 `dedupeChatReviewErrors` 策略：同原文按 `errorType + original` 去重，保留最新一条。
- [x] 未填自译（仅查看解析）：不生成错题。

**验收**：同一原文重复翻译出错只保留最新一条；SM-2 字段正确初始化。→ ✅

### ✅ 任务 5：错题本与复习模式适配（`app/review/*`、`components/review/*`）

- [x] `app/review/page.tsx`：分组、筛选、描述文案识别 `translation` 类型。
- [x] `components/review/FlashcardMode` / `DictationMode` / `FillBlankMode` / `ChallengeMode`：适配翻译错题，正面=原文，背面=参考译文；听写模式以参考译文为目标。
- [x] 薄弱点统计（`WeakPoint`）与学习画像（`LearningProfile.commonErrors`）识别 `translation`。

**验收**：翻译错题在错题本按日期分组展示；四种复习模式可正常练习翻译错题。→ ✅

### ✅ 任务 6：导航入口与文档

- [x] 仪表盘快捷区与 `components/MobileNav.tsx` 增「翻译」入口（图标 `Languages`）。
- [x] `README.md` 同步更新翻译模块说明与入口。
- [x] `docs/requirements/translation-module.md` 作为本期需求基线留存。

**验收**：移动端底栏与仪表盘可见翻译入口；README 有翻译模块一节。→ ✅

---

## 5. 接口与数据结构

### 5.1 `POST /api/ai/translate`

请求：
```json
{
  "mode": "sentence",
  "direction": "en2zh",
  "sourceText": "The committee is ambiguous about the proposal.",
  "userTranslation": "委员会对这个提案模棱两可。"
}
```

响应：
```json
{
  "aiTranslation": "委员会对该提案态度不明确。",
  "score": 85,
  "dimensionScores": { "accuracy": 90, "fluency": 85, "completeness": 80 },
  "errors": [
    {
      "original": "ambiguous",
      "correction": "态度不明确 / 模棱两可",
      "explanation": "此处 ambiguous 修饰 committee 态度，译为\"模棱两可\"略口语化，\"态度不明确\"更贴切语境。",
      "errorType": "translation"
    }
  ],
  "analysis": {
    "grammar": {
      "structure": "S + V + P",
      "tense": "一般现在时",
      "keyPoints": ["be ambiguous about sth. 介词搭配", "about 表\"关于\""]
    },
    "collocations": [
      {
        "phrase": "be ambiguous about",
        "usage": "对……态度不明确 / 模棱两可",
        "synonyms": ["be vague about", "be unclear about"]
      }
    ],
    "tips": [
      "ambiguous 修饰人时多指\"态度含糊\"，修饰物/条款时多指\"有歧义\"，需据语境选词。"
    ],
    "cultureNotes": [
      "在正式议会议程语境中，\"态度不明确\"比\"模棱两可\"更书面。"
    ]
  }
}
```

### 5.2 核心类型（摘录）

```ts
interface TranslationAnalysis {
  grammar: { structure: string; tense?: string; keyPoints?: string[] };
  collocations: { phrase: string; usage: string; synonyms?: string[] }[];
  tips: string[];
  cultureNotes: string[];
}

interface TranslationRecord {
  id: string;
  userId: string;
  mode: "word" | "sentence";
  direction: "en2zh" | "zh2en";
  date: string;
  sourceText: string;
  userTranslation?: string;
  aiTranslation: string;
  score?: number;
  dimensionScores?: { accuracy: number; fluency: number; completeness: number };
  analysis: TranslationAnalysis;
  addedToReview: boolean;
}
```

翻译错题复用 `ErrorItem`（`errorType: "translation"`），不另建表。

---

## 6. 边界与约束

- 原文长度：单词 ≤ 60 字符；句子 ≤ 500 字符。
- 非英文且非中文输入：提示「请输入英文或中文」。
- 空原文 / 仅空白：禁用提交。
- AI 调用失败：显示「解析失败，请重试」，不写错题。
- 未填自译：仅出参考译文 + 解析，不评分、不沉淀错题。
- 本地优先：所有数据本地存储、按档案隔离；除 AI 接口外不发起外部请求。

---

## 7. 待确认事项

- [x] 是否需要翻译历史记录列表页（独立于错题本）？→ **本期不做**，数据存 `translationRecords`，留待后续
- [x] 是否支持双语对照复制/导出（接入 `FileExporter`）？→ **本期不做**，留待后续
- [x] 单词模式是否复用已有 `POST /api/ai/word-lookup` 仅扩展解析字段，而非走新 `/api/ai/translate`？→ **独立接口**，`/api/ai/translate` 统一处理单词和句子
