'use client'
import React from 'react'
import UserActivityTracker from '@/components/users/UserActivityTracker'
import VoicePhoneWidgetGate from '@/app/components/VoicePhoneWidgetGate'
import AngelCareConnect from '@/app/components/connect/AngelCareConnect'
import OverheadPanel from '@/app/components/erp/OverheadPanel'
import OpsosTelemetryProvider from '@/components/opsos-control-plane/OpsosTelemetryProvider'
export default function ProtectedShell({children}:{children:React.ReactNode}){
  return <><UserActivityTracker/><OverheadPanel/><div className="min-h-screen w-full" style={{paddingTop:86}}><OpsosTelemetryProvider>{children}</OpsosTelemetryProvider></div><VoicePhoneWidgetGate/><AngelCareConnect/></>
}
