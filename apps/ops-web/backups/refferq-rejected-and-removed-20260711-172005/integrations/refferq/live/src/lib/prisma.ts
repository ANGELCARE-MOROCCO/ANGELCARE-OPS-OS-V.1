// @ts-nocheck
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { unstable_cache } from 'next/cache';
import {
  RefferqDatabaseUnavailableError,
  assertRefferqDatabaseConfigured,
  getRefferqDatabaseUrl,
  isRefferqDatabaseConfigured,
} from './env';

type Where = Record<string, any>;
type Select = Record<string, boolean>;
type Include = Record<string, any>;

const globalForRefferq = globalThis as typeof globalThis & {
  __refferqPool?: Pool;
};

const MODEL_TABLES: Record<string, string> = {
  user: 'users',
  affiliate: 'affiliates',
  referral: 'referrals',
  referralClick: 'referral_clicks',
  conversion: 'conversions',
  commission: 'commissions',
  payout: 'payouts',
  commissionRule: 'commission_rules',
  auditLog: 'audit_logs',
  OTP: 'otps',
  programSettings: 'program_settings',
  partnerGroup: 'partner_groups',
  transaction: 'transactions',
  emailTemplate: 'email_templates',
  emailLog: 'email_logs',
  integrationSettings: 'integration_settings',
  webhook: 'webhooks',
  webhookLog: 'webhook_logs',
  scheduledReport: 'scheduled_reports',
  savedReport: 'saved_reports',
  apiKey: 'api_keys',
  apiUsageLog: 'api_usage_logs',
  rateLimitEntry: 'rate_limit_entries',
  coupon: 'coupons',
  resource: 'resources',
  invoice: 'invoices',
  program: 'programs',
  teamMember: 'team_members',
};

const RELATIONS: Record<string, Record<string, { model: string; type: 'one' | 'many'; foreignKey: string; localKey?: string }>> = {
  user: {
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'userId' },
    auditLogs: { model: 'auditLog', type: 'many', foreignKey: 'actorId' },
    commissions: { model: 'commission', type: 'many', foreignKey: 'userId' },
    payouts: { model: 'payout', type: 'many', foreignKey: 'userId' },
  },
  affiliate: {
    user: { model: 'user', type: 'one', foreignKey: 'id', localKey: 'userId' },
    partnerGroup: { model: 'partnerGroup', type: 'one', foreignKey: 'id', localKey: 'partnerGroupId' },
    commissions: { model: 'commission', type: 'many', foreignKey: 'affiliateId' },
    conversions: { model: 'conversion', type: 'many', foreignKey: 'affiliateId' },
    referrals: { model: 'referral', type: 'many', foreignKey: 'affiliateId' },
    transactions: { model: 'transaction', type: 'many', foreignKey: 'affiliateId' },
    payouts: { model: 'payout', type: 'many', foreignKey: 'affiliateId' },
  },
  referral: {
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'id', localKey: 'affiliateId' },
    conversions: { model: 'conversion', type: 'many', foreignKey: 'referralId' },
    clicks: { model: 'referralClick', type: 'many', foreignKey: 'referralId' },
    transactions: { model: 'transaction', type: 'many', foreignKey: 'referralId' },
  },
  referralClick: {
    referral: { model: 'referral', type: 'one', foreignKey: 'id', localKey: 'referralId' },
  },
  conversion: {
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'id', localKey: 'affiliateId' },
    referral: { model: 'referral', type: 'one', foreignKey: 'id', localKey: 'referralId' },
    commissions: { model: 'commission', type: 'many', foreignKey: 'conversionId' },
  },
  commission: {
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'id', localKey: 'affiliateId' },
    conversion: { model: 'conversion', type: 'one', foreignKey: 'id', localKey: 'conversionId' },
    user: { model: 'user', type: 'one', foreignKey: 'id', localKey: 'userId' },
    payout: { model: 'payout', type: 'one', foreignKey: 'id', localKey: 'payoutId' },
  },
  payout: {
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'id', localKey: 'affiliateId' },
    user: { model: 'user', type: 'one', foreignKey: 'id', localKey: 'userId' },
    commissions: { model: 'commission', type: 'many', foreignKey: 'payoutId' },
  },
  commissionRule: {},
  auditLog: {
    actor: { model: 'user', type: 'one', foreignKey: 'id', localKey: 'actorId' },
  },
  OTP: {},
  programSettings: {},
  partnerGroup: {
    affiliates: { model: 'affiliate', type: 'many', foreignKey: 'partnerGroupId' },
  },
  transaction: {
    referral: { model: 'referral', type: 'one', foreignKey: 'id', localKey: 'referralId' },
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'id', localKey: 'affiliateId' },
  },
  emailTemplate: {
    emailLogs: { model: 'emailLog', type: 'many', foreignKey: 'templateId' },
  },
  emailLog: {
    template: { model: 'emailTemplate', type: 'one', foreignKey: 'id', localKey: 'templateId' },
  },
  integrationSettings: {},
  webhook: {
    logs: { model: 'webhookLog', type: 'many', foreignKey: 'webhookId' },
  },
  webhookLog: {
    webhook: { model: 'webhook', type: 'one', foreignKey: 'id', localKey: 'webhookId' },
  },
  scheduledReport: {},
  savedReport: {},
  apiKey: {
    usageLogs: { model: 'apiUsageLog', type: 'many', foreignKey: 'apiKeyId' },
  },
  apiUsageLog: {
    apiKey: { model: 'apiKey', type: 'one', foreignKey: 'id', localKey: 'apiKeyId' },
  },
  rateLimitEntry: {},
  coupon: {},
  resource: {},
  invoice: {
    affiliate: { model: 'affiliate', type: 'one', foreignKey: 'id', localKey: 'affiliateId' },
    payout: { model: 'payout', type: 'one', foreignKey: 'id', localKey: 'payoutId' },
  },
  program: {},
  teamMember: {},
};

function getPool(): Pool {
  assertRefferqDatabaseConfigured();

  if (!globalForRefferq.__refferqPool) {
    globalForRefferq.__refferqPool = new Pool({
      connectionString: getRefferqDatabaseUrl() || undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      statement_timeout: 30_000,
    });
  }

  return globalForRefferq.__refferqPool;
}

function quoteIdentifier(value: string) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function getTableName(model: string) {
  const table = MODEL_TABLES[model];
  if (!table) throw new Error(`Unsupported RefferQ model: ${model}`);
  return `refferq.${quoteIdentifier(table)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function camelizeKey(key: string) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function decamelizeKey(key: string) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function serializeValue(value: any) {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value;
}

function normalizeRow(row: Record<string, any>) {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    output[camelizeKey(key)] = value;
  }
  return output;
}

function pick(row: Record<string, any>, select?: Select) {
  if (!select) return clone(row);
  const output: Record<string, any> = {};
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) output[key] = clone(row[key]);
  }
  return output;
}

function compareValue(actual: any, expected: any): boolean {
  if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
    if ('equals' in expected && actual !== expected.equals) return false;
    if ('not' in expected) {
      if (expected.not === null) return actual !== null && actual !== undefined;
      if (actual === expected.not) return false;
    }
    const actualDate = actual instanceof Date ? actual.getTime() : typeof actual === 'string' ? Date.parse(actual) : NaN;
    const expectedDate = expected instanceof Date ? expected.getTime() : undefined;
    if ('gte' in expected) {
      const left = actual instanceof Date || typeof actual === 'string' ? actualDate : Number(actual);
      const right = expected.gte instanceof Date ? expected.gte.getTime() : typeof expected.gte === 'string' ? Date.parse(expected.gte) : Number(expected.gte);
      if (!(left >= right)) return false;
    }
    if ('lte' in expected) {
      const left = actual instanceof Date || typeof actual === 'string' ? actualDate : Number(actual);
      const right = expected.lte instanceof Date ? expected.lte.getTime() : typeof expected.lte === 'string' ? Date.parse(expected.lte) : Number(expected.lte);
      if (!(left <= right)) return false;
    }
    if ('gt' in expected) {
      const left = actual instanceof Date || typeof actual === 'string' ? actualDate : Number(actual);
      const right = expected.gt instanceof Date ? expected.gt.getTime() : typeof expected.gt === 'string' ? Date.parse(expected.gt) : Number(expected.gt);
      if (!(left > right)) return false;
    }
    if ('lt' in expected) {
      const left = actual instanceof Date || typeof actual === 'string' ? actualDate : Number(actual);
      const right = expected.lt instanceof Date ? expected.lt.getTime() : typeof expected.lt === 'string' ? Date.parse(expected.lt) : Number(expected.lt);
      if (!(left < right)) return false;
    }
    if ('in' in expected && Array.isArray(expected.in) && !expected.in.includes(actual)) return false;
    if ('contains' in expected && typeof actual === 'string' && !actual.includes(expected.contains)) return false;
    if ('startsWith' in expected && typeof actual === 'string' && !actual.startsWith(expected.startsWith)) return false;
    if ('endsWith' in expected && typeof actual === 'string' && !actual.endsWith(expected.endsWith)) return false;
    return true;
  }
  return actual === expected;
}

function normalizeWhere(where?: Where): Where | undefined {
  if (!where) return undefined;
  const keys = Object.keys(where);
  if (keys.length === 1) {
    const value = where[keys[0]];
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      return value as Where;
    }
  }
  return where;
}

function matchesWhere(row: Record<string, any>, where?: Where): boolean {
  const normalized = normalizeWhere(where);
  if (!normalized) return true;

  return Object.entries(normalized).every(([key, expected]) => {
    if (key === 'OR' && Array.isArray(expected)) return expected.some((entry) => matchesWhere(row, entry));
    if (key === 'AND' && Array.isArray(expected)) return expected.every((entry) => matchesWhere(row, entry));
    const actual = row[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
      if (actual && typeof actual === 'object' && !Array.isArray(actual) && !(actual instanceof Date)) {
        return matchesWhere(actual, expected as Where);
      }
      return compareValue(actual, expected);
    }
    return compareValue(actual, expected);
  });
}

function sortRows(rows: Record<string, any>[], orderBy?: any) {
  if (!orderBy) return rows;
  const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((left, right) => {
    for (const order of orders) {
      if (!order || typeof order !== 'object') continue;
      const [[key, direction]] = Object.entries(order);
      const leftValue = left[key];
      const rightValue = right[key];
      if (leftValue === rightValue) continue;
      const leftComparable = leftValue instanceof Date ? leftValue.getTime() : leftValue;
      const rightComparable = rightValue instanceof Date ? rightValue.getTime() : rightValue;
      const result = leftComparable > rightComparable ? 1 : -1;
      return direction === 'desc' ? -result : result;
    }
    return 0;
  });
}

function paginateRows(rows: Record<string, any>[], take?: number, skip?: number) {
  let output = rows;
  if (typeof skip === 'number' && skip > 0) output = output.slice(skip);
  if (typeof take === 'number') output = output.slice(0, take);
  return output;
}

function mergeUpdateData(current: Record<string, any>, data: Record<string, any>) {
  const next = { ...current };
  for (const [key, value] of Object.entries(data || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      if ('increment' in value) {
        next[key] = Number(next[key] || 0) + Number(value.increment || 0);
        continue;
      }
      if ('decrement' in value) {
        next[key] = Number(next[key] || 0) - Number(value.decrement || 0);
        continue;
      }
      if ('set' in value) {
        next[key] = value.set;
        continue;
      }
    }
    next[key] = value;
  }

  if ('updatedAt' in current || 'updatedAt' in data) {
    next.updatedAt = new Date();
  }

  return next;
}

async function fetchRows(model: string) {
  const pool = getPool();
  const table = getTableName(model);
  const { rows } = await pool.query(`select * from ${table}`);
  return rows.map((row) => normalizeRow(row));
}

async function fetchRelatedRows(parentModel: string, parentRow: Record<string, any>, relationName: string, relationArgs: any) {
  const relation = RELATIONS[parentModel]?.[relationName];
  if (!relation) return null;
  const localKey = relation.localKey || 'id';
  const localValue = parentRow[localKey];
  if (localValue === undefined || localValue === null) return relation.type === 'many' ? [] : null;

  const relatedRows = await findManyInternal(relation.model, {
    where: { [relation.foreignKey]: localValue },
  });

  const result = relation.type === 'many' ? relatedRows : relatedRows[0] || null;
  if (!result) return relation.type === 'many' ? [] : null;

  if (relationArgs && typeof relationArgs === 'object' && relationArgs !== true) {
    return relation.type === 'many'
      ? await Promise.all(result.map((item: any) => materializeRow(relation.model, item, relationArgs)))
      : await materializeRow(relation.model, result, relationArgs);
  }

  return result;
}

async function materializeRow(model: string, row: Record<string, any>, args: any = {}) {
  const selected = args?.select ? pick(row, args.select) : clone(row);
  if (!args?.include) return selected;

  const includeEntries = Object.entries(args.include as Include);
  const nested = await Promise.all(
    includeEntries.map(async ([relationName, relationArgs]) => {
      const relation = await fetchRelatedRows(model, row, relationName, relationArgs);
      return [relationName, relation] as const;
    })
  );

  return {
    ...selected,
    ...Object.fromEntries(nested),
  };
}

async function findManyInternal(model: string, args: any = {}) {
  const rows = await fetchRows(model);
  const filtered = rows.filter((row) => matchesWhere(row, args?.where));
  const ordered = sortRows(filtered, args?.orderBy);
  const paginated = paginateRows(ordered, args?.take, args?.skip);
  return Promise.all(paginated.map((row) => materializeRow(model, row, args)));
}

async function aggregateInternal(model: string, args: any = {}) {
  const rows = await fetchRows(model);
  const filtered = rows.filter((row) => matchesWhere(row, args?.where));
  const result: Record<string, any> = {};

  if (args?._sum) {
    result._sum = {};
    for (const key of Object.keys(args._sum)) {
      result._sum[key] = filtered.reduce((sum, row) => sum + Number(row[key] || 0), 0);
    }
  }

  if (args?._avg) {
    result._avg = {};
    for (const key of Object.keys(args._avg)) {
      const total = filtered.reduce((sum, row) => sum + Number(row[key] || 0), 0);
      result._avg[key] = filtered.length ? total / filtered.length : null;
    }
  }

  if (args?._count) {
    if (args._count === true) {
      result._count = filtered.length;
    } else if (typeof args._count === 'object') {
      result._count = {};
      for (const key of Object.keys(args._count)) {
        result._count[key] = filtered.length;
      }
    }
  }

  return result;
}

async function groupByInternal(model: string, args: any = {}) {
  const rows = await fetchRows(model);
  const filtered = rows.filter((row) => matchesWhere(row, args?.where));
  const by = Array.isArray(args?.by) ? args.by : [];
  const groups = new Map<string, Record<string, any>>();

  for (const row of filtered) {
    const key = JSON.stringify(by.map((field) => row[field] ?? null));
    if (!groups.has(key)) {
      const entry: Record<string, any> = {};
      for (const field of by) entry[field] = row[field] ?? null;
      entry._count = 0;
      entry._sum = {};
      entry._avg = {};
      groups.set(key, entry);
    }

    const entry = groups.get(key)!;
    entry._count += 1;

    for (const keyName of Object.keys(args?._sum || {})) {
      entry._sum[keyName] = (entry._sum[keyName] || 0) + Number(row[keyName] || 0);
    }

    for (const keyName of Object.keys(args?._avg || {})) {
      const bucket = entry._avg[keyName] || { total: 0, count: 0 };
      bucket.total += Number(row[keyName] || 0);
      bucket.count += 1;
      entry._avg[keyName] = bucket;
    }
  }

  let output = Array.from(groups.values()).map((entry) => {
    const normalized = { ...entry };
    for (const [key, value] of Object.entries(normalized._avg || {})) {
      normalized._avg[key] = value.count ? value.total / value.count : null;
    }
    return normalized;
  });

  if (args?.orderBy) {
    const orders = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
    output = [...output].sort((left, right) => {
      for (const order of orders) {
        if (!order || typeof order !== 'object') continue;
        const [[key, direction]] = Object.entries(order);
        if (key === '_count' && typeof direction === 'object') {
          const [[countKey, countDirection]] = Object.entries(direction);
          const leftValue = left._count;
          const rightValue = right._count;
          if (leftValue === rightValue) continue;
          const result = leftValue > rightValue ? 1 : -1;
          return countDirection === 'desc' ? -result : result;
        }
        const leftValue = left[key];
        const rightValue = right[key];
        if (leftValue === rightValue) continue;
        const result = leftValue > rightValue ? 1 : -1;
        return direction === 'desc' ? -result : result;
      }
      return 0;
    });
  }

  return paginateRows(output, args?.take, args?.skip);
}

async function createRow(model: string, data: Record<string, any>, args: any = {}) {
  const pool = getPool();
  const table = getTableName(model);
  const row = { ...data };
  if (!row.id) row.id = `${model}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if ('createdAt' in row === false) row.createdAt = new Date();
  if ('updatedAt' in row === false) row.updatedAt = new Date();

  const columns = Object.keys(row);
  const values = columns.map((key) => serializeValue(row[key]));
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const sql = `insert into ${table} (${columns.map((key) => quoteIdentifier(decamelizeKey(key))).join(', ')}) values (${placeholders}) returning *`;
  const result = await pool.query(sql, values);
  return materializeRow(model, normalizeRow(result.rows[0]), args);
}

async function updateRow(model: string, where: Where | undefined, data: Record<string, any>, args: any = {}) {
  const pool = getPool();
  const table = getTableName(model);
  const rows = await findManyInternal(model, { where });
  const current = rows[0];
  if (!current) throw new Error(`Record not found for ${model}.update`);
  const merged = mergeUpdateData(current, data);
  const updateColumns = Object.keys(merged).filter((key) => key !== 'id');
  const values = updateColumns.map((key) => serializeValue(merged[key]));
  values.push(current.id);
  const sql = `update ${table} set ${updateColumns.map((key, index) => `${quoteIdentifier(decamelizeKey(key))} = $${index + 1}`).join(', ')} where ${quoteIdentifier('id')} = $${updateColumns.length + 1} returning *`;
  const result = await pool.query(sql, values);
  return materializeRow(model, normalizeRow(result.rows[0]), args);
}

async function deleteRow(model: string, where: Where | undefined, args: any = {}) {
  const pool = getPool();
  const table = getTableName(model);
  const rows = await findManyInternal(model, { where });
  const current = rows[0];
  if (!current) throw new Error(`Record not found for ${model}.delete`);
  const result = await pool.query(`delete from ${table} where ${quoteIdentifier('id')} = $1 returning *`, [current.id]);
  return materializeRow(model, normalizeRow(result.rows[0]), args);
}

function delegate(model: string): any {
  return new Proxy(
    {},
    {
      get(_target, method: string) {
        if (method === '$connect' || method === '$disconnect') {
          return async () => undefined;
        }

        return async (args: any = {}) => {
          if (!isRefferqDatabaseConfigured()) {
            throw new RefferqDatabaseUnavailableError();
          }

          switch (method) {
            case 'findUnique':
            case 'findFirst': {
              const rows = await findManyInternal(model, { ...args, take: 1 });
              return rows[0] || null;
            }
            case 'findMany':
              return findManyInternal(model, args);
            case 'create':
              return createRow(model, args?.data ?? {}, args);
            case 'update':
              return updateRow(model, args?.where, args?.data ?? {}, args);
            case 'delete':
              return deleteRow(model, args?.where, args);
            case 'deleteMany': {
              const rows = await findManyInternal(model, { where: args?.where });
              let count = 0;
              for (const row of rows) {
                await poolDelete(model, row.id);
                count += 1;
              }
              return { count };
            }
            case 'updateMany': {
              const rows = await findManyInternal(model, { where: args?.where });
              let count = 0;
              for (const row of rows) {
                await updateRow(model, { id: row.id }, args?.data ?? {}, {});
                count += 1;
              }
              return { count };
            }
            case 'count': {
              const rows = await findManyInternal(model, { where: args?.where });
              return rows.length;
            }
            case 'aggregate':
              return aggregateInternal(model, args);
            case 'groupBy':
              return groupByInternal(model, args);
            case 'upsert': {
              const existing = await findManyInternal(model, { where: args?.where, take: 1 });
              if (existing[0]) {
                return updateRow(model, { id: existing[0].id }, args?.update ?? {}, args);
              }
              const createData = { ...(args?.create ?? {}), ...(normalizeWhere(args?.where) || {}) };
              return createRow(model, createData, args);
            }
            default:
              return undefined;
          }
        };
      },
    }
  );
}

async function poolDelete(model: string, id: string) {
  const pool = getPool();
  const table = getTableName(model);
  await pool.query(`delete from ${table} where ${quoteIdentifier('id')} = $1`, [id]);
}

export const prisma: any = new Proxy(
  {},
  {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return delegate(prop);
    },
  }
);

// Database service class with Prisma methods
export class DatabaseService {
  // User operations
  async createUser(userData: {
    email: string;
    password: string; // Already hashed by the caller/AuthService
    name: string;
    role: 'ADMIN' | 'AFFILIATE';
  }) {
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        status: userData.role === 'ADMIN' ? 'ACTIVE' : 'INACTIVE',
      },
    });

    return user;
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        affiliate: true,
      },
    });
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        affiliate: true,
      },
    });
  }

  async updateUser(id: string, updates: Parameters<typeof prisma.user.update>[0]['data']) {
    return await prisma.user.update({
      where: { id },
      data: updates,
    });
  }

  async verifyPassword(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Affiliate operations
  async createAffiliate(affiliateData: {
    userId: string;
    referralCode: string;
    payoutDetails?: any;
  }) {
    return await prisma.affiliate.create({
      data: {
        userId: affiliateData.userId,
        referralCode: affiliateData.referralCode,
        payoutDetails: affiliateData.payoutDetails || {},
      },
    });
  }

  async getAffiliateByUserId(userId: string) {
    return await prisma.affiliate.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });
  }

  async getAffiliateByReferralCode(code: string) {
    return await prisma.affiliate.findUnique({
      where: { referralCode: code },
      include: {
        user: true,
      },
    });
  }

  async getAllAffiliates() {
    return await prisma.affiliate.findMany({
      include: {
        user: true,
      },
    });
  }

  async updateAffiliate(id: string, updates: Parameters<typeof prisma.affiliate.update>[0]['data']) {
    return await prisma.affiliate.update({
      where: { id },
      data: updates,
    });
  }

  // Referral operations
  async createReferral(referralData: {
    affiliateId: string;
    leadName: string;
    leadEmail: string;
    metadata?: any;
  }) {
    return await prisma.referral.create({
      data: {
        affiliateId: referralData.affiliateId,
        leadName: referralData.leadName,
        leadEmail: referralData.leadEmail,
        metadata: referralData.metadata || {},
        status: 'PENDING',
      },
    });
  }

  async getReferralById(id: string) {
    return await prisma.referral.findUnique({
      where: { id },
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getReferralsByAffiliate(affiliateId: string) {
    return await prisma.referral.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingReferrals() {
    return await prisma.referral.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReferral(id: string, updates: Parameters<typeof prisma.referral.update>[0]['data']) {
    return await prisma.referral.update({
      where: { id },
      data: updates,
    });
  }

  // Conversion operations
  async createConversion(conversionData: {
    affiliateId: string;
    referralId?: string;
    eventType: 'SIGNUP' | 'PURCHASE' | 'TRIAL' | 'LEAD';
    amountCents: number;
    currency?: string;
    eventMetadata?: any;
  }) {
    return await prisma.conversion.create({
      data: {
        affiliateId: conversionData.affiliateId,
        referralId: conversionData.referralId,
        eventType: conversionData.eventType,
        amountCents: conversionData.amountCents,
        currency: conversionData.currency || 'USD',
        eventMetadata: conversionData.eventMetadata || {},
        status: 'PENDING',
      },
    });
  }

  async getConversionsByAffiliate(affiliateId: string) {
    return await prisma.conversion.findMany({
      where: { affiliateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Commission operations
  async createCommission(commissionData: {
    conversionId: string;
    affiliateId: string;
    userId: string;
    amountCents: number;
    rate: number;
    approvedBy?: string;
  }) {
    return await prisma.commission.create({
      data: {
        conversionId: commissionData.conversionId,
        affiliateId: commissionData.affiliateId,
        userId: commissionData.userId,
        amountCents: commissionData.amountCents,
        rate: commissionData.rate,
        status: commissionData.approvedBy ? 'APPROVED' : 'PENDING',
        approvedBy: commissionData.approvedBy,
        approvedAt: commissionData.approvedBy ? new Date() : undefined,
      },
    });
  }

  async getCommissionsByAffiliate(affiliateId: string) {
    return await prisma.commission.findMany({
      where: { affiliateId },
      include: {
        conversion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCommissions() {
    return await prisma.commission.findMany({
      where: { status: 'PENDING' },
      include: {
        affiliate: {
          include: {
            user: true,
          },
        },
        conversion: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCommission(id: string, updates: Parameters<typeof prisma.commission.update>[0]['data']) {
    return await prisma.commission.update({
      where: { id },
      data: updates,
    });
  }

  // Commission Rules
  async createCommissionRule(ruleData: {
    name: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    conditions?: any;
    isDefault?: boolean;
  }) {
    return await prisma.commissionRule.create({
      data: ruleData,
    });
  }

  async getCommissionRules() {
    return await prisma.commissionRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDefaultCommissionRule() {
    return await prisma.commissionRule.findFirst({
      where: { isDefault: true },
    });
  }

  // Payout operations
  async createPayout(payoutData: {
    userId: string;
    affiliateId: string;
    amountCents: number;
    commissionCount: number;
    method?: string;
    notes?: string;
    createdBy: string;
  }) {
    return await prisma.payout.create({
      data: {
        userId: payoutData.userId,
        affiliateId: payoutData.affiliateId,
        amountCents: payoutData.amountCents,
        commissionCount: payoutData.commissionCount,
        method: payoutData.method || 'Bank Transfer',
        notes: payoutData.notes,
        status: 'PENDING',
        createdBy: payoutData.createdBy,
      },
    });
  }

  async getPayoutsByUser(userId: string) {
    return await prisma.payout.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tracking operations
  async createReferralClick(clickData: {
    referralId: string;
    ipAddress: string;
    userAgent?: string;
    referer?: string;
    metadata?: any;
  }) {
    return await prisma.referralClick.create({
      data: {
        referralId: clickData.referralId,
        ipAddress: clickData.ipAddress,
        userAgent: clickData.userAgent,
        referer: clickData.referer,
        metadata: clickData.metadata || {},
      },
    });
  }

  async getClicksByReferralId(referralId: string) {
    return await prisma.referralClick.findMany({
      where: { referralId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Audit log operations
  async createAuditLog(logData: {
    actorId: string;
    action: string;
    objectType: string;
    objectId: string;
    payload?: any;
  }) {
    return await prisma.auditLog.create({
      data: {
        actorId: logData.actorId,
        action: logData.action,
        objectType: logData.objectType,
        objectId: logData.objectId,
        payload: logData.payload || {},
      },
    });
  }

  // Settings operations
  getPlatformSettings = unstable_cache(
    async () => {
      // Return the first program's settings as default
      return await prisma.programSettings.findFirst();
    },
    ['platform-settings'],
    { tags: ['platform-settings'], revalidate: 3600 }
  );

  getProgramSettings = unstable_cache(
    async (programId: string) => {
      return await prisma.programSettings.findUnique({
        where: { programId },
      });
    },
    ['program-settings'],
    { tags: ['program-settings'], revalidate: 3600 }
  );

  // Analytics and statistics
  async getAffiliateStats(affiliateId: string) {
    const affiliate = await this.getAffiliateByUserId(affiliateId);
    if (!affiliate) {
      return {
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalCommissions: 0,
        pendingCommissions: 0,
        approvedCommissions: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
      };
    }

    const [clicks, conversions, commissions] = await Promise.all([
      prisma.referralClick.count({
        where: {
          referral: {
            affiliateId: affiliate.id
          }
        },
      }),
      prisma.conversion.count({
        where: { affiliateId: affiliate.id },
      }),
      prisma.commission.findMany({
        where: { affiliateId: affiliate.id },
      }),
    ]);

    const pendingCommissions = commissions.filter((c: any) => c.status === 'PENDING');
    const approvedCommissions = commissions.filter((c: any) => c.status === 'APPROVED');

    return {
      totalClicks: clicks,
      totalConversions: conversions,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      totalCommissions: commissions.length,
      pendingCommissions: pendingCommissions.length,
      approvedCommissions: approvedCommissions.length,
      totalEarnings: commissions.reduce((sum: number, c: any) => sum + c.amountCents, 0),
      pendingEarnings: pendingCommissions.reduce((sum: number, c: any) => sum + c.amountCents, 0),
    };
  }

  async getPlatformStats() {
    const [
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalReferrals,
      pendingReferrals,
      approvedReferrals,
      totalConversions,
      totalCommissions,
      clicks,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'AFFILIATE' } }),
      prisma.user.count({ where: { role: 'AFFILIATE', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'AFFILIATE', status: 'INACTIVE' } }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'PENDING' } }),
      prisma.referral.count({ where: { status: 'APPROVED' } }),
      prisma.conversion.count(),
      prisma.commission.count(),
      prisma.referralClick.count(),
    ]);

    const conversions = await prisma.conversion.findMany({
      select: { amountCents: true },
    });

    const totalRevenue = conversions.reduce((sum: number, c: any) => sum + c.amountCents, 0);

    return {
      totalAffiliates,
      activeAffiliates,
      pendingAffiliates,
      totalReferrals,
      pendingReferrals,
      approvedReferrals,
      totalConversions,
      totalCommissions,
      totalRevenue,
      conversionRate: clicks > 0 ? (totalConversions / clicks) * 100 : 0,
    };
  }

  // Seed data for development
  async seedDatabase() {
    try {
      // Check if data already exists
      const existingUsers = await prisma.user.count();
      if (existingUsers > 0) {
        console.log('Database already seeded');
        return;
      }

      // Create admin user
      const adminUser = await this.createUser({
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin User',
        role: 'ADMIN',
      });

      // Create affiliate users
      const affiliate1User = await this.createUser({
        email: 'sarah.johnson@example.com',
        password: 'password',
        name: 'Sarah Johnson',
        role: 'AFFILIATE',
      });

      const affiliate2User = await this.createUser({
        email: 'david.lee@example.com',
        password: 'password',
        name: 'David Lee',
        role: 'AFFILIATE',
      });

      // Update affiliate users to active
      await this.updateUser(affiliate1User.id, { status: 'ACTIVE' });
      await this.updateUser(affiliate2User.id, { status: 'ACTIVE' });

      // Create affiliate profiles
      const affiliate1 = await this.createAffiliate({
        userId: affiliate1User.id,
        referralCode: 'SARAH-TECH',
        payoutDetails: {
          method: 'bank_transfer',
          bankAccount: '*****1234',
          routingNumber: '123456789',
        },
      });

      const affiliate2 = await this.createAffiliate({
        userId: affiliate2User.id,
        referralCode: 'DAVID-SALES',
        payoutDetails: {
          method: 'stripe_connect',
          stripeAccountId: 'acct_1234567890',
        },
      });

      // Create commission rules
      await this.createCommissionRule({
        name: 'Standard Rate',
        type: 'PERCENTAGE',
        value: 15,
        isDefault: true,
      });

      await this.createCommissionRule({
        name: 'Enterprise Tier',
        type: 'PERCENTAGE',
        value: 20,
        conditions: { minAmountCents: 500000 }, // $5000+
      });

      await this.createCommissionRule({
        name: 'Bonus Rate',
        type: 'PERCENTAGE',
        value: 25,
        conditions: {
          tierRequirements: {
            minMonthlyReferrals: 10,
          },
        },
      });

      // Create sample referrals
      const referral1 = await this.createReferral({
        affiliateId: affiliate1.id,
        leadName: 'John Smith',
        leadEmail: 'john@techcorp.com',
        metadata: {
          company: 'TechCorp',
          notes: 'Enterprise client, high value lead',
          estimatedValue: 150000,
        },
      });

      const referral2 = await this.createReferral({
        affiliateId: affiliate2.id,
        leadName: 'Maria Garcia',
        leadEmail: 'maria@startup.io',
        metadata: {
          company: 'StartupXYZ',
          notes: 'Interested in premium plan',
          estimatedValue: 80000,
        },
      });

      // Approve one referral and create conversion
      await this.updateReferral(referral2.id, {
        status: 'APPROVED',
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewNotes: 'Approved - verified lead quality',
      });

      // Create conversion for approved referral
      const conversion = await this.createConversion({
        affiliateId: affiliate1.id,
        eventType: 'PURCHASE',
        amountCents: 225000, // $2250
        eventMetadata: {
          customerId: 'cust_abc123',
          productId: 'prod_enterprise',
          planType: 'enterprise_annual',
        },
      });

      // Create commission
      await this.createCommission({
        conversionId: conversion.id,
        affiliateId: affiliate1.id,
        userId: affiliate1User.id,
        amountCents: 33750, // 15% of $2250
        rate: 15,
        approvedBy: adminUser.id,
      });

      // Update affiliate balance
      await this.updateAffiliate(affiliate1.id, {
        balanceCents: 33750,
      });

      // Create sample clicks
      await this.createReferralClick({
        referralId: referral1.id, // Use referral ID instead of referral code
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: { attributionKey: `attr_${Date.now()} ` },
      });

      console.log('Database seeded successfully with sample data');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  }
}

export const db = new DatabaseService();
