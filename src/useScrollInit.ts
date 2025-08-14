// src/useScrollInit.ts
import { useLayoutEffect, useRef } from 'react';

type Options = {
  enabled?: boolean; // 필요한 화면에서만 켜기
};

export function useScrollInit(headerPx = 56, extra = 8, opts: Options = {}) {
  const { enabled = true } = opts;
  const ran = useRef(false);

  useLayoutEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;

    // 1) index.html에서 넣어둔 초기 해시 우선 사용하되, 즉시 제거하여 반복 방지
    let stored = sessionStorage.getItem('initial-hash');
    if (stored) {
      sessionStorage.removeItem('initial-hash');
      // 만약 '#'만 있거나 이상하면 무시
      if (stored === '#' || stored.length <= 1) stored = '';
    }

    // 2) 실제로 사용할 해시 결정
    const rawHash = stored || window.location.hash;
    if (!rawHash || rawHash === '#' || rawHash.length <= 1) return; // ❗해시 없으면 아무것도 안 함

    const id = decodeURIComponent(rawHash.slice(1));
    if (!id) return;

    const offset = headerPx + extra;

    const apply = () => {
      const el = document.getElementById(id);
      if (!el) return; // 요소 없으면 스킵

      const y = el.getBoundingClientRect().top + window.scrollY - offset;

      // 이미 사실상 같은 위치면 스킵(불필요 스크롤 방지)
      if (Math.abs((window.scrollY ?? 0) - y) < 1) return;

      window.scrollTo({ top: Math.max(y, 0), behavior: 'auto' });
    };

    // 레이아웃 확정 후 딱 한 번만 시도
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }, [enabled, headerPx, extra]);
}
