import React from 'react'
import type { SearchResponse } from '../api'

export default function ResultsList({ data }: { data?: SearchResponse }) {
  const items = data?.results ?? []
  if (!items.length) return <div className="codebox">No results</div>
  return (
    <div className="grid gap-2">
      {items.map((it) => (
        <div key={it.id} className="item">
          <div className="thumb">{it.image_url ? <img src={it.image_url} /> : null}</div>
          <div>
            <div className="meta-title">{it.product_name ?? it.id}</div>
            <div className="meta-sub">{it.category ?? ''}</div>
            <div className="meta-sub">similarity: {typeof it.similarity_score === 'number' ? it.similarity_score.toFixed(4) : '-'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}