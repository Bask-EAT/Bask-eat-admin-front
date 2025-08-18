// OpsPanel.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { Section, Field, TextInput } from '@/components/ui/ui'
import ButtonGroup from '@/components/ui/ButtonGroup'
import SmallBtn from '@/components/ui/SmallBtn'
import { api, SchedulerConfig } from '@/api'

const CATEGORIES: Record<string, string> = {
  Fruits: '6000213114',
  Vegetables: '6000213167',
  Rice_Grains_Nuts: '6000215152',
  Meat_Eggs: '6000215194',
  Seafood_DriedSeafood: '6000213469',
  Milk_Dairy: '6000213534',
  MealKits_ConvenienceFood: '6000213247',
  Kimchi_SideDishes_Deli: '6000213299',
  Water_Beverages_Alcohol: '6000213424',
  Coffee_Beans_Tea: '6000215245',
  Noodles_CannedGoods: '6000213319',
  Seasoning_Oil: '6000215286',
  Snacks_Treats: '6000213362',
  Bakery_Jam: '6000213412',
}

function Toast({ msg }: { msg: string }) {
  return (
    <div
      className={`fixed right-8 bottom-8 z-[9999] px-4 py-3 rounded-xl shadow-soft
      ${msg ? 'opacity-100 visible' : 'opacity-0 invisible'} transition
      bg-pri text-white`}
    >
      {msg}
    </div>
  )
}

export default function OpsPanel() {
  // 카테고리 체크박스
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const allKeys = useMemo(() => Object.keys(CATEGORIES), [])
  const toggleAll = (v: boolean) =>
    setChecked(Object.fromEntries(allKeys.map(k => [k, v])))

  // 저장 성공 플래그
  const [categoriesSaved, setCategoriesSaved] = useState(false)

  // env - 페이지 범위 (끝까지 옵션 포함)
  const [startPage, setStartPage] = useState<number | ''>(1)
  const [endPage, setEndPage] = useState<number | ''>('')   // '' 이면 끝까지
  const [endToLast, setEndToLast] = useState<boolean>(true) // 기본 '끝까지'

  // 카테고리 패널 접기
  const [openCats, setOpenCats] = useState(true)

  // env - 임베딩 서버
  const [embUrl, setEmbUrl] = useState<string>('')

  // 스케줄러 On/Off 상태
  const [schedOn, setSchedOn] = useState<boolean | null>(null)

  // 작업 중단 상태
  const [cancelled, setCancelled] = useState<boolean | null>(null)

  // 공통 상태
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  // 스케줄러 설정/표시용 상태
  const [schedCfg, setSchedCfg] = useState<SchedulerConfig | null>(null)
  const [loadingSched, setLoadingSched] = useState(false)

  const showToast = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(''), 2200)
  }

  const run = async (fn: () => Promise<any>, okMsg: string, failMsg = '실행 실패') => {
    try {
      setBusy(true)
      await fn()
      showToast(okMsg)
    } catch (e) {
      console.error(e)
      showToast(failMsg)
    } finally {
      setBusy(false)
    }
  }

  // 스케줄러 표시용 포맷
  function fmtKST(iso?: string) {
    if (!iso) return '-'
    const d = new Date(iso)
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  }

  // 입력칸에서만 * 숨기기
  function starToEmpty(v?: string | number | null) {
    if (v == null) return ''
    const s = String(v).trim()
    return s === '*' ? '' : s
  }

  // 🔒 “현재 설정”을 고정 라벨로 보여주기
  const FIXED_ALL_LABEL = '3시 00분'
  const FIXED_PRICE_LABEL = '매시 30분'

  // 입력 비었을 때 기본 저장값
  const FIXED_ALL_DEFAULT = { hour: '3', minute: '0' }
  const FIXED_PRICE_DEFAULT = { hour: '*', minute: '30' }

  async function refreshSched(message?: string) {
    setLoadingSched(true)
    try {
      const cfg = await api.ops.getSchedulerConfig()
      setSchedCfg(cfg)

      // 비제어 input 초기화: * 는 빈칸으로 숨김
      const ah = document.getElementById('all-hour') as HTMLInputElement | null
      const am = document.getElementById('all-minute') as HTMLInputElement | null
      if (ah) ah.value = starToEmpty(cfg.all?.hour)
      if (am) am.value = starToEmpty(cfg.all?.minute)

      const ph = document.getElementById('price-hour') as HTMLInputElement | null
      const pm = document.getElementById('price-minute') as HTMLInputElement | null
      if (ph) ph.value = starToEmpty(cfg.price?.hour)
      if (pm) pm.value = starToEmpty(cfg.price?.minute)

      if (message) showToast(message)
    } finally {
      setLoadingSched(false)
    }
  }

  // ✅ 저장된 categories.json 로드 → 체크박스 반영
  async function loadSavedCategories() {
    try {
      const saved = await api.ops.getCategories()
      const nextChecked: Record<string, boolean> = {}
      for (const k of allKeys) nextChecked[k] = !!saved?.[k]
      setChecked(nextChecked)
      setCategoriesSaved(Object.values(nextChecked).some(Boolean))
    } catch (e) {
      console.error('loadSavedCategories failed', e)
      setCategoriesSaved(false)
    }
  }

  // ✅ (선택) 저장된 .env 로드 → 페이지 범위/임베딩 서버 복원
  async function loadSavedEnvIfAvailable() {
    try {
      const getEnv = (api.ops as any).getEnv
      if (!getEnv) return
      const env = await getEnv()
      const sp = env?.EMART_START_PAGE
      const ep = env?.EMART_END_PAGE
      const eu = env?.EMB_SERVER
      if (sp !== undefined && sp !== null && sp !== '') {
        const n = Number(sp)
        setStartPage(Number.isFinite(n) && n >= 1 ? n : 1)
      }
      if (ep === '' || ep === null || ep === undefined || Number(ep) <= 0) {
        setEndToLast(true)
        setEndPage('')
      } else {
        const n = Number(ep)
        if (Number.isFinite(n) && n >= 1) {
          setEndToLast(false)
          setEndPage(n)
        } else {
          setEndToLast(true)
          setEndPage('')
        }
      }
      if (typeof eu === 'string') setEmbUrl(eu)
    } catch (e) {
      console.debug('getEnv not available or failed:', e)
    }
  }

  // 초기 상태 로드
  useEffect(() => {
    ;(async () => {
      try {
        const [s, t] = await Promise.allSettled([
          api.ops.schedulerStatus(),
          api.ops.tasksStatus(),
        ])
        if (s.status === 'fulfilled') {
          const v = s.value
          if (typeof v?.running === 'boolean') setSchedOn(v.running)
          else if (typeof v?.paused === 'boolean') setSchedOn(!v.paused)
          else setSchedOn(null)
        } else {
          setSchedOn(null)
        }
        if (t.status === 'fulfilled') {
          setCancelled(!!t.value?.cancelled)
        } else {
          setCancelled(null)
        }
      } catch {
        setSchedOn(null)
        setCancelled(null)
      }
      await refreshSched()
      await loadSavedCategories()
      await loadSavedEnvIfAvailable()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 유효성
  const hasSelected = allKeys.some(k => checked[k])
  const pageRangeValid =
    (typeof startPage === 'number' && startPage >= 1) &&
    (endToLast || (typeof endPage === 'number' && endPage >= startPage))
  const embValid = !embUrl || /^https?:\/\//i.test(embUrl)

  // ---- 작업 목록 (단일 선택용) ----
  const SCRAPE_TASKS = [
    { key: 'all',     label: '모든 정보 스크래핑', fn: () => api.ops.runJson() },
    { key: 'price',   label: 'ID & 가격 정보 스크래핑', fn: () => api.ops.runPriceJson() },
    { key: 'nonprice',label: 'ID & 상세 정보 스크래핑', fn: () => api.ops.runNonPriceJson() },
  ] as const

  const UPLOAD_TASKS = [
    { key: 'all',   label: '모든 정보 업로드', fn: () => api.ops.runFirebaseAll() },
    { key: 'price', label: 'ID & 가격 정보 업로드', fn: () => api.ops.runFirebasePrice() },
    { key: 'other', label: 'ID & 상세 정보 업로드', fn: () => api.ops.runFirebaseOther() },
  ] as const

  // 단일 선택 상태
  const [scrapePick, setScrapePick] = useState<string | null>(null)
  const [uploadPick, setUploadPick] = useState<string | null>(null)

  // 실행(방어막: 저장 안 했으면 토스트로 막음)
  const runPicked = async (
    list: readonly { key: string; label: string; fn: () => Promise<any> }[],
    pick: string | null
  ) => {
    if (!pick) return
    if (!categoriesSaved) {
      showToast('카테고리를 먼저 저장해 주세요')
      return
    }
    const t = list.find(x => x.key === pick)
    if (!t) return
    await run(() => t.fn(), `${t.label} 완료`, `${t.label} 실패`)
  }

  return (
    <>
      <Section id="ops-categories" title="카테고리 선택" desc="선택한 카테고리만 저장합니다">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs px-2 py-1 rounded ${categoriesSaved ? 'bg-card text-ok border border-border' : 'bg-card text-muted border border-border'}`}>
            {categoriesSaved ? '저장됨' : '미저장'}
          </span>
          <SmallBtn variant="primary" onClick={() => setOpenCats(v => !v)}>
            {openCats ? '접기' : '펼치기'}
          </SmallBtn>
        </div>

        {openCats && (
          <Field label="카테고리">
            <div className="flex gap-2 mb-2">
              <SmallBtn variant="primary" onClick={() => toggleAll(true)} disabled={busy}>
                모두 선택
              </SmallBtn>
              <SmallBtn onClick={() => toggleAll(false)} disabled={busy}>
                모두 취소
              </SmallBtn>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allKeys.map(k => (
                <label key={k} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                  <input
                    type="checkbox"
                    className="scale-110"
                    checked={!!checked[k]}
                    onChange={e => setChecked(prev => ({ ...prev, [k]: e.target.checked }))}
                  />
                  <span className="text-sm">
                    <span className="font-semibold">{k}</span>{' '}
                    <span className="text-muted">({CATEGORIES[k]})</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <SmallBtn
                variant="primary"
                disabled={busy || !hasSelected}
                onClick={() =>
                  run(async () => {
                    const payload: Record<string, string> = {}
                    allKeys.forEach(k => { if (checked[k]) payload[k] = CATEGORIES[k] })
                    await api.ops.saveCategories(payload)
                    await loadSavedCategories()
                  }, 'categories.json 저장 완료')
                }
              >
                선택한 카테고리로 저장
              </SmallBtn>

              <SmallBtn
                variant="danger"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api.ops.deleteCategories()
                    await loadSavedCategories()
                  }, '카테고리 초기화 완료')
                }
              >
                카테고리 초기화
              </SmallBtn>

              {!hasSelected && (
                <span className="text-xs text-muted">최소 1개 이상 선택하세요.</span>
              )}
            </div>

          </Field>
        )}
      </Section>

      {/* 페이지 범위 */}
      <Section id="ops-env-pages" title="환경 설정 · 페이지 범위" desc=".env에 시작/끝 페이지 저장">
        <Field label="페이지 범위" hint="시작 페이지 ≥ 1, 끝 페이지 ≥ 시작 페이지 / 또는 끝까지">
          <div className="flex flex-wrap items-center gap-3">
            <TextInput
              type="number"
              min={1}
              value={startPage}
              onChange={e => {
                const val = e.target.value
                setStartPage(val === '' ? '' : Number(val))
              }}
              className="w-28 flex-none"
            />

            <span className="text-muted">~</span>

            <label className="inline-flex items-center gap-2 shrink-0 whitespace-nowrap break-keep leading-none">
              <input
                type="checkbox"
                checked={endToLast}
                onChange={e => {
                  const v = e.target.checked
                  setEndToLast(v)
                  if (v) setEndPage('')
                }}
                className="shrink-0"
              />
              <span className="shrink-0">끝까지</span>
            </label>

            <TextInput
              type="number"
              min={1}
              value={endToLast ? '' : endPage}
              onChange={e => {
                const val = e.target.value
                setEndPage(val === '' ? '' : Number(val))
              }}
              className="w-28 flex-none"
              disabled={endToLast}
              placeholder={endToLast ? '자동' : undefined}
            />

            <SmallBtn
              variant="primary"
              disabled={busy || !pageRangeValid}
              onClick={() =>
                run(
                  async () => {
                    const payload = {
                      EMART_START_PAGE: String(startPage),
                      EMART_END_PAGE: endToLast ? '' : String(endPage ?? ''),
                    }
                    await api.ops.saveEnv(payload as any)
                  },
                  '.env 저장 완료',
                  '저장 실패'
                )
              }
            >
              저장
            </SmallBtn>
          </div>
        </Field>
      </Section>

      {/* 임베딩 서버 */}
      <Section id="ops-env-emb" title="환경 설정 · 임베딩 서버" desc=".env에 임베딩 서버 URL 저장">
        <Field label="임베딩 서버 URL" hint="예:http://localhost:8000/index/start">
          <div className="flex flex-wrap items-center gap-3">
            <TextInput
              placeholder="http://..."
              value={embUrl}
              onChange={e => setEmbUrl(e.target.value)}
              className="w-[320px] flex-none"
            />
            <SmallBtn
              variant="primary"
              disabled={busy || !embValid || !embUrl}
              onClick={() =>
                run(async () => {
                  await api.ops.saveEnv({ EMB_SERVER: String(embUrl).trim() } as any)
                }, '.env 저장 완료', '저장 실패')
              }
            >
              저장
            </SmallBtn>
          </div>
        </Field>
      </Section>

      {/* 작업 제어 (중단/재개) */}
      <Section id="ops-tasks" title="작업 제어" desc="수동 실행/스케줄 작업에 중단·재개 신호 전송">
        <div className="flex items-center gap-3">
          <ButtonGroup>
            <SmallBtn
              variant={cancelled ? 'neutral' : 'danger'}
              disabled={busy || cancelled === null}
              onClick={() =>
                run(async () => {
                  await api.ops.tasksStop()
                  setCancelled(true)
                }, '작업 중단 신호 보냄')
              }
            >
              중단
            </SmallBtn>
            <SmallBtn
              variant={cancelled ? 'primary' : 'neutral'}
              disabled={busy || cancelled === null}
              onClick={() =>
                run(async () => {
                  await api.ops.tasksStart()
                  setCancelled(false)
                }, '중단 해제')
              }
            >
              재개
            </SmallBtn>
          </ButtonGroup>

          <span className="text-xs text-muted">
            현재 상태:&nbsp;
            {cancelled === null ? '확인 중…' : cancelled ? '중단중' : '동작중'}
          </span>
        </div>
      </Section>

      {/* 스크래핑 실행: 단일 선택 */}
      <Section id="ops-scrape" title="스크래핑 실행" desc="카테고리를 저장한 뒤, 원하는 작업 하나를 실행">
        <Field label="작업 선택 (하나만)">
          <div className="flex gap-2 mb-3">
            <SmallBtn onClick={() => setScrapePick(null)} disabled={busy}>
              선택 해제
            </SmallBtn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SCRAPE_TASKS.map(t => (
              <label key={t.key} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                <input
                  type="radio"
                  name="scrape-one"
                  className="scale-110"
                  checked={scrapePick === t.key}
                  onChange={() => setScrapePick(t.key)}
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <SmallBtn
              variant="primary"
              disabled={busy || !scrapePick || cancelled === true || !categoriesSaved}
              onClick={() => runPicked(SCRAPE_TASKS, scrapePick)}
            >
              선택한 스크래핑 실행
            </SmallBtn>
            {!categoriesSaved && (
              <span className="text-xs text-bad">카테고리를 저장해야 실행할 수 있습니다.</span>
            )}
          </div>
        </Field>
      </Section>

      {/* Firestore 업로드: 단일 선택 */}
      <Section id="ops-firestore" title="Firestore 업로드" desc="카테고리를 저장한 뒤, 업로드를 실행">
        <Field label="작업 선택 (하나만)">
          <div className="flex gap-2 mb-3">
            <SmallBtn onClick={() => setUploadPick(null)} disabled={busy}>
              선택 해제
            </SmallBtn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {UPLOAD_TASKS.map(t => (
              <label key={t.key} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card">
                <input
                  type="radio"
                  name="upload-one"
                  className="scale-110"
                  checked={uploadPick === t.key}
                  onChange={() => setUploadPick(t.key)}
                />
                <span className="text-sm">{t.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <SmallBtn
              variant="primary"
              disabled={busy || !uploadPick || cancelled === true || !categoriesSaved}
              onClick={() => runPicked(UPLOAD_TASKS, uploadPick)}
            >
              선택한 업로드 실행
            </SmallBtn>
            {!categoriesSaved && (
              <span className="text-xs text-bad">카테고리를 저장해야 실행할 수 있습니다.</span>
            )}
          </div>
        </Field>
      </Section>

      {/* 스케줄러 */}
      <Section id="ops-scheduler" title="스케줄러" desc="정기 작업 On/Off">
        <ButtonGroup>
          <SmallBtn
            variant={schedOn === true ? 'primary' : 'neutral'}
            disabled={busy}
            aria-pressed={schedOn === true}
            onClick={() =>
              run(async () => {
                const res = await api.ops.schedulerOn()
                if (typeof res?.running === 'boolean') setSchedOn(res.running)
                else setSchedOn(true)
              }, '스케줄러 On')
            }
          >
            On
          </SmallBtn>

          <SmallBtn
            variant={schedOn === false ? 'primary' : 'neutral'}
            disabled={busy}
            aria-pressed={schedOn === false}
            onClick={() =>
              run(async () => {
                const res = await api.ops.schedulerOff()
                if (typeof res?.running === 'boolean') setSchedOn(res.running)
                else setSchedOn(false)
              }, '스케줄러 Off')
            }
          >
            Off
          </SmallBtn>

          <SmallBtn onClick={() => refreshSched('스케줄 정보 새로고침')} disabled={loadingSched}>
            스케줄 새로고침
          </SmallBtn>
        </ButtonGroup>
      </Section>

      {/* 스케줄 시간 설정 */}
      <Section id="ops-schedule" title="스케줄 시간 설정" desc="크론(hour/minute) 또는 */N 지원">
        <Field label="전체 스크래핑 (job_all)" hint='(입력 비우면 기본: 3시 00분)'>
          <div className="flex items-center gap-2">
            <TextInput placeholder="hour (기본 3)" className="w-24" id="all-hour" />
            <TextInput placeholder='minute (기본 0)' className="w-24" id="all-minute" />
            <SmallBtn
              variant="primary"
              disabled={loadingSched}
              onClick={() => run(async () => {
                const hRaw = (document.getElementById('all-hour') as HTMLInputElement).value.trim()
                const mRaw = (document.getElementById('all-minute') as HTMLInputElement).value.trim()
                const hour = hRaw === '' ? FIXED_ALL_DEFAULT.hour : (isNaN(+hRaw) ? hRaw : String(+hRaw))
                const minute = mRaw === '' ? FIXED_ALL_DEFAULT.minute : (isNaN(+mRaw) ? mRaw : String(+mRaw))
                await api.ops.setSchedulerConfig({
                  all: { hour, minute },
                  persist: true,
                })
                await refreshSched('스케줄 저장')
              }, '스케줄 저장')}
            >
              저장
            </SmallBtn>
            <SmallBtn
              disabled={loadingSched}
              onClick={() => run(async () => {
                await api.ops.runJobNow('all')
                await refreshSched('즉시 실행 요청됨')
              }, '즉시 실행 요청')}
            >
              바로 실행
            </SmallBtn>
          </div>

          <div className="mt-2 text-xs text-muted">
            <div><span className="font-medium">현재 설정</span> — <b>{FIXED_ALL_LABEL}</b></div>
            <div><span className="font-medium">다음 실행</span> — <b>{fmtKST(schedCfg?.all?.next_run_time)}</b></div>
            {schedOn === false && (
              <div className="mt-1 text-[11px] text-muted">
                일시정지 상태에서는 표시된 ‘다음 실행’이 자동 실행되지 않습니다. 재개(On) 후 주기대로 동작합니다.
              </div>
            )}
          </div>
        </Field>

        <Field label="가격 스크래핑 (job_price)" hint='(입력 비우면 기본: 매시 30분)'>
          <div className="flex items-center gap-2">
            <TextInput placeholder="hour(빈칸=매시)" className="w-24" id="price-hour" />
            <TextInput placeholder="minute (기본 30)" className="w-24" id="price-minute" />
            <SmallBtn
              variant="primary"
              disabled={loadingSched}
              onClick={() => run(async () => {
                const hRaw = (document.getElementById('price-hour') as HTMLInputElement).value.trim()
                const mRaw = (document.getElementById('price-minute') as HTMLInputElement).value.trim()
                const hour = hRaw === '' ? FIXED_PRICE_DEFAULT.hour : (isNaN(+hRaw) ? hRaw : String(+hRaw))
                const minute = mRaw === '' ? FIXED_PRICE_DEFAULT.minute : (isNaN(+mRaw) ? mRaw : String(+mRaw))
                await api.ops.setSchedulerConfig({
                  price: { hour, minute },
                  persist: true,
                })
                await refreshSched('스케줄 저장')
              }, '스케줄 저장')}
            >
              저장
            </SmallBtn>
            <SmallBtn
              disabled={loadingSched}
              onClick={() => run(async () => {
                await api.ops.runJobNow('price')
                await refreshSched('즉시 실행 요청됨')
              }, '즉시 실행 요청')}
            >
              바로 실행
            </SmallBtn>
          </div>

          <div className="mt-2 text-xs text-muted">
            <div><span className="font-medium">현재 설정</span> — <b>{FIXED_PRICE_LABEL}</b></div>
            <div><span className="font-medium">다음 실행</span> — <b>{fmtKST(schedCfg?.price?.next_run_time)}</b></div>
            {schedOn === false && (
              <div className="mt-1 text-[11px] text-muted">
                일시정지 상태에서는 표시된 ‘다음 실행’이 자동 실행되지 않습니다. 재개(On) 후 주기대로 동작합니다.
              </div>
            )}
          </div>
        </Field>
      </Section>

      <Toast msg={toast} />
    </>
  )
}
