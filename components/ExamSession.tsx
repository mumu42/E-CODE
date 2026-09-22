/**
 * @file components/ExamSession.tsx
 * @description 模拟考试会话内容组件
 * @author English Agent Team
 * @date 2026-09-22
 */

"use client";
import { formatDate, formatScore } from "@/lib/i18n/format";
import { t } from "@/lib/i18n/translate";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import { ExamTimer } from "@/components/ExamTimer";
import { generateExamQuestions, EXAM_CONFIGS } from "@/lib/exam/questions";
import { askAdvisor } from "@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { ExamQuestion, ExamRecord } from "@/lib/types";

/** 模拟考试会话内容 */
export function ExamSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") ?? "GENERAL";
  const profile = useAppStore((state) => state.profile);
  const addExamRecord = useAppStore((state) => state.addExamRecord);
  const customQuestions = useAppStore((state) => state.customQuestions);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const startedAtRef = useRef<string>(new Date().toISOString());
  const advisorPrompt = useCustomPrompt("advisor");

  const examType = useMemo(() => {
    const allowed = EXAM_CONFIGS.map((c) => c.type);
    return allowed.includes(typeParam as (typeof EXAM_CONFIGS)[number]["type"]) ?
    typeParam as (typeof EXAM_CONFIGS)[number]["type"] :
    "GENERAL";
  }, [typeParam]);

  const config = useMemo(
    () => EXAM_CONFIGS.find((c) => c.type === examType) ?? EXAM_CONFIGS[0],
    [examType]
  );

  const questions = useMemo(
    () => profile ? generateExamQuestions(examType, config.questionCount, customQuestions) : [],
    [profile, examType, config.questionCount, customQuestions]
  );

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
      const isCorrect = q.answer ? userAnswer === q.answer : false;
      if (q.answer) {
        totalScore += q.score;
        if (isCorrect) score += q.score;
      }
      return { ...q, userAnswer };
    });

    const newRecord: ExamRecord = {
      id: crypto.randomUUID(),
      userId: profile.id,
      type: examType,
      startedAt,
      endedAt,
      questions: answeredQuestions,
      totalScore,
      score
    };

    addExamRecord(newRecord);
    setRecord(newRecord);
    setFinished(true);
  }

  /** 客观题错题列表 */
  const wrongQuestions = useMemo(() => {
    if (!record) return [];
    return record.questions.filter(
      (q): q is ExamQuestion & { userAnswer: string; answer: string } =>
        !!q.answer &&
        !!q.userAnswer &&
        q.userAnswer !== q.answer
    );
  }, [record]);

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
        undefined,
        advisorPrompt
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

  if (!profile) {
    router.replace("/onboarding");
    return null;
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>{t("正在加载试卷...")}</p>
      </div>);

  }

  if (finished && record) {
    const percentage = record.totalScore > 0 ? Math.round(record.score / record.totalScore * 100) : 0;
    const wrongCount = wrongQuestions.length;
    const totalObjective = record.questions.filter((q) => q.answer).length;

    return (
      <div className="container mx-auto px-4 py-8">
        {/* 成绩总览卡片 */}
        <Card className="max-w-2xl mx-auto mb-6">
          <CardHeader>
            <CardTitle>{t("考试成绩")}</CardTitle>
            <CardDescription>
              {config.label} &middot; {formatDate(record.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">{percentage}{t("分")}</div>
            <p className="text-sm text-muted-foreground">{t("得分")}
              {formatScore(record.score)}{t("/ 总分")}{formatScore(record.totalScore)}
            </p>
            <p className="text-sm text-muted-foreground">{t("用时")}
              {Math.ceil((new Date(record.endedAt).getTime() - new Date(record.startedAt).getTime()) / 1000 / 60)}{t("分钟")}
            </p>
            {totalObjective > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("客观题：")}
                <span className="text-green-600">{totalObjective - wrongCount}{t(" 正确")}</span>
                {" \xB7 "}
                <span className="text-red-600">{wrongCount}{t(" 错误")}</span>
                {" / "}{totalObjective}{t("题")}
              </p>
            )}
            <div className="flex gap-2">
              <Button onClick={() => router.push("/exam")}>{t("再来一次")}</Button>
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
                    {t("题 \xB7")}
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
  const isObjective = current.type === "reading" || current.type === "listening";

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
          <CardTitle className="text-base">{t("第")}
            {currentIndex + 1} / {questions.length}{t("题 \xB7")}{current.type}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {current.passage &&
          <div className="p-3 bg-muted rounded-md text-sm leading-relaxed">
              {current.passage}
            </div>
          }
          <p className="font-medium dark:text-white">{current.question}</p>
          {isObjective && current.options ?
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
            placeholder={t("请输入你的答案")}
            value={answers[current.id] ?? ""}
            onChange={(e) => handleSelect(current.id, e.target.value)} />

          }
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}>{t("上一题")}


        </Button>
        <div className="text-sm text-muted-foreground">{t("已答")}
          {Object.keys(answers).length} / {questions.length}
        </div>
        {currentIndex < questions.length - 1 ?
        <Button onClick={() => setCurrentIndex((i) => i + 1)}>{t("下一题")}</Button> :

        <Button onClick={handleSubmit}>{t("提交试卷")}</Button>
        }
      </div>
    </div>);

}
