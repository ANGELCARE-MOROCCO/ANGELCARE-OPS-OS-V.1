"use client"

import React from "react"

type State = {
  hasError: boolean
  message?: string
}

export default class EmailOSErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error) {
    console.error("Email-OS UI error:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-xl font-black text-slate-950">Email-OS encountered a UI error</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{this.state.message || "Unknown UI error"}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: undefined })}
              className="mt-5 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
