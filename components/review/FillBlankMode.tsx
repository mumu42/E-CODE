/**
 * @file components/review/FillBlankMode.tsx
 * @description 填空模式：根据错题生成挖空句子，用户补全正确表达
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateFillBlank } from "@/lib/review/utils";
import type { ErrorItem } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";

interface FillBlankModeProps {
  errors: ErrorItem[];
  onGrade: (id: string, grade: "hard" | "good" | "easy") => void;
}

/** 填空模式组件 */
export function FillBlankMode({ errors, onGrade }: FillBlankModeProps) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);

  const current = errors[index];
  const blank = current ? generateFillBlank(current.original, current.correction) : null;

  function handleSubmit() {
    setShowResult(true);
  }

  function handleNext(grade: "hard" | "good" | "easy") {
    if (!current) return;
    onGrade(current.id, grade);
    setInput("");
    setShowResult(false);
    setIndex((i) => Math.min(i + 1, errors.length - 1));
  }

  if (errors.length === 0 || !current || !blank) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">{t("\u6682\u65E0\u53EF\u7528\u9519\u9898")}</p>
        </CardContent>
      </Card>);

  }

  const isCorrect = input.trim().toLowerCase() === blank.answer.toLowerCase();
  const grade: "hard" | "good" | "easy" = isCorrect ? "easy" : "hard";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{t("\u7B2C")}
          {index + 1} / {errors.length}{t("\u9898")}
        </span>
        <span className="capitalize">{current.errorType}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("\u586B\u7A7A")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg leading-relaxed">{blank.sentence}</p>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("\u8BF7\u8F93\u5165\u7F3A\u5931\u90E8\u5206")}
            className="w-full h-10 px-3 rounded border text-sm" />
          

          {!showResult ?
          <Button onClick={handleSubmit} disabled={!input.trim()}>{t("\u63D0\u4EA4")}

          </Button> :

          <div className="space-y-4">
              <div
              className={`flex items-start gap-2 p-3 rounded-md ${
              isCorrect ?
              "bg-green-50 text-green-700" :
              "bg-red-50 text-red-700"}`
              }>
              
                {isCorrect ?
              <CheckCircle className="w-5 h-5 mt-0.5" /> :

              <XCircle className="w-5 h-5 mt-0.5" />
              }
                <div>
                  <p className="font-medium">
                    {isCorrect ? "回答正确" : "回答错误"}
                  </p>
                  <p className="text-sm">{t("\u6B63\u786E\u7B54\u6848\uFF1A")}{blank.answer}</p>
                  <p className="text-sm mt-1">{current.explanation}</p>
                </div>
              </div>
              <Button onClick={() => handleNext(grade)}>{t("\u4E0B\u4E00\u9898")}</Button>
            </div>
          }
        </CardContent>
      </Card>
    </div>);

}