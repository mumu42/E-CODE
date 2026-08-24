/**
 * @file components/ProfileManager.tsx
 * @description 本地多档案管理组件：创建、切换、重命名、删除
 * @author English Agent Team
 * @date 2026-08-11
 */

"use client";
import { t } from "@/lib/i18n/translate";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import type { Target, Level } from "@/lib/types";
import { UserPlus, Trash2, Edit3, Check, X } from "lucide-react";

/** 学习目标选项 */
const targets: {value: Target;label: string;}[] = [
{ value: "SCHOOL", label: "升学考试" },
{ value: "STUDY_ABROAD", label: "出国留学" },
{ value: "CET", label: "四六级" },
{ value: "IELTS_TOEFL", label: "雅思托福" }];


/** 英语水平选项 */
const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/**
 * 档案管理组件
 * @example
 * ```tsx
 * <ProfileManager />
 * ```
 */
export function ProfileManager() {
  const profiles = useAppStore((state) => state.profiles);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const createProfile = useAppStore((state) => state.createProfile);
  const switchProfile = useAppStore((state) => state.switchProfile);
  const deleteProfile = useAppStore((state) => state.deleteProfile);
  const renameProfile = useAppStore((state) => state.renameProfile);

  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState<Target>("SCHOOL");
  const [newLevel, setNewLevel] = useState<Level>("A1");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  /** 创建新档案 */
  function handleCreate() {
    const name = newName.trim() || "新档案";
    const newProfile = {
      id: crypto.randomUUID(),
      name,
      target: newTarget,
      level: newLevel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    createProfile(newProfile);
    setNewName("");
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-base">{t("\u5B66\u4E60\u6863\u6848")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profiles.length === 0 ?
        <p className="text-sm text-muted-foreground">{t("\u6682\u65E0\u6863\u6848\uFF0C\u8BF7\u521B\u5EFA\u65B0\u6863\u6848\u3002")}

        </p> :

        <ul className="space-y-2">
            {profiles.map((p) =>
          <li
            key={p.id}
            className={`flex items-start justify-between p-2 rounded-md border ${
            p.id === currentProfileId ? "bg-accent" : "bg-card"}`
            }>
            
                <div className="flex-1 min-w-0">
                  {editingId === p.id ?
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-full rounded border px-2 text-sm"
                autoFocus /> :


              <div className="text-sm font-medium truncate">
                      {p.name}
                    </div>
              }
                  <div className="text-xs text-muted-foreground">
                    {p.target} · {p.level}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {editingId === p.id ?
              <>
                      <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    if (editName.trim()) renameProfile(editName.trim());
                    setEditingId(null);
                  }}>
                  
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setEditingId(null)}>
                  
                        <X className="w-4 h-4" />
                      </Button>
                    </> :

              <>
                      <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingId(p.id);
                    setEditName(p.name || "");
                  }}>
                  
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => switchProfile(p.id)}
                  disabled={p.id === currentProfileId}>{t("\u5207\u6362")}


                </Button>
                      <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteProfile(p.id)}
                  disabled={profiles.length <= 1}>
                  
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
              }
                </div>
              </li>
          )}
          </ul>
        }

        <div className="border-t pt-4 space-y-3">
          <div className="text-sm font-medium">{t("\u521B\u5EFA\u65B0\u6863\u6848")}</div>
          <div className="space-y-2">
            <input
              placeholder={t("\u6863\u6848\u540D\u79F0")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full h-9 px-3 rounded-md border bg-transparent text-sm" />
            
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={newTarget}
                onValueChange={(value) => setNewTarget(value as Target)}>
                
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) =>
                  <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Select
                value={newLevel}
                onValueChange={(value) => setNewLevel(value as Level)}>
                
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l) =>
                  <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">
            <UserPlus className="w-4 h-4 mr-2" />{t("\u521B\u5EFA\u6863\u6848")}

          </Button>
        </div>
      </CardContent>
    </Card>);

}