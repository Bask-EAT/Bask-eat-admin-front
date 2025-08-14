import React, { useEffect, useMemo, useState } from 'react'
import { api, type ProductResult, type SearchResponse } from '../api'
import {Button, Field, Select, TextInput } from './ui'
import SmallBtn from './ui/SmallBtn' // 경로 확인

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

  // objectURL 해제
  useEffect(() => {
    return () => {
      if (imgPreview) URL.revokeObjectURL(imgPreview)
      if (mmPreview) URL.revokeObjectURL(mmPreview)
    }
  }, [imgPreview, mmPreview])

  const topKOptions = useMemo(() => [30, 20, 10], [])
  const hasResults = results.length > 0

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showRawMap, setShowRawMap] = useState<Record<string, boolean>>({})
  const allExpanded = hasResults && results.every(r => expanded[r.id])

  function toggleRow(id: string) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }
  function toggleAll() {
    if (allExpanded) {
      setExpanded({})
    } else {
      const next: Record<string, boolean> = {}
      results.forEach(r => { next[r.id] = true })
      setExpanded(next)
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
  }

  const formatPrice = (p?: number) =>
    typeof p === 'number' ? `${p.toLocaleString()}원` : '—'

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
        <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
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
          </div>
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
                                  className={
                                    `px-2 py-0.5 rounded border ${x.out_of_stock === 'Y'
                                      ? 'bg-red-50 border-red-200 text-red-600'
                                      : 'bg-green-50 border-green-200 text-green-700'}`
                                  }
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

                      {/* price_history 테이블 */}
                      {Array.isArray(x.price_history) && x.price_history.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-semibold mb-1">price_history</div>
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-xs">
                              <thead className="bg-card">
                                <tr className="text-left">
                                  <th className="px-3 py-2">last_updated</th>
                                  <th className="px-3 py-2 text-right">original_price</th>
                                  <th className="px-3 py-2 text-right">selling_price</th>
                                  <th className="px-3 py-2">quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {x.price_history.map((h, idx) => {
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
