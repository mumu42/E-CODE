/**
 * @file components/review/FlashcardMode.tsx
 * @description 闪卡模式：正面错误表达，背面修正与解析
 * @author English Agent Team
 * @date 2026-08-21
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
          <p className="text-gray-500">暂无可用错题</p>
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">所有错题已复习完</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          第 {index + 1} / {errors.length} 题
        </span>
        <span className="capitalize">{current.errorType}</span>
      </div>

      <div className="relative h-64 cursor-pointer" onClick={() => setFlipped(!flipped)}>
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: "preserve-3d", perspective: 1000 }}
        >
          {/* 正面 */}
          <Card
            className="absolute inset-0 flex flex-col items-center justify-center p-6 backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardHeader>
              <CardTitle className="text-center">原句</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-center line-through text-red-600">
                {current.original}
              </p>
            </CardContent>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              点击翻转
            </p>
          </Card>

          {/* 背面 */}
          <Card
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <CardHeader>
              <CardTitle className="text-center text-green-700">修正</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <p className="text-lg font-medium text-green-700">{current.correction}</p>
              <CardDescription>{current.explanation}</CardDescription>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex justify-center gap-2">
        <Button variant="outline" onClick={() => handleGrade("hard")}>
          难
        </Button>
        <Button onClick={() => handleGrade("good")}>会</Button>
        <Button variant="outline" onClick={() => handleGrade("easy")}>
          易
        </Button>
      </div>
    </div>
  );
}
