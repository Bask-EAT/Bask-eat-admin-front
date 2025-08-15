// src/pages/CategoryMetrics.tsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchCategoryCounts, CategoryCountsResponse } from "@/api";
import CategoryPieChartChartJS from "@/components/CategoryPieChartChartJS";
import CategoryPieChartECharts from "@/components/CategoryPieChartECharts";

const API_BASE = import.meta.env.VITE_API_BASE || ""; // ✅ 여기에 둡니다.

type OnlyEmbedded = "ALL" | "D" | "R";

export default function CategoryMetrics() {
  const [onlyEmb, setOnlyEmb] = useState<OnlyEmbedded>("ALL");
  const [useECharts, setUseECharts] = useState(false);
  const [data, setData] = useState<CategoryCountsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    fetchCategoryCounts({
      only_embedded: onlyEmb === "ALL" ? undefined : (onlyEmb as "D" | "R"),
      category_field: "category",
    })
      .then((res) => mounted && setData(res))
      .catch((e) => mounted && setErr(e?.message || String(e)))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [onlyEmb]);

  const labels = useMemo(() => Object.keys(data?.counts || {}), [data]);
  const counts = useMemo(() => labels.map((k) => data?.counts?.[k] ?? 0), [labels, data]);
  const ratios = useMemo(() => labels.map((k) => data?.ratios?.[k] ?? 0), [labels, data]);

  // ✅ 백엔드 PNG URL 생성 (현재 필터와 동기화)
  const pngUrl = useMemo(() => {
    const q = new URLSearchParams();
    if (onlyEmb !== "ALL") q.set("only_embedded", onlyEmb);
    q.set("show_counts", "true");
    return `${API_BASE}/metrics/category-pie.png?${q.toString()}`;
  }, [onlyEmb]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-2xl font-semibold">카테고리별 상품 비중</h1>
        <div className="flex items-center gap-2">
          <select
            className="border rounded px-2 py-1"
            value={onlyEmb}
            onChange={(e) => setOnlyEmb(e.target.value as OnlyEmbedded)}
          >
            <option value="ALL">전체</option>
            <option value="D">임베딩 완료(D)</option>
            <option value="R">임베딩 대기(R)</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useECharts}
              onChange={(e) => setUseECharts(e.target.checked)}
            />
            ECharts 사용
          </label>
        </div>
      </div>

      {loading && <div className="text-gray-500">불러오는 중...</div>}
      {err && <div className="text-red-600">불러오기 실패: {err}</div>}

      {!loading && !err && labels.length === 0 && (
        <div className="text-gray-500">집계할 데이터가 없습니다.</div>
      )}

      {!loading && !err && labels.length > 0 && (
        <>
          {/* 기존 프론트 차트 */}
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            {useECharts ? (
              <CategoryPieChartECharts
                labels={labels}
                counts={counts}
                ratios={ratios}
                title={`카테고리별 비중 (총 ${data?.total ?? 0}개)`}
              />
            ) : (
              <CategoryPieChartChartJS
                labels={labels}
                counts={counts}
                ratios={ratios}
                title={`카테고리별 비중 (총 ${data?.total ?? 0}개)`}
              />
            )}
          </div>

          {/* ✅ 백엔드가 렌더링한 PNG를 그대로 표시하는 섹션 */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-lg font-medium mb-3">백엔드 PNG 미리보기</h2>
            <img
              src={pngUrl}
              alt="Category pie"
              loading="lazy"
              className="max-w-full h-auto rounded border"
            />
          </div>
        </>
      )}
    </div>
  );
}
