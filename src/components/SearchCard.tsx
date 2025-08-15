import React, { useEffect, useMemo, useState } from 'react'
import { api, type ProductResult, type SearchResponse } from '../api'
import { Button, Field, Select, TextInput } from './ui'
import SmallBtn from './ui/SmallBtn' // 경로 확인

// ---- 유틸
function parseDateOrNull(s?: string) {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}
function toCsv(rows: Array<Record<string, any>>) {
  if (!rows?.length) return ''
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r || {}).forEach(k => acc.add(k))
      return acc
    }, new Set())
  )
  const esc = (v: any) => {
    const s = v === undefined || v === null ? '' : String(v)
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => esc(r?.[h])).join(',')),
  ]
  return lines.join('\n')
}

export default function SearchCard() {
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)

  // 텍스트 검색
  const [q, setQ] = useState('')
  const [topKText, setTopKText] = useState(30)

  // 이미지 검색
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [topKImg, setTopKImg] = useState(30)
  const imgPreview = imgFile ? URL.createObjectURL(imgFile) : ''

  // 멀티모달
  const [mmQ, setMmQ] = useState('')
  const [mmFile, setMmFile] = useState<File | null>(null)
  const [alpha, setAlpha] = useState(0.7)
  const [topKMM, setTopKMM] = useState(30)
  const mmPreview = mmFile ? URL.createObjectURL(mmFile) : ''

  // 행 상세/Raw JSON/price_history 개수 상태
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})
  const [phCountMap, setPhCountMap] = useState<Record<string, number>>({})

  // ✅ 전역 설정(Results 내부에서 표시)
  const [defaultPh, setDefaultPh] = useState<number>(() => {
    const v = localStorage.getItem('ph.default')
    return v ? Number(v) : 5
  })
  const [stepPh, setStepPh] = useState<number>(() => {
    const v = localStorage.getItem('ph.step')
    return v ? Number(v) : 5
  })
  useEffect(() => { localStorage.setItem('ph.default', String(defaultPh)) }, [defaultPh])
  useEffect(() => { localStorage.setItem('ph.step', String(stepPh)) }, [stepPh])

  // ✅ Results 헤더 내 Settings 패널 토글
  const [showSettings, setShowSettings] = useState(false)

  // objectURL 해제
  useEffect(() => {
    return () => {
      if (imgPreview) URL.revokeObjectURL(imgPreview)
      if (mmPreview) URL.revokeObjectURL(mmPreview)
    }
  }, [imgPreview, mmPreview])

  const topKOptions = useMemo(() => [30, 20, 10], [])
  const hasResults = results.length > 0
  const allExpanded = hasResults && results.every(r => expanded[r.id])

  function toggleRow(id: string) {
    setExpanded(prev => {
      const nextOpen = !prev[id]
      if (nextOpen && phCountMap[id] === undefined) {
        setPhCountMap(pm => ({ ...pm, [id]: defaultPh }))
      }
      return { ...prev, [id]: nextOpen }
    })
  }
  function toggleAll() {
    if (!hasResults) return
    if (allExpanded) {
      setExpanded({})
    } else {
      const next: Record<string, boolean> = {}
      const nextPh: Record<string, number> = { ...phCountMap }
      results.forEach(r => {
        next[r.id] = true
        if (nextPh[r.id] === undefined) nextPh[r.id] = defaultPh
      })
      setExpanded(next)
      setPhCountMap(nextPh)
    }
  }
  function toggleRaw(id: string) {
    setShowRawMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function safeRun<T>(fn: () => Promise<T>) {
    try {
      setLoading(true)
      return await fn()
    } finally {
      setLoading(false)
    }
  }

  const resetResultStates = () => {
    setExpanded({})
    setShowRawMap({})
    setPhCountMap({})
  }

  const formatPrice = (p?: number) =>
    typeof p === 'number' ? `${p.toLocaleString()}원` : '—'

  // price_history 정렬: 최근 날짜(desc)
  const sortHistoryDesc = (arr: any[] = []) =>
    [...arr].sort((a, b) => {
      const da = parseDateOrNull(a?.last_updated)?.getTime() ?? -Infinity
      const db = parseDateOrNull(b?.last_updated)?.getTime() ?? -Infinity
      return db - da
    })

  // CSV 다운로드
  function downloadCsv(filename: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* 1) Text search */}
      <div className="rounded-md border border-border overflow-hidden bg-bg">
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="text-sm font-semibold text-fg">Text search</div>
          <div className="text-xs text-muted mt-1">자연어로 상품 검색</div>
        </div>
        <div className="p-4 space-y-3">
          <Field label="Query">
            <div className="grid md:grid-cols-[1fr_140px_120px] gap-3 items-center">
              <TextInput
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="예: 면류, 라면, 즉석식품"
              />
              <Select value={topKText} onChange={e => setTopKText(Number(e.target.value))}>
                {topKOptions.map(k => <option key={k} value={k}>{k} results</option>)}
              </Select>
              <div className="flex gap-2">
                <SmallBtn
                  variant="primary"
                  disabled={loading || !q.trim()}
                  onClick={async () => {
                    if (!q.trim()) return
                    await safeRun(async () => {
                      const r: SearchResponse = await api.textSearch(q.trim(), topKText)
                      setResults(r.results || [])
                      resetResultStates()
                    })
                  }}
                >
                  검색
                </SmallBtn>
                <SmallBtn
                  variant="neutral"
                  disabled={loading || !q}
                  onClick={() => setQ('')}
                >
                  초기화
                </SmallBtn>
              </div>
            </div>
          </Field>
        </div>
      </div>

      {/* 2) Image search */}
      <div className="rounded-md border border-border overflow-hidden bg-bg">
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="text-sm font-semibold text-fg">Image search</div>
          <div className="text-xs text-muted mt-1">업로드 이미지와 유사한 상품 검색</div>
        </div>
        <div className="p-4 space-y-4">
          <Field label="Image">
            <div className="grid md:grid-cols-[1fr_140px_120px] gap-3 items-center">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImgFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                {imgPreview && (
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-border bg-bg">
                    <img src={imgPreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <Select value={topKImg} onChange={e => setTopKImg(Number(e.target.value))}>
                {topKOptions.map(k => <option key={k} value={k}>{k} results</option>)}
              </Select>
              <div className="flex gap-2">
                <SmallBtn
                  variant="primary"
                  disabled={loading || !imgFile}
                  onClick={async () => {
                    if (!imgFile) return
                    await safeRun(async () => {
                      const r: SearchResponse = await api.imageSearch(imgFile, topKImg)
                      setResults(r.results || [])
                      resetResultStates()
                    })
                  }}
                >
                  검색
                </SmallBtn>
                <SmallBtn
                  variant="neutral"
                  disabled={loading || !imgFile}
                  onClick={() => { setImgFile(null) }}
                >
                  초기화
                </SmallBtn>
              </div>
            </div>
          </Field>
        </div>
      </div>

      {/* 3) Multimodal search */}
      <div className="rounded-md border border-border overflow-hidden bg-bg">
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="text-sm font-semibold text-fg">Multimodal search</div>
          <div className="text-xs text-muted mt-1">텍스트+이미지를 함께 사용해 더 정확하게</div>
        </div>
        <div className="p-4 space-y-4">
          <Field label="Inputs">
            <div className="grid md:grid-cols-[1fr_1fr] gap-3">
              <TextInput value={mmQ} onChange={e => setMmQ(e.target.value)} placeholder="예: 맛있는 면류" />
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setMmFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                {mmPreview && (
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-border bg-bg">
                    <img src={mmPreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </Field>

          <Field label="Options">
            <div className="grid md:grid-cols-[140px_1fr_120px] gap-3 items-center">
              <Select value={topKMM} onChange={e => setTopKMM(Number(e.target.value))}>
                {topKOptions.map(k => <option key={k} value={k}>{k} results</option>)}
              </Select>

              <div className="flex items-center gap-3 text-sm">
                <label className="text-muted w-28">Alpha (Image)</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={alpha}
                  onChange={e => setAlpha(Number(e.target.value))}
                  className="w-full"
                />
                <span className="w-12 text-right text-fg">{alpha.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <SmallBtn
                  variant="primary"
                  disabled={loading || !mmQ.trim() || !mmFile}
                  onClick={async () => {
                    if (!mmQ.trim() || !mmFile) return
                    await safeRun(async () => {
                      const r: SearchResponse = await api.multimodalSearch(mmQ.trim(), mmFile, alpha, topKMM)
                      setResults(r.results || [])
                      resetResultStates()
                    })
                  }}
                >
                  검색
                </SmallBtn>
                <SmallBtn
                  variant="neutral"
                  disabled={loading || (!mmQ && !mmFile)}
                  onClick={() => { setMmQ(''); setMmFile(null) }}
                >
                  초기화
                </SmallBtn>
              </div>
            </div>
          </Field>
        </div>
      </div>

      {/* 4) Results */}
      <div className="rounded-md border border-border overflow-hidden bg-bg">
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-fg">Results</div>
              <div className="text-xs text-muted mt-1">최근 검색 결과 (최대 30개)</div>
            </div>
            <div className="flex gap-2">
              <Button disabled={loading || !hasResults} onClick={toggleAll}>
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </Button>
              <Button
                disabled={loading || !hasResults}
                onClick={() => { setResults([]); resetResultStates() }}
              >
                Clear results
              </Button>
              {/* ✅ Results 내부 Settings 버튼 */}
              <Button onClick={() => setShowSettings(s => !s)}>
                {showSettings ? 'Hide Settings' : 'price history Settings'}
              </Button>
            </div>
          </div>

          {/* ✅ Results 내부에 나타나는 설정 패널 */}
          {showSettings && (
            <div className="mt-3 p-3 rounded-md border border-border bg-bg">
              <div className="grid md:grid-cols-2 gap-3 items-center">
                <Field label="Default N (처음 표시 개수)">
                  <Select
                    value={defaultPh}
                    onChange={e => setDefaultPh(Number(e.target.value))}
                  >
                    {[5, 10, 20, 50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Step (더보기 증가 단위)">
                  <Select
                    value={stepPh}
                    onChange={e => setStepPh(Number(e.target.value))}
                  >
                    {[5, 10, 20, 50].map(n => (
                      <option key={n} value={n}>+{n}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="text-xs text-muted mt-2">
                * 각 행은 처음 펼칠 때 Default N을 따르고, ‘더보기’는 Step만큼 증가합니다.
              </div>
            </div>
          )}
        </div>

        {!hasResults ? (
          <div className="p-6 text-sm text-muted">No results</div>
        ) : (
          <div className="max-h-[420px] overflow-auto divide-y divide-border">
            {results.map((x, i) => {
              const isOpen = !!expanded[x.id]
              const showRaw = !!showRawMap[x.id]
              const formattedScore =
                typeof x.similarity_score === 'number'
                  ? x.similarity_score.toFixed(4)
                  : '—'
              const title = x.product_name ?? x.id

              const sortedPh = sortHistoryDesc(Array.isArray(x.price_history) ? x.price_history : [])
              const totalPh = sortedPh.length
              const showPhCount = phCountMap[x.id] ?? defaultPh
              const visiblePh = sortedPh.slice(0, showPhCount)

              return (
                <div key={`${x.id}-${i}`} className="px-4 py-3 odd:bg-card even:bg-bg">
                  {/* Row 헤더 */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-md overflow-hidden border border-border bg-bg flex items-center justify-center shrink-0">
                      {x.image_url ? (
                        <img src={x.image_url} alt={title} className="w-full h-full object-cover" />
                      ) : <span className="text-xs text-muted">—</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-fg truncate">{title}</div>
                      <div className="text-xs text-muted truncate">
                        {x.category ?? '—'} · score: {formattedScore}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {x.product_address && (
                        <a
                          className="text-sm underline text-pri hover:brightness-110"
                          href={x.product_address}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      )}
                      <SmallBtn variant="neutral" onClick={() => toggleRow(x.id)}>
                        {isOpen ? 'Hide details' : 'Details'}
                      </SmallBtn>
                    </div>
                  </div>

                  {/* 상세 패널 */}
                  {isOpen && (
                    <div className="mt-3 border-t border-border pt-3">
                      {/* 기본 필드 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <DetailItem label="id" value={x.id} />
                        <DetailItem label="product_name" value={x.product_name ?? '—'} />
                        <DetailItem label="category" value={x.category ?? '—'} />

                        <DetailItem
                          label="image_url"
                          value={
                            x.image_url ? (
                              <a
                                className="underline text-pri break-all"
                                href={x.image_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {x.image_url}
                              </a>
                            ) : '—'
                          }
                        />

                        <DetailItem
                          label="product_address"
                          value={
                            x.product_address ? (
                              <a
                                className="underline text-pri break-all"
                                href={x.product_address}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {x.product_address}
                              </a>
                            ) : '—'
                          }
                        />

                        <DetailItem label="last_updated" value={x.last_updated ?? '—'} />

                        <DetailItem
                          label="is_emb"
                          value={
                            x.is_emb !== undefined
                              ? (
                                <span className="px-2 py-0.5 rounded bg-card border border-border text-fg">
                                  {String(x.is_emb)}
                                </span>
                              )
                              : '—'
                          }
                        />

                        <DetailItem label="similarity_score" value={formattedScore} />

                        {/* 추가 필드들 */}
                        <DetailItem label="quantity" value={x.quantity ?? '—'} />

                        <DetailItem
                          label="out_of_stock"
                          value={
                            x.out_of_stock != null
                              ? (
                                <span
                                  className={`px-2 py-0.5 rounded border ${
                                    x.out_of_stock === 'Y'
                                      ? 'bg-red-50 border-red-200 text-red-600'
                                      : 'bg-green-50 border-green-200 text-green-700'
                                  }`}
                                >
                                  {x.out_of_stock}
                                </span>
                              )
                              : '—'
                          }
                        />

                        <DetailItem label="price" value={formatPrice(x.price)} />

                        <DetailItem
                          label="last_price_updated"
                          value={x.last_price_updated ?? '—'}
                        />
                      </div>

                      {/* price_history — 최근순 + 기본 N + 더보기 */}
                      {totalPh > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold mb-1">
                              price_history{' '}
                              <span className="text-muted">({Math.min(showPhCount, totalPh)}/{totalPh}, 최근순)</span>
                            </div>
                            <div className="flex gap-2">
                              <SmallBtn
                                variant="neutral"
                                onClick={() => {
                                  const csv = toCsv(visiblePh)
                                  downloadCsv(`${x.id}-history-visible.csv`, csv)
                                }}
                              >
                                CSV(보이는 행)
                              </SmallBtn>
                              <SmallBtn
                                variant="neutral"
                                onClick={() => {
                                  const csv = toCsv(sortedPh)
                                  downloadCsv(`${x.id}-history-all.csv`, csv)
                                }}
                              >
                                CSV(전체)
                              </SmallBtn>
                            </div>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-xs">
                              <thead className="bg-card">
                                <tr className="text-left">
                                  <th className="px-3 py-2">last_updated</th>
                                  <th className="px-3 py-2 text-right">original_price</th>
                                  <th className="px-3 py-2 text-right">selling_price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {visiblePh.map((h, idx) => {
                                  const op = h?.original_price != null && h.original_price !== ''
                                    ? Number(h.original_price).toLocaleString()
                                    : '—'
                                  const sp = h?.selling_price != null && h.selling_price !== ''
                                    ? Number(h.selling_price).toLocaleString()
                                    : '—'
                                  return (
                                    <tr key={idx} className="border-t border-border">
                                      <td className="px-3 py-2 whitespace-nowrap">{h?.last_updated ?? '—'}</td>
                                      <td className="px-3 py-2 text-right">{op}</td>
                                      <td className="px-3 py-2 text-right">{sp}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* 컨트롤: 더보기/모두보기/처음N개 */}
                          <div className="mt-2 flex items-center gap-2">
                            {showPhCount < totalPh && (
                              <>
                                <SmallBtn
                                  variant="neutral"
                                  onClick={() =>
                                    setPhCountMap(prev => ({
                                      ...prev,
                                      [x.id]: Math.min(totalPh, (prev[x.id] ?? defaultPh) + stepPh)
                                    }))
                                  }
                                >
                                  더보기 (+{stepPh})
                                </SmallBtn>
                                <SmallBtn
                                  variant="neutral"
                                  onClick={() =>
                                    setPhCountMap(prev => ({ ...prev, [x.id]: totalPh }))
                                  }
                                >
                                  모두 보기
                                </SmallBtn>
                              </>
                            )}
                            {showPhCount > defaultPh && (
                              <SmallBtn
                                variant="neutral"
                                onClick={() =>
                                  setPhCountMap(prev => ({ ...prev, [x.id]: defaultPh }))
                                }
                              >
                                처음 {defaultPh}개만 보기
                              </SmallBtn>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 원본 JSON 토글/복사 */}
                      <div className="mt-3 flex items-center justify-between">
                        <SmallBtn variant="neutral" onClick={() => toggleRaw(x.id)}>
                          {showRaw ? 'Hide raw JSON' : 'Show raw JSON'}
                        </SmallBtn>
                        <SmallBtn
                          variant="neutral"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(JSON.stringify(x, null, 2))
                            } catch {
                              const blob = new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${x.id}.json`
                              a.click()
                              URL.revokeObjectURL(url)
                            }
                          }}
                        >
                          Copy JSON
                        </SmallBtn>
                      </div>

                      {showRaw && (
                        <pre className="mt-2 p-3 rounded-md bg-card border border-border text-xs overflow-auto">
{JSON.stringify(x, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-muted">{label}</div>
      <div className="text-fg break-all">{value ?? '—'}</div>
    </div>
  )
}
