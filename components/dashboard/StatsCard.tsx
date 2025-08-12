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

  const handleClick = () => {
    if (stat.clickable && stat.onClick) {
      stat.onClick();
    }
  };

  return (
    <Card 
      className={cn(
        "cyber-card", 
        stat.clickable && "cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:border-cyber-400/50",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              {stat.label}
              {stat.clickable && (
                <Icons.ExternalLink className="inline ml-1 h-3 w-3 opacity-60" />
              )}
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
                  ? "badge-success"
                  : stat.change < 0
                  ? "badge-error"
                  : "badge-neutral"
              )}
            >
              {stat.change > 0 ? (
                <Icons.TrendingUp className="mr-1 h-3 w-3" />
              ) : stat.change < 0 ? (
                <Icons.TrendingDown className="mr-1 h-3 w-3" />
              ) : (
                <Icons.Minus className="mr-1 h-3 w-3" />
              )}
              <span>{stat.change === 0 ? "0" : Math.abs(stat.change)}%</span>
            </div>
          </div>
          <div className="rounded-full bg-gradient-to-br from-cyber-400/20 to-neon-400/20 p-3 group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-cyber-400" />
          </div>
        </div>
        {stat.clickable && (
          <div className="mt-3 pt-2 border-t border-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-xs text-cyber-400 font-medium">
              Click to view details
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}