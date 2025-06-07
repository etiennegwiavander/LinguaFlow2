import React from "react";
import { Stat } from "@/types";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  stat: Stat;
  className?: string;
}

export default function StatsCard({ stat, className }: StatsCardProps) {
  // 1. Get the potential icon component from the Icons object.
  // We let TypeScript infer the type here to avoid assignment errors.
  // A fallback to a default icon (Activity) is used if the specified icon doesn't exist.
  const Icon = Icons[stat.icon as keyof typeof Icons] || Icons.Activity;

  // 2. We check if the retrieved 'Icon' is a valid function (i.e., a renderable component).
  // This is the most robust way to handle dynamic component imports from a library
  // that might also export non-component members.
  const isIconComponent = typeof Icon === 'function' && 'render' in Icon;

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <div className="flex items-baseline">
              <h3 className="text-2xl sm:text-3xl font-bold">
                {stat.label.includes("Rate") ? `${stat.value}%` : stat.value}
              </h3>
            </div>
            <div
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                stat.change > 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
              )}
            >
              {stat.change > 0 ? (
                <Icons.TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <Icons.TrendingDown className="mr-1 h-3 w-3" />
              )}
              <span>{Math.abs(stat.change)}%</span>
            </div>
          </div>
          <div className="rounded-full bg-muted p-2 sm:p-3">
            {/* 3. Conditionally render the Icon only if it's a valid component. */}
            {/* This satisfies TypeScript and prevents runtime errors. */}
            {isIconComponent && <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
