/**
 * @file lib/settings/promptTemplate.ts
 * @description Prompt 模板渲染：支持 {{var}} 占位符
 * @author English Agent Team
 * @date 2026-08-21
 */

/**
 * 渲染 Prompt 模板
 * @param template - 模板字符串
 * @param variables - 变量映射
 * @returns 渲染后的字符串
 */
export function renderPromptTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : "";
  });
}
