/**
 * @file app/exam/full/page.tsx
 * @description 全真限时模考页面
 * @author English Agent Team
 * @date 2026-08-24
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamTimer } from "@/components/ExamTimer";
import { useAppStore } from "@/lib/store";
import {
  generateReadingPassage,
  generateListeningItem,
  generateWritingTopic,
  generateDailyTopic,
  getWritingFeedback,
  getSpeakFeedback } from
"@/lib/ai/client";
import { useCustomPrompt } from "@/hooks/usePrompts";
import { speak, stopSpeaking, isTTSSupported } from "@/lib/tts";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import type {
  ReadingPassage,
  ExamRecord,
  ExamQuestion,
  ErrorItem,
  ExamQuestionType } from
"@/lib/types";
import { Volume2, Square } from "lucide-react";

const TOTAL_SECONDS = 45 * 60;

type FullExamStep = "reading" | "listening" | "writing" | "speaking" | "result";

interface GeneratedListening {
  transcript: string;
  questions: {question: string;options: string[];answerIndex: number;explanation: string;}[];
}

export default function FullExamPage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const addExamRecord = useAppStore((state) => state.addExamRecord);
  const addErrors = useAppStore((state) => state.addErrors);
  const readingPrompt = useCustomPrompt("reading");
  const listeningPrompt = useCustomPrompt("listening");
  const speakPrompt = useCustomPrompt("speak");
  const writePrompt = useCustomPrompt("write");

  const [step, setStep] = useState<FullExamStep>("reading");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const [reading, setReading] = useState<ReadingPassage | null>(null);
  const [listening, setListening] = useState<GeneratedListening | null>(null);
  const [writingTopic, setWritingTopic] = useState<{title: string;instructions: string;} | null>(null);
  const [speakingTopic, setSpeakingTopic] = useState<{topic: string;scenario: string;} | null>(null);

  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, number>>({});
  const [writingInput, setWritingInput] = useState("");
  const [speakingInput, setSpeakingInput] = useState("");
  const [writingScore, setWritingScore] = useState<number | null>(null);
  const [speakingScore, setSpeakingScore] = useState<number | null>(null);
  const [writingFeedbackText, setWritingFeedbackText] = useState("");
  const [speakingFeedbackText, setSpeakingFeedbackText] = useState("");

  const [sectionScores, setSectionScores] = useState<Partial<Record<ExamQuestionType, number>>>({});
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  const loadMaterials = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [r, l, w, s] = await Promise.all([
      generateReadingPassage(profile.target, profile.level, readingPrompt),
      generateListeningItem(profile.target, profile.level, listeningPrompt),
      generateWritingTopic(profile.target, profile.level, writePrompt),
      generateDailyTopic(profile.target, profile.level, speakPrompt)]
      );
      setReading(r);
      setListening(l);
      setWritingTopic({ title: w.title, instructions: w.instructions });
      setSpeakingTopic({ topic: s.topic, scenario: s.scenario });
    } catch (error) {
      console.error(error);
      alert("生成试卷失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }, [profile, readingPrompt, listeningPrompt, writePrompt, speakPrompt]);

  useEffect(() => {
    if (!profile) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  async function handlePlay(text: string) {
    if (playing) return;
    setPlaying(true);
    try {
      await speak(text, 1);
    } catch (error) {
      console.error(error);
      alert("播放失败，当前浏览器可能不支持 TTS。");
    } finally {
      setPlaying(false);
    }
  }

  function handleStop() {
    stopSpeaking();
    setPlaying(false);
  }

  function calculateObjectiveScore(answers: Record<number, number>, questions: {answerIndex: number;}[]) {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) correct += 1;
    });
    return questions.length > 0 ? Math.round(correct / questions.length * 100) : 0;
  }

  function archiveObjectiveErrors(
  answers: Record<number, number>,
  questions: {question: string;options: string[];answerIndex: number;explanation: string;}[])
  {
    if (!profile) return [];
    const errors: ErrorItem[] = [];
    questions.forEach((q, idx) => {
      if (answers[idx] !== q.answerIndex) {
        errors.push({
          id: crypto.randomUUID(),
          userId: profile.id,
          sessionId: "exam",
          type: "SPEAK",
          date: new Date().toISOString(),
          original: q.options[answers[idx]] ?? "未作答",
          correction: q.options[q.answerIndex],
          explanation: q.explanation,
          errorType: "vocabulary",
          reviewed: false
        });
      }
    });
    return errors;
  }

  function archiveWritingErrors(feedbackText: string, feedbackErrors: {original: string;correction: string;explanation: string;type?: string;}[]) {
    if (!profile) return [];
    return feedbackErrors.map((e) => ({
      id: crypto.randomUUID(),
      userId: profile.id,
      sessionId: "exam-writing",
      type: "WRITE" as const,
      date: new Date().toISOString(),
      original: e.original,
      correction: e.correction,
      explanation: e.explanation,
      errorType: e.type as ErrorItem["errorType"] ?? "grammar",
      reviewed: false
    }));
  }

  function archiveSpeakingErrors(issues: string[]) {
    if (!profile) return [];
    return issues.map((issue) => ({
      id: crypto.randomUUID(),
      userId: profile.id,
      sessionId: "exam-speaking",
      type: "SPEAK" as const,
      date: new Date().toISOString(),
      original: issue,
      correction: "",
      explanation: issue,
      errorType: "grammar" as const,
      reviewed: false
    }));
  }

  function handleReadingSubmit() {
    if (!reading) return;
    const score = calculateObjectiveScore(readingAnswers, reading.questions);
    setSectionScores((prev) => ({ ...prev, reading: score }));
    const errors = archiveObjectiveErrors(readingAnswers, reading.questions);
    if (errors.length > 0) addErrors(errors);
    setStep("listening");
  }

  function handleListeningSubmit() {
    if (!listening) return;
    const score = calculateObjectiveScore(listeningAnswers, listening.questions);
    setSectionScores((prev) => ({ ...prev, listening: score }));
    const errors = archiveObjectiveErrors(listeningAnswers, listening.questions);
    if (errors.length > 0) addErrors(errors);
    setStep("writing");
  }

  async function handleWritingSubmit() {
    if (!profile || !writingTopic) return;
    setLoading(true);
    try {
      const feedback = await getWritingFeedback(
        profile.target,
        profile.level,
        writingTopic.title,
        writingTopic.instructions,
        writingInput
      );
      setWritingScore(feedback.score);
      setWritingFeedbackText(feedback.feedback);
      setSectionScores((prev) => ({ ...prev, writing: feedback.score }));
      const errors = archiveWritingErrors(feedback.feedback, feedback.errors);
      if (errors.length > 0) addErrors(errors);
      setStep("speaking");
    } catch (error) {
      console.error(error);
      alert("写作评分失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSpeakingSubmit() {
    if (!profile || !speakingTopic) return;
    setLoading(true);
    try {
      const feedback = await getSpeakFeedback(
        profile.target,
        profile.level,
        speakingTopic.topic,
        speakingTopic.scenario,
        speakingInput
      );
      setSpeakingScore(feedback.score);
      setSpeakingFeedbackText(feedback.feedback);
      setSectionScores((prev) => ({ ...prev, speaking: feedback.score }));
      const errors = archiveSpeakingErrors([...feedback.grammarIssues, ...feedback.betterExpressions]);
      if (errors.length > 0) addErrors(errors);
      setStep("result");
      finishExam({
        ...sectionScores,
        writing: feedback.score,
        speaking: feedback.score
      });
    } catch (error) {
      console.error(error);
      alert("口语评分失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function finishExam(scores: Partial<Record<ExamQuestionType, number>>) {
    if (!profile || !reading || !listening) return;
    const readingScore = calculateObjectiveScore(readingAnswers, reading.questions);
    const listeningScore = calculateObjectiveScore(listeningAnswers, listening.questions);
    const finalScores: Record<ExamQuestionType, number> = {
      reading: readingScore,
      listening: listeningScore,
      writing: scores.writing ?? writingScore ?? 0,
      speaking: scores.speaking ?? speakingScore ?? 0
    };
    const total = Object.values(finalScores).reduce((a, b) => a + b, 0);
    const average = Math.round(total / 4);

    const questions: ExamQuestion[] = [
    ...reading.questions.map((q, idx) => ({
      id: `reading-${idx}`,
      type: "reading" as const,
      question: q.question,
      options: q.options,
      answer: q.options[q.answerIndex],
      userAnswer: q.options[readingAnswers[idx]] ?? "",
      explanation: q.explanation,
      score: 25
    })),
    ...listening.questions.map((q, idx) => ({
      id: `listening-${idx}`,
      type: "listening" as const,
      question: q.question,
      options: q.options,
      answer: q.options[q.answerIndex],
      userAnswer: q.options[listeningAnswers[idx]] ?? "",
      explanation: q.explanation,
      score: 25
    })),
    {
      id: "writing-1",
      type: "writing" as const,
      question: writingTopic?.title ?? "写作",
      userAnswer: writingInput,
      score: writingScore ?? 0
    },
    {
      id: "speaking-1",
      type: "speaking" as const,
      question: speakingTopic?.topic ?? "口语",
      userAnswer: speakingInput,
      score: speakingScore ?? 0
    }];


    const newRecord: ExamRecord = {
      id: crypto.randomUUID(),
      userId: profile.id,
      type: "FULL",
      startedAt: new Date(Date.now() - (TOTAL_SECONDS - 0) * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      questions,
      totalScore: 100,
      score: average,
      sectionScores: finalScores
    };

    addExamRecord(newRecord);
    setRecord(newRecord);
    setFinished(true);
  }

  if (!profile) return null;

  if (!started) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <h1 className="text-2xl font-bold mb-4">{t("\u5168\u771F\u9650\u65F6\u6A21\u8003")}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{t("\u8003\u8BD5\u5305\u542B\u9605\u8BFB\u3001\u542C\u529B\u3001\u5199\u4F5C\u3001\u53E3\u8BED\u56DB\u4E2A\u90E8\u5206\uFF0C\u9650\u65F6 45 \u5206\u949F\uFF0C\u7531 AI \u81EA\u52A8\u8BC4\u5206\u3002")}

        </p>
        <Button onClick={() => {setStarted(true);loadMaterials();}} size="lg">{t("\u5F00\u59CB\u8003\u8BD5")}

        </Button>
      </div>);

  }

  if (loading || !reading && !listening && !writingTopic && !speakingTopic) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>{t("\u6B63\u5728\u751F\u6210\u8BD5\u5377...")}</p>
      </div>);

  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">{t("\u5168\u771F\u6A21\u8003")}</h1>
        {!finished &&
        <ExamTimer
          seconds={TOTAL_SECONDS}
          onFinish={() => {
            alert("考试时间到，自动提交");
            if (step === "reading") handleReadingSubmit();else
            if (step === "listening") handleListeningSubmit();else
            if (step === "writing") handleWritingSubmit();else
            if (step === "speaking") handleSpeakingSubmit();
          }} />

        }
      </div>

      {step === "reading" && reading &&
      <Card>
          <CardHeader>
            <CardTitle>{t("\u7B2C\u4E00\u90E8\u5206\uFF1A\u9605\u8BFB\u7406\u89E3")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-sm leading-relaxed">
              <h3 className="font-bold mb-2">{reading.title}</h3>
              <p>{reading.passage}</p>
            </div>
            <div className="space-y-4">
              {reading.questions.map((q, qIdx) =>
            <div key={qIdx} className="border rounded-lg p-4 space-y-2">
                  <p className="font-medium">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) =>
                <label
                  key={oIdx}
                  className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-accent">
                  
                        <input
                    type="radio"
                    name={`reading-${qIdx}`}
                    checked={readingAnswers[qIdx] === oIdx}
                    onChange={() =>
                    setReadingAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                    }
                    className="h-4 w-4" />
                  
                        <span className="text-sm">{opt}</span>
                      </label>
                )}
                  </div>
                </div>
            )}
            </div>
            <Button
            onClick={handleReadingSubmit}
            disabled={Object.keys(readingAnswers).length !== reading.questions.length}
            className="w-full">{t("\u63D0\u4EA4\u9605\u8BFB\u90E8\u5206")}


          </Button>
          </CardContent>
        </Card>
      }

      {step === "listening" && listening &&
      <Card>
          <CardHeader>
            <CardTitle>{t("\u7B2C\u4E8C\u90E8\u5206\uFF1A\u542C\u529B\u7406\u89E3")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md space-y-2">
              <div className="flex items-center gap-2">
                <Button onClick={() => handlePlay(listening.transcript)} disabled={playing} type="button">
                  {playing ? <Square className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {playing ? t("\u64AD\u653E\u4E2D...") : t("\u64AD\u653E\u97F3\u9891")}
                </Button>
                {playing &&
              <Button variant="outline" onClick={handleStop} type="button">{t("\u505C\u6B62")}

              </Button>
              }
              </div>
              {!isTTSSupported() && <p className="text-xs text-orange-600">{t("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 TTS\u3002")}</p>}
            </div>
            <div className="space-y-4">
              {listening.questions.map((q, qIdx) =>
            <div key={qIdx} className="border rounded-lg p-4 space-y-2">
                  <p className="font-medium">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) =>
                <label
                  key={oIdx}
                  className="flex items-center gap-2 p-3 rounded-md border cursor-pointer hover:bg-accent">
                  
                        <input
                    type="radio"
                    name={`listening-${qIdx}`}
                    checked={listeningAnswers[qIdx] === oIdx}
                    onChange={() =>
                    setListeningAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                    }
                    className="h-4 w-4" />
                  
                        <span className="text-sm">{opt}</span>
                      </label>
                )}
                  </div>
                </div>
            )}
            </div>
            <Button
            onClick={handleListeningSubmit}
            disabled={Object.keys(listeningAnswers).length !== listening.questions.length}
            className="w-full">{t("\u63D0\u4EA4\u542C\u529B\u90E8\u5206")}


          </Button>
          </CardContent>
        </Card>
      }

      {step === "writing" && writingTopic &&
      <Card>
          <CardHeader>
            <CardTitle>{t("\u7B2C\u4E09\u90E8\u5206\uFF1A\u5199\u4F5C")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-sm">
              <p className="font-bold">{writingTopic.title}</p>
              <p>{writingTopic.instructions}</p>
            </div>
            <textarea
            value={writingInput}
            onChange={(e) => setWritingInput(e.target.value)}
            placeholder={t("\u8BF7\u5728\u6B64\u8F93\u5165\u4F60\u7684\u4F5C\u6587...")}
            className="w-full min-h-[200px] p-3 border rounded-md text-sm" />
          
            <Button onClick={handleWritingSubmit} disabled={writingInput.trim().length < 10 || loading} className="w-full">
              {loading ? t("AI \u8BC4\u5206\u4E2D...") : t("\u63D0\u4EA4\u5199\u4F5C\u5E76\u7EE7\u7EED")}
            </Button>
          </CardContent>
        </Card>
      }

      {step === "speaking" && speakingTopic &&
      <Card>
          <CardHeader>
            <CardTitle>{t("\u7B2C\u56DB\u90E8\u5206\uFF1A\u53E3\u8BED")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md text-sm">
              <p className="font-bold">{t("\u573A\u666F\uFF1A")}{speakingTopic.scenario}</p>
              <p>{speakingTopic.topic}</p>
            </div>
            <VoiceRecorder value={speakingInput} onChange={setSpeakingInput} />
            <Button
            onClick={handleSpeakingSubmit}
            disabled={speakingInput.trim().length < 5 || loading}
            className="w-full">
            
              {loading ? t("AI \u8BC4\u5206\u4E2D...") : t("\u5B8C\u6210\u8003\u8BD5")}
            </Button>
          </CardContent>
        </Card>
      }

      {step === "result" && record &&
      <Card>
          <CardHeader>
            <CardTitle>{t("\u8003\u8BD5\u6210\u7EE9")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-primary">{record.score}{t("\u5206")}</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{t("\u9605\u8BFB")}</p>
                <p className="text-xl font-bold">{record.sectionScores?.reading ?? 0}</p>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{t("\u542C\u529B")}</p>
                <p className="text-xl font-bold">{record.sectionScores?.listening ?? 0}</p>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{t("\u5199\u4F5C")}</p>
                <p className="text-xl font-bold">{record.sectionScores?.writing ?? 0}</p>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">{t("\u53E3\u8BED")}</p>
                <p className="text-xl font-bold">{record.sectionScores?.speaking ?? 0}</p>
              </div>
            </div>
            {writingFeedbackText &&
          <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium">{t("\u5199\u4F5C\u53CD\u9988")}</p>
                <p>{writingFeedbackText}</p>
              </div>
          }
            {speakingFeedbackText &&
          <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium">{t("\u53E3\u8BED\u53CD\u9988")}</p>
                <p>{speakingFeedbackText}</p>
              </div>
          }
            <div className="flex gap-2">
              <Button onClick={() => router.push("/exam/full")}>{t("\u518D\u6765\u4E00\u6B21")}</Button>
              <Button variant="outline" onClick={() => router.push("/progress")}>{t("\u67E5\u770B\u8FDB\u5EA6")}

            </Button>
            </div>
          </CardContent>
        </Card>
      }
    </div>);

}