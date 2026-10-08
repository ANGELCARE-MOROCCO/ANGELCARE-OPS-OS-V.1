export type CustomerDossierPermissions = {
  manageCustomer: boolean
  manageFamily: boolean
  createOrder: boolean
  createBooking: boolean
  manageBooking: boolean
  manageFinance: boolean
  approveFinanceException: boolean
  transitionOpportunity: boolean
  manageQuotes: boolean
  approveQuotes: boolean
  commentOnCustomer: boolean
  manageCrmTasks: boolean
  logCrmCommunications: boolean
  exportCustomer: boolean
}

export const READ_ONLY_CUSTOMER_PERMISSIONS: CustomerDossierPermissions = {
  manageCustomer: false,
  manageFamily: false,
  createOrder: false,
  createBooking: false,
  manageBooking: false,
  manageFinance: false,
  approveFinanceException: false,
  transitionOpportunity: false,
  manageQuotes: false,
  approveQuotes: false,
  commentOnCustomer: false,
  manageCrmTasks: false,
  logCrmCommunications: false,
  exportCustomer: false,
}
