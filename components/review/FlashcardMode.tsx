/**
 * @file components/review/FlashcardMode.tsx
 * @description 闪卡模式：正面错误表达，背面修正与解析
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from
"@/components/ui/card";
import type { ErrorItem } from "@/lib/types";
import { RotateCw } from "lucide-react";

interface FlashcardModeProps {
  errors: ErrorItem[];
  onGrade: (id: string, grade: "hard" | "good" | "easy") => void;
}

/** 闪卡模式组件 */
export function FlashcardMode({ errors, onGrade }: FlashcardModeProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const current = errors[index];
  const hasNext = index < errors.length - 1;

  function handleGrade(grade: "hard" | "good" | "easy") {
    if (!current) return;
    onGrade(current.id, grade);
    if (hasNext) {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  }

  if (errors.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">{t("\u6682\u65E0\u53EF\u7528\u9519\u9898")}</p>
        </CardContent>
      </Card>);

  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">{t("\u6240\u6709\u9519\u9898\u5DF2\u590D\u4E60\u5B8C")}</p>
        </CardContent>
      </Card>);

  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{t("\u7B2C")}
          {index + 1} / {errors.length}{t("\u9898")}
        </span>
        <span className="capitalize">{current.errorType}</span>
      </div>

      <div className="relative h-64 cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: "preserve-3d", perspective: 1000 }}>
          
          {/* 正面 */}
          <Card
            className="absolute inset-0 flex flex-col items-center justify-center p-6 backface-hidden"
            style={{ backfaceVisibility: "hidden" }}>
            
            <CardHeader>
              <CardTitle className="text-center">{t("\u539F\u53E5")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-center line-through text-red-600">
                {current.original}
              </p>
            </CardContent>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <RotateCw className="w-3 h-3" />{t("\u70B9\u51FB\u7FFB\u8F6C")}

            </p>
          </Card>

          {/* 背面 */}
          <Card
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            
            <CardHeader>
              <CardTitle className="text-center text-green-700">{t("\u4FEE\u6B63")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-lg font-medium text-green-700">{current.correction}</p>
              <CardDescription>{current.explanation}</CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={() => handleGrade("hard")}>{t("\u96BE")}

        </Button>
        <Button onClick={() => handleGrade("good")}>{t("\u4F1A")}</Button>
        <Button variant="outline" onClick={() => handleGrade("easy")}>{t("\u6613")}

        </Button>
      </div>
    </div>);

}