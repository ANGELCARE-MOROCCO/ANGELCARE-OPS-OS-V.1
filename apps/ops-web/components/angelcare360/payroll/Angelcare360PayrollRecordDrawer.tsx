import type { Angelcare360PayrollRecordDetailRecord } from '@/types/angelcare360/payroll'
import Angelcare360PayrollRecordDetail from './Angelcare360PayrollRecordDetail'

type Props = {
  record: Angelcare360PayrollRecordDetailRecord
}

export default function Angelcare360PayrollRecordDrawer({ record }: Props) {
  return <Angelcare360PayrollRecordDetail record={record} />
}
