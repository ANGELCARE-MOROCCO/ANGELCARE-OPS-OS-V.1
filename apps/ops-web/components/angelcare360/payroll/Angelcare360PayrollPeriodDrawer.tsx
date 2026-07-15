import type { Angelcare360PayrollPeriodDetailRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollPeriodDetail from './Angelcare360PayrollPeriodDetail'

type Props = {
  period: Angelcare360PayrollPeriodDetailRecord
}

export default function Angelcare360PayrollPeriodDrawer({ period }: Props) {
  return <Angelcare360PayrollPeriodDetail period={period} />
}
