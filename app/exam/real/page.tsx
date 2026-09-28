/**
 * @file app/exam/real/page.tsx
 * @description 真题模考页面：选择真题类型、限时考试、自动交卷
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";
import { formatDate, formatScore } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { ExamTimer } from "@/components/ExamTimer";
import { useAppStore } from "@/lib/store";
import {
  getRealExamConfigs,
  getRealExamQuestions,
  type RealExamType } from
"@/lib/exam/real/bank";
import { generateExamQuestions, askAdvisor } from "@/lib/ai/client";
import { Volume2, Square, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";
import type { ExamQuestion, ExamRecord, ExamWrongQuestion } from "@/lib/types";

const configs = getRealExamConfigs();

/** 判断题目是否为客观题 */
function isObjective(type: ExamQuestion["type"]) {
  return type === "reading" || type === "listening";
}

export default function RealExamPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addExamRecord = useAppStore((state) => state.addExamRecord);
  const addExamWrongQuestions = useAppStore((state) => state.addExamWrongQuestions);
  const examRecords = useAppStore((state) => state.examRecords);

  const [selectedType, setSelectedType] = useState<RealExamType>("CET4");
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const startedAtRef = useRef<string>(new Date().toISOString());

  const config = configs.find((c) => c.type === selectedType) ?? configs[0];

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u6863\u6848")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
      </div>);

  }

  async function startExam() {
    setLoading(true);
    setGenError(null);
    try {
      // 去重池：取该考试类型近期做过的题目
      const recentRecords = examRecords.filter((r) => r.type === `REAL_${selectedType}`);
      const usedIds = new Set(recentRecords.flatMap((r) => r.questions.map((q) => q.id)));
      const excludeQuestions = Array.from(
        new Set(recentRecords.flatMap((r) => r.questions.map((q) => q.question)))
      );

      let finalQuestions: ExamQuestion[] = [];
      try {
        const aiQuestions = await generateExamQuestions(selectedType, config.questionCount, {
          excludeQuestions,
        });
        // 对同一批 AI 题目按题干文本去重（忽略空白和大小写）
        const seenAi = new Set<string>();
        for (const q of aiQuestions) {
          const key = q.question.trim().toLowerCase();
          if (!seenAi.has(key)) {
            seenAi.add(key);
            finalQuestions.push(q);
          }
        }
        finalQuestions = finalQuestions.slice(0, config.questionCount);
      } catch (aiErr) {
        console.error("AI 出题失败，降级本地题库:", aiErr);
        setGenError("AI 出题失败，已使用本地题库");
      }

      // 本地兜底：AI 失败或数量不足时补足，按题干文本去重，不再循环重复
      if (finalQuestions.length < config.questionCount) {
        const seenLocal = new Set(finalQuestions.map((q) => q.question.trim().toLowerCase()));
        const local = getRealExamQuestions(selectedType).filter(
          (q) =>
            !usedIds.has(q.id) &&
            !seenLocal.has(q.question.trim().toLowerCase())
        );
        finalQuestions = [...finalQuestions, ...local].slice(0, config.questionCount);
      }

      setQuestions(finalQuestions);
      setAnswers({});
      setCurrentIndex(0);
      setFinished(false);
      setRecord(null);
      startedAtRef.current = new Date().toISOString();
      setStarted(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit() {
    if (!profile) return;
    const startedAt = startedAtRef.current;
    const endedAt = new Date().toISOString();
    let score = 0;
    let totalScore = 0;
    const answeredQuestions = questions.map((q) => {
      const userAnswer = answers[q.id] ?? "";
      const answered = { ...q, userAnswer };
      totalScore += q.score;
      if (isObjective(q.type) && q.answer && userAnswer === q.answer) {
        score += q.score;
      }
      return answered;
    });

    const newRecord: ExamRecord = {
      id: crypto.randomUUID(),
      userId: profile.id,
      type: `REAL_${selectedType}`,
      startedAt,
      endedAt,
      questions: answeredQuestions,
      totalScore,
      score
    };

    addExamRecord(newRecord);

    // 抽取客观题答错项进入考试错题库
    const wrongItems: ExamWrongQuestion[] = answeredQuestions
      .filter((q) => isObjective(q.type) && q.answer && q.userAnswer && q.userAnswer !== q.answer)
      .map((q) => ({
        id: crypto.randomUUID(),
        userId: profile.id,
        examRecordId: newRecord.id,
        date: endedAt,
        type: q.type,
        section: q.section,
        examType: q.examType,
        question: q.question,
        passage: q.passage,
        options: q.options,
        answer: q.answer,
        userAnswer: q.userAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        year: q.year,
      }));
    if (wrongItems.length > 0) {
      addExamWrongQuestions(wrongItems);
    }

    setRecord(newRecord);
    setFinished(true);
  }

  async function handlePlay(text: string) {
    if (playing || !isTTSSupported()) return;
    setPlaying(true);
    try {
      await speak(text, 1);
    } catch (error) {
      console.error(error);
    } finally {
      setPlaying(false);
    }
  }

  function handleStop() {
    stopSpeaking();
    setPlaying(false);
  }

  async function handleExplain(q: ExamQuestion) {
    if (!profile) return;
    setExplainingId(q.id);
    const context = [
      `题型：${q.section ?? q.type}`,
      q.examType ? `考试类型：${q.examType}` : "",
      `题干：${q.question}`,
      q.passage ? `材料：${q.passage}` : "",
      q.options ? `选项：${q.options.join(" / ")}` : "",
      q.answer ? `正确答案：${q.answer}` : "",
      q.userAnswer ? `我的答案：${q.userAnswer}` : "",
      q.explanation ? `参考解析：${q.explanation}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await askAdvisor(
        profile.target,
        profile.level,
        "请讲解这道考试错题，说明为什么正确答案对、我的答案错、解题思路与考点，并给出类似例句或类似题。",
        context,
        undefined,
        undefined
      );
      setExplanations((prev) => ({ ...prev, [q.id]: result.reply }));
    } catch (error) {
      console.error(error);
      setExplanations((prev) => ({
        ...prev,
        [q.id]: "解析失败，请稍后重试。",
      }));
    } finally {
      setExplainingId(null);
    }
  }

  if (!started || questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">{t("\u771F\u9898\u6A21\u8003")}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{t("\u9009\u62E9\u771F\u9898\u7C7B\u578B\uFF0C\u6309\u771F\u5B9E\u8003\u8BD5\u65F6\u95F4\u8FDB\u884C\u9650\u65F6\u8BAD\u7EC3\u3002")}

        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {configs.map((item) =>
          <Card
            key={item.type}
            className={`cursor-pointer transition-colors ${
            selectedType === item.type ?
            "border-primary ring-1 ring-primary bg-primary/5" :
            "hover:bg-gray-50 dark:hover:bg-gray-800"}`
            }
            onClick={() => setSelectedType(item.type)}>
            
              <CardHeader>
                <CardTitle className="text-base">{item.label}</CardTitle>
                <CardDescription>
                  {item.duration}{t("\u5206\u949F \xB7")}{item.questionCount}{t("\u9898")}
              </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium dark:text-white">{t("\u5DF2\u9009\u62E9\uFF1A")}
                {config.label}
              </p>
              <p className="text-sm text-muted-foreground">{t("\u9650\u65F6")}
                {config.duration}{t("\u5206\u949F\uFF0C\u5171")}{config.questionCount}{t("\u9898")}
              </p>
            </div>
            <Button onClick={startExam} size="lg" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? t("AI \u51FA\u9898\u4E2D...") : t("\u5F00\u59CB\u771F\u9898\u6A21\u8003")}
            </Button>
          </CardContent>
        </Card>
        {genError &&
        <p className="text-sm text-orange-600 mb-4">{t(genError)}</p>
        }
      </div>);

  }

 if (finished && record) {
    const percentage =
    record.totalScore > 0 ?
    Math.round(record.score / record.totalScore * 100) :
    0;
    const wrongQuestions = record.questions.filter(
      (q): q is ExamQuestion & { userAnswer: string; answer: string } =>
        isObjective(q.type) && !!q.answer && !!q.userAnswer && q.userAnswer !== q.answer
    );
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto mb-6">
          <CardHeader>
            <CardTitle>{t("真题模考成绩")}</CardTitle>
            <CardDescription>
              {config.label} · {formatDate(record.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">{percentage}{t("分")}</div>
            <p className="text-sm text-muted-foreground">{t("得分")}
              {formatScore(record.score)}{t("/ 总分")}{formatScore(record.totalScore)}
            </p>
            {wrongQuestions.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("客观题：")}
                <span className="text-green-600">{record.questions.filter((q) => isObjective(q.type) && q.answer).length - wrongQuestions.length}{t(" 正确")}</span>
                {" · "}
                <span className="text-red-600">{wrongQuestions.length}{t(" 错误")}</span>
                {" / "}{record.questions.filter((q) => isObjective(q.type) && q.answer).length}{t("题")}
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={() => router.push("/exam/real")}>{t("再来一次")}</Button>
              <Button variant="outline" onClick={() => router.push("/progress")}>{t("查看进度")}

              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 错题回顾列表 */}
        {wrongQuestions.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              {t("错题回顾")}
              <span className="text-sm font-normal text-muted-foreground">({wrongQuestions.length}{t("题")})</span>
            </h2>
            {wrongQuestions.map((q) => (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    {t("第")}
                    {
                      record.questions.findIndex(
                        (rq) => rq.id === q.id || rq.question === q.question
                      ) + 1
                    }
                    {t("题 ·")}
                    {q.section ?? q.type}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.passage && (
                    <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
                      {q.passage}
                    </div>
                  )}
                  <p className="font-medium text-sm">{q.question}</p>
                  {q.options && q.options.length > 0 && (
                    <div className="space-y-1.5">
                      {q.options.map((option) => {
                        const isCorrect = option === q.answer;
                        const isUserWrong = option === q.userAnswer && option !== q.answer;
                        return (
                          <div
                            key={option}
                            className={`flex items-center gap-2 p-2.5 rounded-md border text-sm ${
                              isCorrect
                                ? "bg-green-50 border-green-300 text-green-700"
                                : isUserWrong
                                ? "bg-red-50 border-red-300 text-red-700"
                                : ""
                            }`}
                          >
                            {isCorrect && <CheckCircle className="w-4 h-4 shrink-0" />}
                            {isUserWrong && <XCircle className="w-4 h-4 shrink-0" />}
                            <span>{option}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    <p className="text-red-600">
                      {t("你的答案：")}{q.userAnswer}
                    </p>
                    <p className="text-green-600">
                      {t("正确答案：")}{q.answer}
                    </p>
                  </div>
                  {q.explanation && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
                      <p className="font-medium mb-1">{t("参考解析")}</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExplain(q)}
                      disabled={explainingId === q.id}
                    >
                      {explainingId === q.id && (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      )}
                      {t("AI 解析")}
                    </Button>
                  </div>
                  {explanations[q.id] && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md text-sm whitespace-pre-wrap">
                      <p className="font-medium mb-1">{t("AI 详细解析")}</p>
                      <p>{explanations[q.id]}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>);

  }
  const current = questions[currentIndex];
  const objective = isObjective(current.type);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold dark:text-white">{config.label}</h1>
        <ExamTimer
          seconds={config.duration * 60}
          onFinish={() => {
            alert("考试时间到，自动提交");
            handleSubmit();
          }} />
        
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("\u7B2C")}
            {currentIndex + 1} / {questions.length}{t("\u9898 \xB7")}{current.type}
            {current.year && ` · ${current.year}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.type === "listening" && current.passage &&
          <div className="flex items-center gap-2">
              <Button
              type="button"
              onClick={() => handlePlay(current.passage ?? "")}
              disabled={playing}>
              
                {playing ? <Square className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {playing ? t("\u64AD\u653E\u4E2D...") : t("\u64AD\u653E\u97F3\u9891")}
              </Button>
              {playing &&
            <Button type="button" variant="outline" onClick={handleStop}>{t("\u505C\u6B62")}

            </Button>
            }
            </div>
          }
          {current.passage && current.type !== "listening" &&
          <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
              {current.passage}
            </div>
          }
          <p className="font-medium dark:text-white">{current.question}</p>
          {objective && current.options ?
          <div className="space-y-2">
              {current.options.map((option) =>
            <label
              key={option}
              className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-accent">
              
                  <input
                type="radio"
                name={current.id}
                value={option}
                checked={answers[current.id] === option}
                onChange={() => handleSelect(current.id, option)}
                className="h-4 w-4" />
              
                  <span className="text-sm">{option}</span>
                </label>
            )}
            </div> :

          <textarea
            className="w-full min-h-[150px] p-3 border rounded-md text-sm"
            placeholder={t("\u8BF7\u8F93\u5165\u4F60\u7684\u7B54\u6848")}
            value={answers[current.id] ?? ""}
            onChange={(e) => handleSelect(current.id, e.target.value)} />

          }
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}>{t("\u4E0A\u4E00\u9898")}


        </Button>
        <div className="text-sm text-muted-foreground">{t("\u5DF2\u7B54")}
          {Object.keys(answers).length} / {questions.length}
        </div>
        {currentIndex < questions.length - 1 ?
        <Button onClick={() => setCurrentIndex((i) => i + 1)}>{t("\u4E0B\u4E00\u9898")}</Button> :

        <Button onClick={handleSubmit}>{t("\u63D0\u4EA4\u8BD5\u5377")}</Button>
        }
      </div>
      {!isTTSSupported() &&
      <p className="text-xs text-orange-600 mt-2">{t("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 TTS\u3002")}</p>
      }
    </div>);

}