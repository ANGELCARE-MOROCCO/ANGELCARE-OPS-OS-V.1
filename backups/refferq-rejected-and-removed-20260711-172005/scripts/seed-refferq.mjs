import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.REFFERQ_DATABASE_URL;

if (!databaseUrl) {
  console.error('REFFERQ_DATABASE_URL is not configured');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 3,
});

function toRefferqPgValue(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === "object" && !(value instanceof Date)) return JSON.stringify(value);
  return value;
}


async function query(text, params = []) {
  return pool.query(text, params);
}

async function upsertUser({ id, email, name, password, role, status }) {
  const result = await query(
    `
      insert into refferq.users (id, email, name, password, role, status)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (email) do update set
        name = excluded.name,
        password = excluded.password,
        role = excluded.role,
        status = excluded.status,
        updated_at = now()
      returning *
    `,
    [id || null, email, name, password, role, status]
  );
  return result.rows[0];
}

async function upsertAffiliate({ id, userId, referralCode, payoutDetails, balanceCents, partnerGroupId }) {
  const result = await query(
    `
      insert into refferq.affiliates (id, user_id, referral_code, payout_details, balance_cents, partner_group_id)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (user_id) do update set
        referral_code = excluded.referral_code,
        payout_details = excluded.payout_details,
        balance_cents = excluded.balance_cents,
        partner_group_id = excluded.partner_group_id,
        updated_at = now()
      returning *
    `,
    [id || null, userId, referralCode, toRefferqPgValue(payoutDetails), balanceCents, partnerGroupId || null]
  );
  return result.rows[0];
}

async function upsertById(table, row, conflictTarget = 'id') {
  const columns = Object.keys(row);
  const values = columns.map((key) => toRefferqPgValue(row[key]));
  const updates = columns.filter((key) => key !== 'id').map((key) => `${key} = excluded.${key}`);
  const sql = `
    insert into refferq.${table} (${columns.join(', ')})
    values (${columns.map((_, index) => `$${index + 1}`).join(', ')})
    on conflict (${conflictTarget}) do update set ${updates.join(', ')}
    returning *
  `;
  const result = await query(sql, values);
  return result.rows[0];
}

async function main() {
  console.log('🌱 Seeding RefferQ inside AngelCare...');
  const demoPasswordHash = await bcrypt.hash('password', 12);

  const admin = await upsertUser({
    id: 'refferq-seed-admin',
    email: 'admin@example.com',
    name: 'RefferQ Admin',
    password: demoPasswordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  const sarah = await upsertUser({
    id: 'refferq-seed-sarah',
    email: 'sarah.johnson@example.com',
    name: 'Sarah Johnson',
    password: demoPasswordHash,
    role: 'AFFILIATE',
    status: 'ACTIVE',
  });

  const david = await upsertUser({
    id: 'refferq-seed-david',
    email: 'david.lee@example.com',
    name: 'David Lee',
    password: demoPasswordHash,
    role: 'AFFILIATE',
    status: 'ACTIVE',
  });

  const defaultProgram = await upsertById('program_settings', {
    id: 'refferq-default-program-settings',
    program_id: 'refferq-default-program',
    product_name: 'RefferQ',
    program_name: 'RefferQ Affiliate Program',
    website_url: 'https://refferq.example.com',
    currency: 'USD',
    blocked_countries: [],
    portal_subdomain: 'refferq',
    terms_of_service: null,
    minimum_payout_threshold: 0,
    payout_term: 'NET-15',
    payout_methods: ['PAYPAL'],
    brand_background_color: '#0f172a',
    brand_button_color: '#0ea5e9',
    brand_text_color: '#ffffff',
    company_logo: null,
    favicon: null,
    cookie_duration: 30,
    url_parameters: [],
    hide_customer_emails: true,
    disable_personalized_links: false,
    block_keywords: [],
    block_social_media_ads: [],
    allow_manual_lead_submission: true,
    program_wide_coupon_code: null,
    hide_partner_links: false,
    require_business_email: false,
    enable_postbacks: false,
    auto_approve_payouts: false,
    payout_frequency: 'MONTHLY',
    commission_hold_days: 30,
    min_payout_cents: 100000,
    company_name: 'RefferQ',
  }, 'program_id');

  const defaultGroup = await upsertById('partner_groups', {
    id: 'refferq-default-partner-group',
    name: 'Default Partners',
    description: 'Primary onboarding group for seeded demo partners',
    commission_rate: 20,
    signup_url: 'https://refferq.example.com/register',
    is_default: true,
  });

  const sarahAffiliate = await upsertAffiliate({
    id: 'refferq-seed-sarah-affiliate',
    userId: sarah.id,
    referralCode: 'SARAH-2026',
    payoutDetails: { method: 'PAYPAL', email: 'sarah.johnson@example.com' },
    balanceCents: 0,
    partnerGroupId: defaultGroup.id,
  });

  const davidAffiliate = await upsertAffiliate({
    id: 'refferq-seed-david-affiliate',
    userId: david.id,
    referralCode: 'DAVID-2026',
    payoutDetails: { method: 'PAYPAL', email: 'david.lee@example.com' },
    balanceCents: 0,
    partnerGroupId: defaultGroup.id,
  });

  const referral = await upsertById('referrals', {
    id: 'refferq-seed-referral-1',
    affiliate_id: sarahAffiliate.id,
    lead_name: 'John Smith',
    lead_email: 'john.smith@example.com',
    lead_phone: null,
    subscription_id: 'sub_demo_001',
    status: 'APPROVED',
    notes: 'Seeded demo referral',
    metadata: { company: 'TechCorp', estimated_value: 150000 },
    reviewed_by: admin.id,
    reviewed_at: new Date(),
    review_notes: 'Seed approval',
  });

  const conversion = await upsertById('conversions', {
    id: 'refferq-seed-conversion-1',
    affiliate_id: sarahAffiliate.id,
    referral_id: referral.id,
    event_type: 'PURCHASE',
    amount_cents: 225000,
    currency: 'USD',
    status: 'APPROVED',
    event_metadata: { customerId: 'cust_abc123', planType: 'enterprise_annual' },
  });

  await upsertById('commissions', {
    id: 'refferq-seed-commission-1',
    conversion_id: conversion.id,
    affiliate_id: sarahAffiliate.id,
    user_id: sarah.id,
    amount_cents: 33750,
    rate: 15,
    status: 'APPROVED',
    approved_by: admin.id,
    approved_at: new Date(),
    payout_id: null,
    matures_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  await upsertById('commission_rules', {
    id: 'refferq-default-commission-rule',
    name: 'Default Commission',
    type: 'PERCENTAGE',
    value: 15,
    conditions: {},
    is_default: true,
    is_active: true,
  });

  console.log('✅ RefferQ seed data ensured:', {
    admin: admin.email,
    sarah: sarah.email,
    david: david.email,
    defaultProgram: defaultProgram.program_id,
    defaultGroup: defaultGroup.name,
  });
}

main()
  .catch((error) => {
    console.error('❌ RefferQ seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
    console.log('🏁 RefferQ seeding completed');
  });
