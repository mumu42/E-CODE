import { t } from "@/lib/i18n/translate"; /**
 * @file app/page.tsx
 * @description 首页，展示产品介绍与核心功能入口
 * @author English Agent Team
 * @date 2026-08-07
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, FileText, Lock } from "lucide-react";

/**
 * 首页组件
 * @example
 * ```tsx
 * <HomePage />
 * ```
 */
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("AI \u82F1\u8BED\u5B66\u4E60\u52A9\u624B")}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">{t("\u672C\u5730\u4F18\u5148\u3001\u5B8C\u5168\u79C1\u4EBA\u7684\u82F1\u8BED\u5B66\u4E60 Web Agent\u3002\n          \u6839\u636E\u4F60\u7684\u76EE\u6807\uFF08\u5347\u5B66/\u7559\u5B66/\u56DB\u516D\u7EA7/\u96C5\u601D\u6258\u798F\uFF09\u5B9A\u5236\u6BCF\u65E5\u53E3\u8BED\u4E0E\u5199\u4F5C\u7EC3\u4E60\uFF0C\n          AI \u5B9E\u65F6\u7EA0\u9519\uFF0C\u6240\u6709\u6570\u636E\u4FDD\u5B58\u5728\u672C\u5730\u3002")}



        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/onboarding">
            <Button size="lg">{t("\u5F00\u59CB\u5B66\u4E60")}</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">{t("\u8FDB\u5165 Dashboard")}

            </Button>
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <Mic className="w-8 h-8 mb-2 text-blue-600" />
            <CardTitle>{t("\u53E3\u8BED\u7EC3\u4E60")}</CardTitle>
          </CardHeader>
          <CardContent>{t("\u6BCF\u65E5\u573A\u666F\u8BDD\u9898\uFF0C\u652F\u6301\u8BED\u97F3\u8F93\u5165\uFF0CAI \u63D0\u4F9B\u53D1\u97F3\u4E0E\u8868\u8FBE\u53CD\u9988\u3002")}

          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FileText className="w-8 h-8 mb-2 text-green-600" />
            <CardTitle>{t("\u5199\u4F5C\u6279\u6539")}</CardTitle>
          </CardHeader>
          <CardContent>{t("\u6839\u636E\u76EE\u6807\u4EBA\u7FA4\u751F\u6210\u5199\u4F5C\u9898\u76EE\uFF0CAI \u81EA\u52A8\u6279\u6539\u8BED\u6CD5\u4E0E\u7ED3\u6784\u3002")}

          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Lock className="w-8 h-8 mb-2 text-purple-600" />
            <CardTitle>{t("\u672C\u5730\u79C1\u6709")}</CardTitle>
          </CardHeader>
          <CardContent>{t("\u5B66\u4E60\u8BB0\u5F55\u4EE5 Excel/Word \u6587\u4EF6\u5F62\u5F0F\u4FDD\u5B58\u5728\u672C\u5730\uFF0C\u4E0D\u4E0A\u4F20\u670D\u52A1\u5668\u3002")}

          </CardContent>
        </Card>
      </section>
    </div>);

}