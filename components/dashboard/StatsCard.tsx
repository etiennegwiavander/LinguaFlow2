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
  const IconComponent = () => {
    const Icon = Icons[stat.icon as keyof typeof Icons] || Icons.Activity;
    return <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />;
  };

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
            <IconComponent />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}