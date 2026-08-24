/**
 * @file lib/assessment/questionBank.ts
 * @description 自适应测评题库（A1-C2）
 * @author English Agent Team
 * @date 2026-08-24
 */

import type { Level } from "@/lib/types";

/** 测评题目类型 */
export type AssessmentQuestionType = "choice" | "fillBlank";

/** 自适应测评题目 */
export interface AdaptiveQuestion {
  id: string;
  level: Level;
  type: AssessmentQuestionType;
  text: string;
  options?: string[];
  answer: string;
  tag: string;
}

/** 按难度索引的题库 */
export const QUESTION_BANK: Record<Level, AdaptiveQuestion[]> = {
  A1: [
    { id: "a1-1", level: "A1", type: "choice", text: "I ______ a student.", options: ["am", "is", "are", "be"], answer: "am", tag: "be动词" },
    { id: "a1-2", level: "A1", type: "choice", text: "She ______ to school every day.", options: ["go", "goes", "going", "went"], answer: "goes", tag: "一般现在时" },
    { id: "a1-3", level: "A1", type: "choice", text: "There ______ five apples on the table.", options: ["is", "are", "was", "were"], answer: "are", tag: "there be" },
    { id: "a1-4", level: "A1", type: "fillBlank", text: "Hello, my name ______ Tom.", answer: "is", tag: "自我介绍" },
    { id: "a1-5", level: "A1", type: "choice", text: "I like ______ (apple).", options: ["apple", "apples", "an apple", "the apple"], answer: "apples", tag: "名词复数" },
  ],
  A2: [
    { id: "a2-1", level: "A2", type: "choice", text: "If it ______ tomorrow, we will stay at home.", options: ["rains", "rain", "raining", "to rain"], answer: "rains", tag: "条件状语从句" },
    { id: "a2-2", level: "A2", type: "choice", text: "He has lived here ______ 2010.", options: ["since", "for", "in", "at"], answer: "since", tag: "现在完成时" },
    { id: "a2-3", level: "A2", type: "fillBlank", text: "She ______ (visit) her grandparents every Sunday.", answer: "visits", tag: "一般现在时第三人称单数" },
    { id: "a2-4", level: "A2", type: "choice", text: "This is the ______ book I have ever read.", options: ["interesting", "more interesting", "most interesting", "interested"], answer: "most interesting", tag: "形容词最高级" },
    { id: "a2-5", level: "A2", type: "choice", text: "I ______ go to the gym on Saturdays.", options: ["usually", "never", "always", "sometimes"], answer: "usually", tag: "频率副词" },
  ],
  B1: [
    { id: "b1-1", level: "B1", type: "choice", text: "By the time we arrived, the movie ______.", options: ["started", "had started", "has started", "starts"], answer: "had started", tag: "过去完成时" },
    { id: "b1-2", level: "B1", type: "choice", text: "She asked me where I ______ the day before.", options: ["have been", "had been", "was", "am"], answer: "had been", tag: "间接引语" },
    { id: "b1-3", level: "B1", type: "fillBlank", text: "If I were you, I ______ (apologize) immediately.", answer: "would apologize", tag: "虚拟语气" },
    { id: "b1-4", level: "B1", type: "choice", text: "The project ______ by the end of next month.", options: ["will complete", "will be completed", "is completed", "completes"], answer: "will be completed", tag: "将来时被动语态" },
    { id: "b1-5", level: "B1", type: "choice", text: "He insisted on ______ the report himself.", options: ["finish", "finishing", "to finish", "finished"], answer: "finishing", tag: "动名词" },
  ],
  B2: [
    { id: "b2-1", level: "B2", type: "choice", text: "Not only ______ speak French, but she also speaks German.", options: ["does she", "she does", "she can", "can she"], answer: "does she", tag: "倒装句" },
    { id: "b2-2", level: "B2", type: "choice", text: "The suspect denied ______ the painting.", options: ["to steal", "stealing", "steal", "stolen"], answer: "stealing", tag: "非谓语动词" },
    { id: "b2-3", level: "B2", type: "fillBlank", text: "Hardly ______ (arrive) when it started to rain.", answer: "had we arrived", tag: "Hardly...when 倒装" },
    { id: "b2-4", level: "B2", type: "choice", text: "I wish I ______ harder when I was at school.", options: ["studied", "had studied", "have studied", "study"], answer: "had studied", tag: "wish 虚拟语气" },
    { id: "b2-5", level: "B2", type: "choice", text: "The new law will be ______ by Parliament next week.", options: ["taken in", "brought in", "set in", "put in"], answer: "brought in", tag: "短语动词" },
  ],
  C1: [
    { id: "c1-1", level: "C1", type: "choice", text: "Were the management to invest more, productivity ______.", options: ["would rise", "will rise", "would have risen", "rises"], answer: "would rise", tag: "虚拟条件倒装" },
    { id: "c1-2", level: "C1", type: "choice", text: "The artist is said ______ a hundred paintings.", options: ["to paint", "painting", "to have painted", "having painted"], answer: "to have painted", tag: "非谓语完成式" },
    { id: "c1-3", level: "C1", type: "fillBlank", text: "Scarcely ______ (finish) the speech when the audience erupted.", answer: "had he finished", tag: "Scarcely...when" },
    { id: "c1-4", level: "C1", type: "choice", text: "It is imperative that the report ______ before Friday.", options: ["submits", "be submitted", "is submitted", "submitted"], answer: "be submitted", tag: "虚拟语气（imperative）" },
    { id: "c1-5", level: "C1", type: "choice", text: "The theory, ______ by most experts, was eventually rejected.", options: ["accepted", "having accepted", "having been accepted", "accepting"], answer: "having been accepted", tag: "分词完成被动式" },
  ],
  C2: [
    { id: "c2-1", level: "C2", type: "choice", text: "Never before ______ such a sophisticated system.", options: ["had we seen", "we had seen", "have we seen", "we have seen"], answer: "had we seen", tag: "Never 句首倒装" },
    { id: "c2-2", level: "C2", type: "choice", text: "The diplomat's remarks were so ambiguous as to be almost ______.", options: ["unintelligible", "intelligible", "interpretable", "explicit"], answer: "unintelligible", tag: "高级词汇辨析" },
    { id: "c2-3", level: "C2", type: "fillBlank", text: "But for your help, we ______ (fail) the project.", answer: "would have failed", tag: "含蓄虚拟条件句" },
    { id: "c2-4", level: "C2", type: "choice", text: "The proposal was met with ______ opposition.", options: ["fierce", "fiercely", "fierceness", "fiercer"], answer: "fierce", tag: "形容词修饰名词" },
    { id: "c2-5", level: "C2", type: "choice", text: "Had I known the consequences, I ______ differently.", options: ["would act", "would have acted", "had acted", "acted"], answer: "would have acted", tag: "Had 条件倒装" },
  ],
};
