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
import { Volume2, Square } from "lucide-react";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";
import type { ExamQuestion, ExamRecord } from "@/lib/types";

const configs = getRealExamConfigs();

/** 判断题目是否为客观题 */
function isObjective(type: ExamQuestion["type"]) {
  return type === "reading" || type === "listening";
}

export default function RealExamPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addExamRecord = useAppStore((state) => state.addExamRecord);

  const [selectedType, setSelectedType] = useState<RealExamType>("CET4");
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());

  const config = configs.find((c) => c.type === selectedType) ?? configs[0];

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("\u8FD8\u6CA1\u6709\u5B66\u4E60\u6863\u6848")}</h1>
        <Button onClick={() => router.push("/onboarding")}>{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
      </div>);

  }

  function startExam() {
    const loaded = getRealExamQuestions(selectedType);
    const padded = [...loaded];
    // 若样题不足，循环填充到配置数量
    while (padded.length < config.questionCount) {
      padded.push(...loaded);
    }
    const final = padded.slice(0, config.questionCount);
    setQuestions(final);
    setAnswers({});
    setCurrentIndex(0);
    setFinished(false);
    setRecord(null);
    startedAtRef.current = new Date().toISOString();
    setStarted(true);
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
            <Button onClick={startExam} size="lg">{t("\u5F00\u59CB\u771F\u9898\u6A21\u8003")}

            </Button>
          </CardContent>
        </Card>
      </div>);

  }

  if (finished && record) {
    const percentage =
    record.totalScore > 0 ?
    Math.round(record.score / record.totalScore * 100) :
    0;
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("\u771F\u9898\u6A21\u8003\u6210\u7EE9")}</CardTitle>
            <CardDescription>
              {config.label} · {formatDate(record.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">{percentage}{t("\u5206")}</div>
            <p className="text-sm text-muted-foreground">{t("\u5F97\u5206")}
              {formatScore(record.score)}{t("/ \u603B\u5206")}{formatScore(record.totalScore)}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/exam/real")}>{t("\u518D\u6765\u4E00\u6B21")}</Button>
              <Button variant="outline" onClick={() => router.push("/progress")}>{t("\u67E5\u770B\u8FDB\u5EA6")}

              </Button>
            </div>
          </CardContent>
        </Card>
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