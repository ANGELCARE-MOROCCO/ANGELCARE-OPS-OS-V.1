import crypto from 'crypto'

export const SANILA_MASTER_DEMO_FIXTURE_COUNTS = Object.freeze({
  students: 600,
  parents: 450,
  classes: 36,
  employees: 72,
  teachers: 48,
  admissions: 60,
  attendance: 6000,
  invoices: 600,
  payments: 480,
  transport: 300,
  library: 120,
  libraryLoans: 45,
  inventory: 40,
  claims: 8,
})

export function masterDemoFixtureUuid(configId: string, fixtureKey: string) {
  const hash = crypto.createHash('md5').update(`${configId}:${fixtureKey}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

export function studentFixtureRelationship(studentNumber: number) {
  if (!Number.isInteger(studentNumber) || studentNumber < 1 || studentNumber > SANILA_MASTER_DEMO_FIXTURE_COUNTS.students) throw new Error('Invalid canonical student number.')
  return {
    studentKey: `student:${studentNumber}`,
    parentKey: `parent:${1 + ((studentNumber - 1) % SANILA_MASTER_DEMO_FIXTURE_COUNTS.parents)}`,
    classKey: `class:${1 + ((studentNumber - 1) % SANILA_MASTER_DEMO_FIXTURE_COUNTS.classes)}`,
    sectionKey: `section:${1 + ((studentNumber - 1) % SANILA_MASTER_DEMO_FIXTURE_COUNTS.classes)}`,
    invoiceKey: `invoice:${studentNumber}`,
    transportKey: studentNumber <= SANILA_MASTER_DEMO_FIXTURE_COUNTS.transport ? `transport-assignment:${studentNumber}` : null,
  }
}
