import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { hslPalette } from "@/utils/colors";

ChartJS.register(ArcElement, Tooltip, Legend);

export type CategoryPieProps = {
  labels: string[];
  counts: number[];
  ratios: number[]; // 0~1
  title?: string;
  showLegend?: boolean;
};

export default function CategoryPieChartChartJS({
  labels,
  counts,
  ratios,
  title = "카테고리별 비중",
  showLegend = true,
}: CategoryPieProps) {
  const colors = hslPalette(labels.length);
  const data: ChartData<"pie"> = {
    labels,
    datasets: [
      {
        label: "개수",
        data: counts,
        backgroundColor: colors,
        borderColor: "#ffffff",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: { display: showLegend, position: "right" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex ?? 0;
            const count = counts[idx] ?? 0;
            const pct = (ratios[idx] ?? 0) * 100;
            return ` ${ctx.label}: ${count}개 (${pct.toFixed(1)}%)`;
          },
          title: (items) => (items[0]?.label ? String(items[0].label) : ""),
        },
      },
      title: { display: true, text: title },
    },
  };

  return <Pie data={data} options={options} />;
}
