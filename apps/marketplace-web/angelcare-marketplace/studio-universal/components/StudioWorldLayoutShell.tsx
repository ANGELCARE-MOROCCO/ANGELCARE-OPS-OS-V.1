'use client'

import type { CSSProperties, PropsWithChildren } from 'react'
import type { StudioBlockProps } from '../types'
import { StudioDesignShell } from './StudioDesignShell'
import styles from './studio-runtime.module.css'

const text = (value: unknown, fallback = '') => value == null ? fallback : String(value)
const number = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function StudioWorldLayoutShell({
  type,
  props,
  authority,
  children,
}: PropsWithChildren<{
  type: string
  props: StudioBlockProps
  authority: 'world-factory' | 'candidate-world-factory'
}>) {
  const id = text(props.id, type)
  const kind = type.replace(/^ac_/, '')
  const klass = (styles as Record<string, string>)[kind] || styles.layout
  const layoutStyle = {
    backgroundColor: text(props.backgroundColor) || undefined,
    '--ac-layout-max': text(props.maxWidth, '1460px'),
    '--ac-cols-mobile': String(number(props.columnsMobile, 1)),
    '--ac-cols-tablet': String(number(props.columnsTablet, 2)),
    '--ac-cols-desktop': String(number(props.columnsDesktop, 4)),
    '--ac-gap-mobile': `${number(props.gapMobile, 16)}px`,
    '--ac-gap-tablet': `${number(props.gapTablet, 20)}px`,
    '--ac-gap-desktop': `${number(props.gapDesktop, 24)}px`,
    '--ac-stack-direction': text(props.direction, 'column'),
  } as CSSProperties

  return (
    <StudioDesignShell
      blockId={id}
      style={props.sourceDesign}
      responsive={props.responsive}
      importedRules={props.__studioImportedRules}
      hidden={props.hidden}
    >
      <div
        className={`${styles.layout} ${klass}`}
        style={layoutStyle}
        data-ac-world-type={type}
        data-ac-world-visual-authority={authority}
        data-ac-world-role={String((props.__worldFactory as Record<string, unknown> | undefined)?.role || '') || undefined}
      >
        {children}
      </div>
    </StudioDesignShell>
  )
}
