'use client'

import type { PropsWithChildren } from 'react'
import { designToStyle, responsiveDataAttributes } from '../design'
import { scopedImportedCss } from '../css-fidelity'
import type { StudioDesignStyle, StudioImportedCssRule, StudioResponsiveState } from '../types'
import styles from './studio-runtime.module.css'

export function StudioDesignShell({ children, blockId, style, responsive, importedRules, hidden }:
  PropsWithChildren<{ blockId: string; style?: StudioDesignStyle; responsive?: StudioResponsiveState; importedRules?: StudioImportedCssRule[]; hidden?: boolean }>) {
  if (hidden) return null
  const responsiveCss=scopedImportedCss(blockId, importedRules)
  return <div className={styles.designShell} data-ac-studio-block={blockId} style={designToStyle(style)} {...responsiveDataAttributes(responsive)}>{responsiveCss?<style>{responsiveCss}</style>:null}{children}</div>
}
