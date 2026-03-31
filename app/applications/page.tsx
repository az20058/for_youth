import Link from "next/link";
import {
  BriefcaseIcon,
  CalendarIcon,
  CircleDotIcon,
  BuildingIcon,
} from "lucide-react";
import { NewApplicationForm } from "@/components/NewApplicationForm";

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getApplications } from "@/lib/applications";
import { calculateDDay, formatDDay } from "@/lib/dday";
import type { ApplicationStatus } from "@/lib/types";

function statusBadgeVariant(
  status: ApplicationStatus,
): "default" | "secondary" {
  switch (status) {
    case "서류 탈락":
    case "코테 탈락":
    case "면접 탈락":
      return "secondary";
    default:
      return "default";
  }
}

function statusBadgeClass(status: ApplicationStatus): string {
  switch (status) {
    case "지원 완료":
    case "최종 합격":
      return "bg-teal-500 text-white border-transparent";
    default:
      return "";
  }
}

export default function ApplicationsPage() {
  const apps = getApplications();

  return (
    <main className="py-8">
      <NewApplicationForm />

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">입사 지원 현황</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {apps.length}개의 지원서
          </p>
        </div>
      </div>

      {/* 지원서 목록 */}
      <ul className="mt-6 flex flex-col gap-3">
        {apps.map((app) => {
          const dday = calculateDDay(app.deadline);
          return (
            <li key={app.id}>
              <Link href={`/applications/${app.id}`} className="block">
                <Card className="transition-opacity hover:opacity-80">
                  <CardHeader>
                    <CardTitle>{app.companyName}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Badge className="gap-1 text-xs font-normal">
                        <BriefcaseIcon />
                        {app.careerLevel}
                      </Badge>
                      <Badge className="gap-1 text-xs font-normal">
                        <CalendarIcon />
                        {formatDDay(dday)}
                      </Badge>
                      <Badge className="gap-1 text-xs font-normal">
                        <BuildingIcon />
                        {app.companySize}
                      </Badge>
                    </CardDescription>
                    <CardAction className="self-center">
                      <Badge
                        variant={statusBadgeVariant(app.status)}
                        className={cn(
                          "h-7 gap-1.5 px-3 text-xs",
                          statusBadgeClass(app.status),
                        )}
                      >
                        <CircleDotIcon />
                        {app.status}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
