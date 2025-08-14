import React from 'react'

type Variant = 'primary' | 'neutral' | 'danger'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export default function SmallBtn({ variant = 'neutral', className = '', ...rest }: Props) {
  const base = 'px-3 py-1 text-xs flex items-center gap-1 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition'
  const tone =
    variant === 'primary'
      ? 'bg-pri text-white hover:brightness-110'
      : variant === 'danger'
        ? 'bg-card text-bad hover:bg-border'
        : 'bg-card text-fg hover:bg-border'
  return <button className={`${base} ${tone} ${className}`} {...rest} />
}
