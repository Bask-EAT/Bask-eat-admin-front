import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { hslPalette } from "@/utils/colors";

export type CategoryPieEProps = {
  labels: string[];
  counts: number[];
  ratios: number[]; // 0~1
  title?: string;
  showLegend?: boolean;
};

export default function CategoryPieChartECharts({
  labels,
  counts,
  ratios,
  title = "카테고리별 비중",
  showLegend = true,
}: CategoryPieEProps) {
  const colors = useMemo(() => hslPalette(labels.length), [labels.length]);
  const seriesData = labels.map((name, i) => ({
    name,
    value: counts[i] ?? 0,
  }));

  const option = {
    title: { text: title, left: "center" },
    tooltip: {
      trigger: "item",
      formatter: (p: any) => {
        const i = p?.dataIndex ?? 0;
        const pct = ((ratios[i] ?? 0) * 100).toFixed(1);
        return `${p.name}<br/>${p.value}개 (${pct}%)`;
      },
    },
    legend: { show: showLegend, orient: "vertical", left: "left" },
    color: colors,
    series: [
      {
        type: "pie",
        radius: "65%",
        center: ["50%", "55%"],
        data: seriesData,
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.3)" },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 420, width: "100%" }} />;
}
