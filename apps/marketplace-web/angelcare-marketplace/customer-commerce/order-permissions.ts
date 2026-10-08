export type OrderCommandPermissions = {
  createOrder: boolean
  manageOrder: boolean
  manageLines: boolean
  manageFinance: boolean
  exportDocuments: boolean
}

export const readOnlyOrderPermissions: OrderCommandPermissions = {
  createOrder: false,
  manageOrder: false,
  manageLines: false,
  manageFinance: false,
  exportDocuments: false,
}
