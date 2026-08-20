/**
 * @file lib/storage/pdf.ts
 * @description 使用 html2canvas + jspdf 导出学习报告 PDF
 * @author English Agent Team
 * @date 2026-08-17
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * 将报告 DOM 元素导出为 PDF
 * @param element - 要导出的 HTML 元素
 * @param filename - 文件名（不含扩展名）
 */
export async function exportReportToPdf(
  element: HTMLElement,
  filename: string = "english-agent-report"
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 10;
  const maxWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * maxWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", margin, margin, maxWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}
