import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Category, LinkItem } from "@/lib/bio";

type Click = { link_id: string; created_at: string };

export function StatsPanel({
  links,
  categories,
  clicks,
}: {
  links: LinkItem[];
  categories: Category[];
  clicks: Click[];
}) {
  const totalClicks = links.reduce((sum, l) => sum + l.click_count, 0);

  const topLinks = useMemo(
    () =>
      [...links]
        .sort((a, b) => b.click_count - a.click_count)
        .slice(0, 5)
        .map((l) => ({ name: l.title.slice(0, 18), cliques: l.click_count })),
    [links],
  );

  const perDay = useMemo(() => {
    const days: { dia: string; cliques: number }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      days.push({
        dia: key.slice(8, 10) + "/" + key.slice(5, 7),
        cliques: clicks.filter((c) => c.created_at.slice(0, 10) === key).length,
      });
    }
    return days;
  }, [clicks]);

  const perCategory = useMemo(
    () =>
      categories.map((category) => ({
        name: category.title.slice(0, 14),
        cliques: links
          .filter((l) => l.category_id === category.id)
          .reduce((sum, l) => sum + l.click_count, 0),
      })),
    [categories, links],
  );

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total de cliques" value={totalClicks} />
        <Stat label="Links" value={links.length} />
        <Stat label="Categorias" value={categories.length} />
        <Stat label="Links ativos" value={links.filter((l) => l.is_active).length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Cliques por dia (14 dias)">
          <LineChart data={perDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dia" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Line type="monotone" dataKey="cliques" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Links mais acessados">
          <BarChart data={topLinks}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="cliques" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Cliques por categoria" className="lg:col-span-2">
          <BarChart data={perCategory}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
            <YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="cliques" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="glass border-glass-border">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactElement;
  className?: string;
}) {
  return (
    <Card className={`glass border-glass-border w-full max-w-full overflow-hidden ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
