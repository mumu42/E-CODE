/**
 * @file lib/chat/roles.ts
 * @description AI 对话陪练的角色与场景配置
 * @author English Agent Team
 * @date 2026-08-25
 */

import type { ChatRole } from "@/lib/types";

/** 场景配置 */
export interface Scenario {
  /** 场景标识 */
  value: string;
  /** 场景显示名称（中文 key，通过 t() 翻译） */
  label: string;
  /** 给 AI 的场景设定 */
  prompt: string;
  /** 角色开场白 */
  sampleOpening: string;
}

/** 角色配置 */
export interface RoleConfig {
  /** 角色标识 */
  value: ChatRole;
  /** 角色显示名称（中文 key） */
  label: string;
  /** 角色描述（中文 key） */
  description: string;
}

/** 可选角色列表 */
export const CHAT_ROLES: RoleConfig[] = [
  { value: "friend", label: "朋友", description: "轻松日常对话" },
  { value: "interviewer", label: "面试官", description: "模拟面试场景" },
  { value: "examiner", label: "考官", description: "雅思/托福口语考官" },
  { value: "teacher", label: "老师", description: "耐心纠错与指导" },
  { value: "colleague", label: "同事", description: "职场话题交流" },
];

/** 每个角色下的场景列表 */
export const CHAT_SCENARIOS: Record<ChatRole, Scenario[]> = {
  friend: [
    {
      value: "coffee",
      label: "咖啡店闲聊",
      prompt: "Chat casually over coffee.",
      sampleOpening: "Hey! Fancy seeing you here. What would you like to drink?",
    },
    {
      value: "weekend",
      label: "周末计划",
      prompt: "Discuss weekend plans.",
      sampleOpening: "Any plans for the weekend?",
    },
    {
      value: "travel",
      label: "旅行分享",
      prompt: "Share travel experiences.",
      sampleOpening: "I just got back from a trip. Have you traveled anywhere interesting lately?",
    },
    {
      value: "restaurant",
      label: "餐厅点餐",
      prompt: "You are at a restaurant ordering food and drinks with a friend.",
      sampleOpening: "Are you ready to order? The pasta here is great.",
    },
    {
      value: "shopping",
      label: "购物问路",
      prompt: "Ask for directions or help while shopping in a city.",
      sampleOpening: "Excuse me, do you know where the nearest bookstore is?",
    },
  ],
  interviewer: [
    {
      value: "intro",
      label: "自我介绍",
      prompt: "Ask the user to introduce themselves.",
      sampleOpening: "Please introduce yourself briefly.",
    },
    {
      value: "project",
      label: "项目经验",
      prompt: "Discuss past project experience.",
      sampleOpening: "Tell me about a project you are proud of.",
    },
    {
      value: "career",
      label: "职业规划",
      prompt: "Talk about career plans.",
      sampleOpening: "Where do you see yourself in five years?",
    },
    {
      value: "job_interview",
      label: "求职面试",
      prompt: "Conduct a realistic job interview with behavioral and technical questions.",
      sampleOpening: "Thank you for joining the interview today. Tell me about yourself.",
    },
  ],
  examiner: [
    {
      value: "hometown",
      label: "家乡",
      prompt: "Ask about the user's hometown.",
      sampleOpening: "Let's talk about your hometown. Where is it?",
    },
    {
      value: "hobby",
      label: "兴趣爱好",
      prompt: "Ask about hobbies and interests.",
      sampleOpening: "What do you like to do in your free time?",
    },
    {
      value: "education",
      label: "教育背景",
      prompt: "Ask about education background.",
      sampleOpening: "Tell me something about your education.",
    },
    {
      value: "airport",
      label: "机场值机",
      prompt: "You are an immigration officer at the airport asking travel-related questions.",
      sampleOpening: "May I see your passport and ticket, please?",
    },
  ],
  teacher: [
    {
      value: "grammar",
      label: "语法纠错",
      prompt: "Help the user practice grammar.",
      sampleOpening: "Let's practice some grammar. Try making a sentence using 'present perfect'.",
    },
    {
      value: "vocabulary",
      label: "词汇扩展",
      prompt: "Help expand vocabulary.",
      sampleOpening: "Today's word is 'ambiguous'. Can you make a sentence with it?",
    },
    {
      value: "pronunciation",
      label: "发音练习",
      prompt: "Help practice pronunciation.",
      sampleOpening: "Repeat after me: 'She sells seashells by the seashore.'",
    },
    {
      value: "hotel",
      label: "酒店入住",
      prompt: "You are a hotel receptionist helping a guest check in. Use common hotel phrases.",
      sampleOpening: "Good afternoon. Do you have a reservation?",
    },
  ],
  colleague: [
    {
      value: "project",
      label: "项目讨论",
      prompt: "Discuss a work project.",
      sampleOpening: "We need to finish the proposal by Friday. What's your progress?",
    },
    {
      value: "meeting",
      label: "会议安排",
      prompt: "Arrange a meeting.",
      sampleOpening: "When are you free for a quick meeting?",
    },
    {
      value: "email",
      label: "邮件沟通",
      prompt: "Discuss email communication.",
      sampleOpening: "Could you review the email draft I sent?",
    },
    {
      value: "business_meeting",
      label: "商务会议",
      prompt: "You are discussing agenda items in a business meeting.",
      sampleOpening: "Let's move on to the next item on the agenda.",
    },
  ],
};
