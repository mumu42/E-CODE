import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, Lock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          AI 英语学习助手
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          本地优先、完全私人的英语学习 Web Agent。
          根据你的目标（升学/留学/四六级/雅思托福）定制每日口语与写作练习，
          AI 实时纠错，所有数据保存在本地。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/onboarding">
            <Button size="lg">开始学习</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              进入 Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <Mic className="w-8 h-8 mb-2 text-blue-600" />
            <CardTitle>口语练习</CardTitle>
          </CardHeader>
          <CardContent>
            每日场景话题，支持语音输入，AI 提供发音与表达反馈。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FileText className="w-8 h-8 mb-2 text-green-600" />
            <CardTitle>写作批改</CardTitle>
          </CardHeader>
          <CardContent>
            根据目标人群生成写作题目，AI 自动批改语法与结构。
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Lock className="w-8 h-8 mb-2 text-purple-600" />
            <CardTitle>本地私有</CardTitle>
          </CardHeader>
          <CardContent>
            学习记录以 Excel/Word 文件形式保存在本地，不上传服务器。
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
