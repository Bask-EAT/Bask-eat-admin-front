import React from 'react'

export function Section({
  title,
  desc,
  children,
  id
}: { title:string; desc?:string; children:React.ReactNode; id?:string }) {
  return (
    <section id={id} className="border border-border rounded-md overflow-hidden bg-bg">
      <div className="px-4 py-3 border-b border-border bg-card">
        {/* ⬇ text-lg로 크기 확대 */}
        <div className="text-lg font-semibold text-fg">{title}</div>
        {desc && <div className="text-xs text-muted mt-1">{desc}</div>}
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  )
}


export function Field({ label, hint, children }: { label:string; hint?:string; children:React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-4 items-start">
      <div>
        <label className="text-sm font-medium text-fg">{label}</label>
        {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function TextInput(props: JSX.IntrinsicElements['input']) {
  return (
    <input
      {...props}
      className={`w-full text-sm rounded-md border border-border bg-card text-fg px-3 py-2 outline-none focus:ring-2 focus:ring-pri ${props.className ?? ''}`}
    />
  )
}

export function Select(props: JSX.IntrinsicElements['select']) {
  return (
    <select
      {...props}
      className={`w-full text-sm rounded-md border border-border bg-card text-fg px-3 py-2 outline-none focus:ring-2 focus:ring-pri ${props.className ?? ''}`}
    />
  )
}

export function Button(props: JSX.IntrinsicElements['button']) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center text-center gap-2 text-sm rounded-md border border-border bg-pri text-white hover:brightness-110 px-3 py-2 disabled:opacity-60 disabled:cursor-not-allowed ${props.className ?? ''}`}
    />
  )
}

