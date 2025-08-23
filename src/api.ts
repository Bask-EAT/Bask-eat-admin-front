// api.ts (완성본)

// ---------- Types ----------
export type ProductResult = {
  id: string
  product_name?: string
  category?: string
  image_url?: string
  product_address?: string
  quantity?: string
  out_of_stock?: string
  last_updated?: string
  is_emb?: string
  similarity_score?: number
  price?: number
  last_price_updated?: string
  price_history?: {
    last_updated?: string
    original_price?: string
    selling_price?: string
  }[]
}

export type SearchResponse = { results: ProductResult[] }

export type Status = {
  status?: string
  progress?: number
  total?: number
  items?: any[]
  running?: boolean
  cancel_requested?: boolean
}

export type SchedulerStatus = {
  status?: string
  running?: boolean
  paused?: boolean
  stopped?: boolean
  state?: number
  message?: string
  error?: string
}

export type TaskFlag = {
  status?: string
  cancelled?: boolean
  message?: string
  error?: string
}

export type SchedulerConfig = {
  status?: string
  timezone?: string
  all?: { type?: string; hour?: string | number; minute?: string | number; next_run_time?: string }
  price?: { type?: string; hour?: string | number; minute?: string | number; next_run_time?: string }
  old?: { type?: string; hour?: string | number; minute?: string | number; next_run_time?: string }
}

export type MessageResponse = { message: string }

// ---- categories.json 관련 타입 ----
export type CategoriesMap = Record<string, string>
export type SaveCategoriesResponse = {
  status?: string
  path?: string
  data?: CategoriesMap
  message?: string
  error?: string
}

// ---- env 타입(선택) ----
export type EnvMap = Record<string, string | number | boolean | null | undefined>

export type CategoryCountsResponse = {
  counts: Record<string, number>;
  total: number;
  ratios: Record<string, number>;
};

// ---------- Base URL & Helpers ----------
const ORIGIN =
  (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/+$/,'') || '';

const DEFAULT_API_BASE = '/ops/embed';
const DEFAULT_OPS_BASE = '/ops/scrape';

function normBase(v: string | undefined, fallback: string) {
  let x = (v ?? '').trim();
  if (!x) x = fallback;
  if (!x.startsWith('/')) x = '/' + x;  // 항상 슬래시로 시작
  return x.replace(/\/+$/,'');          // 끝 슬래시 제거
}

const API_BASE = normBase(import.meta.env.VITE_OPS_EMBED_PREFIX as string | undefined, DEFAULT_API_BASE);
const OPS_BASE  = normBase(import.meta.env.VITE_OPS_SCRAPE_PREFIX  as string | undefined, DEFAULT_OPS_BASE);

if (import.meta.env.DEV) {
  console.info('[api] ORIGIN        =', ORIGIN || '(current origin)');
  console.info('[api] API_BASE      =', API_BASE);
  console.info('[api] OPS_BASE      =', OPS_BASE);
}

// 절대 URL 조인: origin + base + path
const joinAbs = (origin: string, base: string, path: string) =>
  `${origin}${base}${path.startsWith('/') ? path : `/${path}`}`;

const apiUrl = (path: string) => joinAbs(ORIGIN, API_BASE, path);
const opsUrl = (path: string) => joinAbs(ORIGIN, OPS_BASE, path);

// ---------- Fetch defaults ----------
const USE_CREDENTIALS = false; // 쿠키 인증을 쓰는 경우 true

function withDefaults(init?: RequestInit): RequestInit {
  return {
    credentials: USE_CREDENTIALS ? 'include' : 'same-origin',
    ...init,
  }
}

// ---------- JSON helpers ----------
async function ensureJsonResponse(res: Response, method: string, url: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${method} ${url} -> ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`)
  }
  if (res.status === 204) return null
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '')
    throw new Error(`${method} ${url} -> unexpected content-type: "${ct}"${text ? `, body: ${text}` : ''}`)
  }
  return res.json()
}

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, withDefaults(init))
  const json = await ensureJsonResponse(res, 'GET', url)
  return (json ?? {}) as T
}

async function postJSON<T>(url: string, body?: any, init?: RequestInit): Promise<T> {
  const res = await fetch(url, withDefaults({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  }))
  const json = await ensureJsonResponse(res, 'POST', url)
  return (json ?? {}) as T
}

async function postForm<T>(url: string, fd: FormData, init?: RequestInit): Promise<T> {
  const res = await fetch(url, withDefaults({ method: 'POST', body: fd, ...init }))
  const json = await ensureJsonResponse(res, 'POST(form)', url)
  return (json ?? {}) as T
}

async function deleteJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, withDefaults({ method: 'DELETE', ...(init || {}) }))
  const json = await ensureJsonResponse(res, 'DELETE', url)
  return (json ?? {}) as T
}

// ---------- helpers ----------
type HistoryView = 'all' | 'latest' | 'none'
function withHistory(path: string, history: HistoryView) {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}history=${history}`
}

// ---------- API surface ----------
export const api = {
  // ---------- 검색/멀티모달 ----------
  async textSearch(query: string, top_k: number, history: HistoryView = 'all') {
    return postJSON<SearchResponse>(apiUrl(withHistory('/search/text', history)), { query, top_k })
  },

  async imageSearch(file: File, top_k: number, history: HistoryView = 'all') {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('top_k', String(top_k))
    return postForm<SearchResponse>(apiUrl(withHistory('/search/image', history)), fd)
  },

  async multimodalSearch(query: string, file: File, alpha: number, top_k: number, history: HistoryView = 'all') {
    const fd = new FormData()
    fd.append('query', query)
    fd.append('file', file)
    fd.append('alpha', String(alpha))
    fd.append('top_k', String(top_k))
    return postForm<SearchResponse>(apiUrl(withHistory('/search/multimodal', history)), fd)
  },

  // ---------- 인덱싱 ----------
  async startIndex() {
    return postJSON<MessageResponse>(apiUrl('/index/start'))
  },

  async stopIndex() {
    return postJSON<MessageResponse>(apiUrl('/index/stop'))
  },

  async getStatus() {
    return getJSON<Status>(apiUrl('/index/status'))
  },

  async getLogs() {
    return getJSON<{ logs: string[] }>(apiUrl('/index/logs'))
  },

  async clearLogs(): Promise<{ ok: boolean }> {
    return deleteJSON<{ ok: boolean }>(apiUrl('/index/logs'))
  },

  async registerWebhook(urlStr: string) {
    const fd = new FormData()
    fd.append('url', urlStr)
    return postForm<{ message: string }>(apiUrl('/index/webhook'), fd)
  },

  // ---------- 운영(Ops / emart FastAPI) ----------
  ops: {
    getCategories() {
      return getJSON<CategoriesMap>(opsUrl('/categories'))
    },

    saveCategories(payload: CategoriesMap) {
      return postJSON<SaveCategoriesResponse>(opsUrl('/save_categories'), payload)
    },

    deleteCategories() {
      return deleteJSON<{ status?: string; message?: string; error?: string }>(opsUrl('/delete_categories'))
    },

    // EMART_END_PAGE는 ''(끝까지) 또는 number 허용
    saveEnv(partial: { EMART_START_PAGE?: number; EMART_END_PAGE?: number | ''; EMB_SERVER?: string }) {
      return postJSON<{ status?: string; error?: string }>(opsUrl('/save_env'), partial)
    },

    // ✅ 베스트에포트: /env 없거나 비JSON이면 빈 객체 반환(에러로 앱 멈추지 않음)
    async getEnv(): Promise<EnvMap> {
      try {
        const res = await fetch(opsUrl('/env'), withDefaults())
        if (!res.ok) return {}
        const ct = res.headers.get('content-type') || ''
        if (!ct.includes('application/json')) return {}
        return (await res.json()) as EnvMap
      } catch {
        return {}
      }
    },

    runJson() {
      return postJSON(opsUrl('/run_json'))
    },
    runPriceJson() {
      return postJSON(opsUrl('/run_price_json'))
    },
    runNonPriceJson() {
      return postJSON(opsUrl('/run_non_price_json'))
    },
    runImage() {
      return postJSON(opsUrl('/run_image'))
    },

    runFirebaseAll() {
      return postJSON(opsUrl('/run_firebase_all'))
    },
    runFirebasePrice() {
      return postJSON(opsUrl('/run_firebase_price'))
    },
    runFirebaseOther() {
      return postJSON(opsUrl('/run_firebase_other'))
    },

    schedulerOn() {
      return postJSON<SchedulerStatus>(opsUrl('/scheduler/on'))
    },
    schedulerOff() {
      return postJSON<SchedulerStatus>(opsUrl('/scheduler/off'))
    },
    schedulerStatus() {
      return getJSON<SchedulerStatus>(opsUrl('/scheduler/status'))
    },

    tasksStatus() {
      return getJSON<TaskFlag>(opsUrl('/tasks/status'))
    },
    tasksStop() {
      return postJSON<TaskFlag>(opsUrl('/tasks/stop'))
    },
    tasksStart() {
      return postJSON<TaskFlag>(opsUrl('/tasks/start'))
    },

    getSchedulerConfig() {
      return getJSON<SchedulerConfig>(opsUrl('/scheduler/config'))
    },
    setSchedulerConfig(payload: {
      all?: { hour?: number | string; minute?: number | string }
      price?: { hour?: number | string; minute?: number | string }
      old?: { hour?: number | string; minute?: number | string }
      persist?: boolean
    }) {
      return postJSON<SchedulerConfig>(opsUrl('/scheduler/config'), payload)
    },
    runJobNow(which: 'all' | 'price' | 'old') {
      return postJSON<{ status?: string; error?: string }>(opsUrl(`/scheduler/run-now?which=${which}`))
    },
  },
}

// ---------- Metrics ----------
export async function fetchCategoryCounts(params?: {
  only_embedded?: "D" | "R";
  category_field?: string;
}): Promise<CategoryCountsResponse> {
  const q = new URLSearchParams();
  if (params?.only_embedded) q.set("only_embedded", params.only_embedded);
  if (params?.category_field) q.set("category_field", params.category_field);
  const url = apiUrl(`/metrics/category-counts?${q.toString()}`);
  const res = await fetch(url, withDefaults());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> unexpected content-type: "${ct}"${text ? `, body: ${text}` : ''}`);
  }
  return res.json() as Promise<CategoryCountsResponse>;
}
