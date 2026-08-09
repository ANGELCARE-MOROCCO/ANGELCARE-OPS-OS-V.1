export type AttendanceEventType = 'punch_in' | 'punch_out' | 'break_start' | 'break_end' | 'manual_adjustment'
export type AttendanceView = 'day' | 'week' | 'agenda' | 'people' | 'exceptions'
export type AttendanceRecord = Record<string, any>
