export const finalServerActionTemplate = {
  createContentAsset: {
    runtime: 'server-only',
    steps: [
      'validate input',
      'check permission',
      'write record',
      'write audit event',
      'return typed response',
    ],
  },
  approveContentItem: {
    runtime: 'server-only',
    steps: [
      'validate reviewer',
      'check approval authority',
      'update approval state',
      'write audit event',
      'notify workflow',
    ],
  },
};