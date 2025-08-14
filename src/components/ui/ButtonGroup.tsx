import React from 'react'

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> & {
  children: React.ReactNode
  className?: string
  /** true면 그룹을 꽉 차게 분배 */
  justified?: boolean
}

export default function ButtonGroup({
  children,
  className = '',
  justified = false,
  ...rest
}: Props) {
  return (
    <div
      {...rest} // role, aria-*, data-*, onClick 등 표준 속성 허용
      className={[
        'flex rounded-lg border border-border overflow-hidden',
        justified ? 'divide-x divide-border [&>*]:flex-1' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
