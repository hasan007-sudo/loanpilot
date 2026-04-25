import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, TrendingUp, CheckCircle, Percent, ArrowUpRight } from "lucide-react";
import type { DashboardStats } from "@/lib/api";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: "Total Called",
      value: stats.total_called.toLocaleString(),
      icon: Phone,
      accent: "from-[#225560] to-[#3e7b78]",
      iconWrap: "bg-[#d7ece7] text-[#1d4b56]",
      note: "Connected leads processed",
    },
    {
      title: "Interested",
      value: stats.interested.toLocaleString(),
      icon: TrendingUp,
      accent: "from-[#ad5d2f] to-[#d39b44]",
      iconWrap: "bg-[#f6e2c9] text-[#9f582e]",
      note: "Open to next-step review",
    },
    {
      title: "Pre-Qualified",
      value: stats.qualified.toLocaleString(),
      icon: CheckCircle,
      accent: "from-[#17614d] to-[#2ea081]",
      iconWrap: "bg-[#d7f0e6] text-[#17614d]",
      note: "Ready for RM handoff",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversion_rate.toFixed(1)}%`,
      icon: Percent,
      accent: "from-[#5d4a84] to-[#8566c1]",
      iconWrap: "bg-[#e7ddf7] text-[#5d4a84]",
      note: "Qualified from called",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="glass-panel border-white/75 bg-white/72 py-0"
          >
            <CardHeader className="px-4 pb-2 pt-4">
              <div className={`h-1 w-full rounded-full bg-gradient-to-r ${card.accent}`} />
              <CardTitle className="pt-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="block font-heading text-[2.7rem] leading-none font-medium text-foreground">
                    {card.value}
                  </span>
                  <p className="mt-2 text-[0.82rem] text-muted-foreground">{card.note}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconWrap}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <ArrowUpRight className="h-3 w-3" />
                Live qualification signal
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
