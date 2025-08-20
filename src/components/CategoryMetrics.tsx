// src/pages/CategoryMetrics.tsx
import React, { useEffect, useMemo, useState } from "react";
import { fetchCategoryCounts, CategoryCountsResponse } from "@/api";
import CategoryPieChartChartJS from "@/components/CategoryPieChartChartJS";
import CategoryPieChartECharts from "@/components/CategoryPieChartECharts";

const API_BASE = import.meta.env.VITE_OPS_EMBED_PREFIX || "";

type OnlyEmbedded = "ALL" | "D" | "R";

export default function CategoryMetrics() {
  const [onlyEmb, setOnlyEmb] = useState<OnlyEmbedded>("ALL");
  const [useECharts, setUseECharts] = useState(false);
  const [data, setData] = useState<CategoryCountsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 섹션 접기/펼치기 (초기: 접힘)
  const [showFrontChart, setShowFrontChart] = useState(false);
  const [showBackendPng, setShowBackendPng] = useState(false);

  // 카드 배경을 접힘/펼침 상태에 따라 변경
  const cardClass = (open: boolean) =>
    [
      "rounded-xl shadow border p-4",
      open ? "bg-white" : "bg-gray-50",
      "border-gray-200",
    ].join(" ");

  // 보기 좋은 버튼 스타일
  const collapseBtnClass = (open: boolean) =>
    [
      "text-sm px-3 py-1.5 rounded-md border transition",
      open
        ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
        : "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
      "dark:focus-visible:ring-indigo-400",
    ].join(" ");

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
  const counts = useMemo(
    () => labels.map((k) => data?.counts?.[k] ?? 0),
    [labels, data]
  );
  const ratios = useMemo(
    () => labels.map((k) => data?.ratios?.[k] ?? 0),
    [labels, data]
  );

  // 백엔드 PNG URL (필터와 동기화)
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
          {/* 프론트 차트 섹션 */}
          <div className={cardClass(showFrontChart)}>
            <div className="flex items-center justify-between mb-3 bg-slate-100 px-3 py-2 rounded-lg">
              <h2 className="text-lg font-medium text-black">
                카테고리별 상품 비중 미리보기 (총 {data?.total ?? 0}개)
              </h2>
              <button
                type="button"
                className={collapseBtnClass(showFrontChart)}
                aria-expanded={showFrontChart}
                onClick={() => setShowFrontChart((v) => !v)}
              >
                {showFrontChart ? "▾ 접기" : "▸ 펼치기"}
              </button>
            </div>

            {showFrontChart && (
              <>
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
              </>
            )}
          </div>

          {/* 백엔드 PNG 섹션 */}
          <div className={cardClass(showBackendPng) + " mt-6"}>
            <div className="flex items-center justify-between mb-3 bg-slate-100 px-3 py-2 rounded-lg">
              <h2 className="text-lg font-medium text-black">PNG 미리보기</h2>
              <button
                type="button"
                className={collapseBtnClass(showBackendPng)}
                aria-expanded={showBackendPng}
                onClick={() => setShowBackendPng((v) => !v)}
              >
                {showBackendPng ? "▾ 접기" : "▸ 펼치기"}
              </button>
            </div>

            {showBackendPng && (
              <img
                src={pngUrl}
                alt="Category pie"
                loading="lazy"
                className="max-w-full h-auto rounded border"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
