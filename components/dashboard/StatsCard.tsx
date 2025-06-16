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
  const IconComponent = (
    Icons[stat.icon as keyof typeof Icons] || Icons.Activity
  ) as React.ComponentType<React.SVGProps<SVGSVGElement>>;

  return (
    <Card className={cn("floating-card glass-effect border-cyber-400/20 hover:border-cyber-400/50 transition-all duration-300 group", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <div className="flex items-baseline">
              <h3 className="text-2xl sm:text-3xl font-bold gradient-text">
                {stat.label.includes("Rate") ? `${stat.value}%` : stat.value}
              </h3>
            </div>
            <div
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-all duration-300",
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
          <div className="rounded-full bg-gradient-to-br from-cyber-400/20 to-neon-400/20 p-3 group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}