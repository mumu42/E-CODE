/**
 * @file lib/storage/report.ts
 * @description 基于 docx 的英语学习 Word 报告生成工具
 * @author English Agent Team
 * @date 2026-08-07
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { AppData } from "@/lib/types";

/**
 * 根据应用数据构建 Word 报告文档
 * @param data - 应用全局数据
 * @returns docx Document 对象
 * @example
 * ```ts
 * const doc = buildReportDocument(appData);
 * ```
 */
export function buildReportDocument(data: AppData): Document {
  const sessions = data.sessions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.fluencyScore || s.grammarScore || 0), 0) / sessions.length
        )
      : 0;

  return new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "英语学习报告",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `生成时间：${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: `用户目标：${data.profile?.target || "-"}    当前级别：${data.profile?.level || "-"}`,
          }),
          new Paragraph({
            text: `总练习次数：${sessions.length}    平均评分：${totalScore}`,
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "练习记录",
            heading: HeadingLevel.HEADING_1,
          }),
          ...sessions.flatMap((session) => [
            new Paragraph({
              text: `${new Date(session.date).toLocaleDateString()} - ${session.type === "SPEAK" ? "口语" : session.type === "WRITE" ? "写作" : "对话"} · ${session.topic}`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "用户输入：", bold: true }),
                new TextRun({ text: session.userInput }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "AI 反馈：", bold: true }),
                new TextRun({ text: session.aiFeedback }),
              ],
            }),
            new Paragraph({ text: "" }),
          ]),
        ],
      },
    ],
  });
}

/**
 * 将应用数据导出为 Word 报告 Blob
 * @param data - 应用全局数据
 * @returns Word 文档 Blob
 * @example
 * ```ts
 * const blob = await exportReportToWord(appData);
 * ```
 */
export async function exportReportToWord(data: AppData): Promise<Blob> {
  const doc = buildReportDocument(data);
  return Packer.toBlob(doc);
}
