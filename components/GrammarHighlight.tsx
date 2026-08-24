/**
 * @file components/GrammarHighlight.tsx
 * @description 在用户原文中高亮语法/表达错误
 * @author English Agent Team
 * @date 2026-08-24
 */

import { useMemo } from "react";

interface ErrorSpan {
  start: number;
  end: number;
  original: string;
  correction: string;
  explanation: string;
}

interface GrammarHighlightProps {
  /** 用户原文 */
  text: string;
  /** 错误列表，包含 original / correction / explanation */
  errors: { original: string; correction: string; explanation: string }[];
  /** 高亮类名 */
  className?: string;
}

/**
 * 语法高亮组件
 * @example
 * ```tsx
 * <GrammarHighlight text={userInput} errors={feedback.errors} />
 * ```
 */
export function GrammarHighlight({ text, errors, className }: GrammarHighlightProps) {
  const spans = useMemo(() => {
    const result: ErrorSpan[] = [];

    for (const err of errors) {
      if (!err.original) continue;
      const normalized = err.original.trim();
      if (!normalized) continue;

      let index = text.toLowerCase().indexOf(normalized.toLowerCase());
      while (index !== -1) {
        result.push({
          start: index,
          end: index + normalized.length,
          original: err.original,
          correction: err.correction,
          explanation: err.explanation,
        });
        index = text.toLowerCase().indexOf(normalized.toLowerCase(), index + 1);
      }
    }

    // 合并重叠区间，保留先出现的
    result.sort((a, b) => a.start - b.start);
    const merged: ErrorSpan[] = [];
    for (const span of result) {
      const last = merged[merged.length - 1];
      if (last && span.start < last.end) {
        // 重叠，扩展或跳过
        last.end = Math.max(last.end, span.end);
        last.correction += `; ${span.correction}`;
        last.explanation += `; ${span.explanation}`;
      } else {
        merged.push(span);
      }
    }

    return merged;
  }, [text, errors]);

  if (!text || spans.length === 0) return <p className={className}>{text}</p>;

  const elements: React.ReactNode[] = [];
  let lastEnd = 0;

  spans.forEach((span, idx) => {
    if (span.start > lastEnd) {
      elements.push(
        <span key={`text-${idx}`}>{text.slice(lastEnd, span.start)}</span>
      );
    }
    elements.push(
      <mark
        key={`mark-${idx}`}
        className="bg-red-200 dark:bg-red-900/40 rounded px-0.5 cursor-help"
        title={`修正：${span.correction}\n说明：${span.explanation}`}
      >
        {text.slice(span.start, span.end)}
      </mark>
    );
    lastEnd = span.end;
  });

  if (lastEnd < text.length) {
    elements.push(<span key="text-end">{text.slice(lastEnd)}</span>);
  }

  return <p className={className}>{elements}</p>;
}
