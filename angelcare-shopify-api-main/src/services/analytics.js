const {
  executeShopifyGraphql,
  executeShopifyRest,
} = require('./shopify');

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Number(numberValue(value).toFixed(2));
}

function sumMoney(items, getAmount) {
  return roundMoney(items.reduce((sum, item) => sum + numberValue(getAmount(item)), 0));
}

function unavailable(section, error) {
  return {
    ok: false,
    section,
    error: error instanceof Error ? error.message : String(error || 'Unavailable'),
  };
}

async function optionalSection(section, task) {
  try {
    return {
      ok: true,
      section,
      data: await task(),
    };
  } catch (error) {
    return unavailable(section, error);
  }
}

function buildPendingAnalytics() {
  return {
    generatedAt: new Date().toISOString(),
    customers: {
      ok: false,
      section: 'customers',
      error: 'Admin token required for customer analytics.',
      data: emptyCustomerAnalytics(),
    },
    checkouts: {
      ok: false,
      section: 'checkouts',
      error: 'Admin token required for abandoned checkout analytics.',
      data: emptyCheckoutAnalytics(),
    },
    payments: {
      ok: false,
      section: 'payments',
      error: 'Admin token and Shopify Payments scopes required for payout analytics.',
      data: emptyPaymentAnalytics(),
    },
    funnel: {
      ok: false,
      section: 'funnel',
      error: 'Admin token required for checkout/order proxy analytics.',
      data: emptyFunnelAnalytics(),
    },
    issues: [],
  };
}

function emptyCustomerAnalytics() {
  return {
    totalShown: 0,
    repeatCustomers: 0,
    marketingEmailSubscribers: 0,
    totalCustomerSpend: 0,
    averageCustomerValue: 0,
    currencyCode: null,
    topCustomers: [],
  };
}

function emptyCheckoutAnalytics() {
  return {
    totalShown: 0,
    openCount: null,
    openValue: 0,
    currencyCode: null,
    checkouts: [],
  };
}

function emptyPaymentAnalytics() {
  return {
    currentBalance: null,
    balanceCurrencyCode: null,
    payoutsShown: 0,
    scheduledPayoutValue: 0,
    paidPayoutValue: 0,
    currencyCode: null,
    payouts: [],
    balanceTransactions: [],
  };
}

function emptyFunnelAnalytics() {
  return {
    paidOrders: 0,
    abandonedCheckouts: 0,
    checkoutRecoveryProxyRate: null,
    note: 'This is order and abandoned-checkout based, not a sessions conversion rate.',
  };
}

async function fetchCustomerAnalytics(env, first = 25) {
  const query = `
    query CustomerAnalytics($first: Int!) {
      customers(first: $first, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          displayName
          createdAt
          updatedAt
          numberOfOrders
          amountSpent {
            amount
            currencyCode
          }
          defaultEmailAddress {
            emailAddress
            marketingState
          }
          defaultPhoneNumber {
            phoneNumber
            marketingState
          }
          lastOrder {
            name
            createdAt
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
          tags
        }
      }
    }
  `;

  const { data } = await executeShopifyGraphql(env, query, { first }, { minimumCost: 100 });
  const customers = data.customers.nodes.map((customer) => ({
    id: customer.id,
    displayName: customer.displayName,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    numberOfOrders: Number(customer.numberOfOrders || 0),
    amountSpent: roundMoney(customer.amountSpent?.amount),
    currencyCode: customer.amountSpent?.currencyCode || null,
    email: customer.defaultEmailAddress?.emailAddress || null,
    emailMarketingState: customer.defaultEmailAddress?.marketingState || null,
    phone: customer.defaultPhoneNumber?.phoneNumber || null,
    phoneMarketingState: customer.defaultPhoneNumber?.marketingState || null,
    lastOrderName: customer.lastOrder?.name || null,
    lastOrderAt: customer.lastOrder?.createdAt || null,
    tags: customer.tags || [],
  }));

  const totalCustomerSpend = sumMoney(customers, (customer) => customer.amountSpent);
  const repeatCustomers = customers.filter((customer) => customer.numberOfOrders > 1).length;
  const marketingEmailSubscribers = customers.filter((customer) => customer.emailMarketingState === 'SUBSCRIBED').length;
  const currencyCode = customers.find((customer) => customer.currencyCode)?.currencyCode || null;

  return {
    totalShown: customers.length,
    repeatCustomers,
    marketingEmailSubscribers,
    totalCustomerSpend,
    averageCustomerValue: customers.length ? roundMoney(totalCustomerSpend / customers.length) : 0,
    currencyCode,
    topCustomers: [...customers]
      .sort((left, right) => right.amountSpent - left.amountSpent)
      .slice(0, 8),
  };
}

function normalizeCheckout(checkout) {
  return {
    id: String(checkout.id || ''),
    token: checkout.token || null,
    email: checkout.email || null,
    createdAt: checkout.created_at || null,
    updatedAt: checkout.updated_at || null,
    totalPrice: roundMoney(checkout.total_price),
    subtotalPrice: roundMoney(checkout.subtotal_price),
    currencyCode: checkout.currency || checkout.presentment_currency || null,
    abandonedCheckoutUrl: checkout.abandoned_checkout_url || checkout.web_url || null,
    lineItemsCount: Array.isArray(checkout.line_items) ? checkout.line_items.length : 0,
  };
}

async function fetchCheckoutAnalytics(env, limit = 25) {
  const [listPayload, countResult] = await Promise.all([
    executeShopifyRest(env, '/checkouts.json', { limit, status: 'open' }),
    optionalSection('abandonedCheckoutsCount', () => executeShopifyRest(env, '/checkouts/count.json', { status: 'open' })),
  ]);

  const checkouts = (listPayload.checkouts || []).map(normalizeCheckout);
  const openValue = sumMoney(checkouts, (checkout) => checkout.totalPrice);
  const currencyCode = checkouts.find((checkout) => checkout.currencyCode)?.currencyCode || null;

  return {
    totalShown: checkouts.length,
    openCount: countResult.ok ? Number(countResult.data.count || 0) : null,
    openValue,
    currencyCode,
    checkouts,
  };
}

async function fetchPaymentAnalytics(env, first = 10) {
  const query = `
    query PaymentAnalytics($first: Int!) {
      shopifyPaymentsAccount {
        balance {
          amount
          currencyCode
        }
        payouts(first: $first, reverse: true) {
          nodes {
            id
            issuedAt
            status
            transactionType
            net {
              amount
              currencyCode
            }
          }
        }
        balanceTransactions(first: $first) {
          nodes {
            id
            type
            test
            sourceType
            adjustmentReason
            amount {
              amount
              currencyCode
            }
            fee {
              amount
            }
            net {
              amount
            }
            associatedPayout {
              id
              status
            }
            associatedOrder {
              id
              name
            }
          }
        }
      }
    }
  `;

  const { data } = await executeShopifyGraphql(env, query, { first }, { minimumCost: 120 });
  const account = data.shopifyPaymentsAccount || {};
  const payouts = (account.payouts?.nodes || []).map((payout) => ({
    id: payout.id,
    issuedAt: payout.issuedAt,
    status: payout.status,
    transactionType: payout.transactionType,
    net: roundMoney(payout.net?.amount),
    currencyCode: payout.net?.currencyCode || null,
  }));
  const balanceTransactions = (account.balanceTransactions?.nodes || []).map((transaction) => ({
    id: transaction.id,
    type: transaction.type,
    test: transaction.test,
    sourceType: transaction.sourceType,
    adjustmentReason: transaction.adjustmentReason,
    amount: roundMoney(transaction.amount?.amount),
    currencyCode: transaction.amount?.currencyCode || null,
    fee: roundMoney(transaction.fee?.amount),
    net: roundMoney(transaction.net?.amount),
    associatedPayoutStatus: transaction.associatedPayout?.status || null,
    associatedOrderName: transaction.associatedOrder?.name || null,
  }));
  const currencyCode = payouts.find((payout) => payout.currencyCode)?.currencyCode ||
    account.balance?.currencyCode ||
    balanceTransactions.find((transaction) => transaction.currencyCode)?.currencyCode ||
    null;

  return {
    currentBalance: account.balance ? roundMoney(account.balance.amount) : null,
    balanceCurrencyCode: account.balance?.currencyCode || null,
    payoutsShown: payouts.length,
    scheduledPayoutValue: sumMoney(
      payouts.filter((payout) => payout.status === 'SCHEDULED' || payout.status === 'IN_TRANSIT'),
      (payout) => payout.net,
    ),
    paidPayoutValue: sumMoney(
      payouts.filter((payout) => payout.status === 'PAID'),
      (payout) => payout.net,
    ),
    currencyCode,
    payouts,
    balanceTransactions,
  };
}

function buildFunnelAnalytics(revenueMetrics, checkoutAnalytics) {
  const paidOrders = Number(revenueMetrics?.paidOrdersCount || 0);
  const abandonedCheckouts = Number(
    checkoutAnalytics?.openCount ?? checkoutAnalytics?.totalShown ?? 0,
  );
  const denominator = paidOrders + abandonedCheckouts;

  return {
    paidOrders,
    abandonedCheckouts,
    checkoutRecoveryProxyRate: denominator ? Number(((paidOrders / denominator) * 100).toFixed(2)) : null,
    note: 'This is order and abandoned-checkout based, not a sessions conversion rate.',
  };
}

async function fetchAdminAnalytics(env, options = {}) {
  const customersFirst = Math.min(Math.max(Number(options.customersFirst) || 25, 1), 50);
  const checkoutsFirst = Math.min(Math.max(Number(options.checkoutsFirst) || 25, 1), 50);
  const paymentsFirst = Math.min(Math.max(Number(options.paymentsFirst) || 10, 1), 25);
  const revenueMetrics = options.revenueMetrics || null;

  const [customers, checkouts, payments] = await Promise.all([
    optionalSection('customers', () => fetchCustomerAnalytics(env, customersFirst)),
    optionalSection('checkouts', () => fetchCheckoutAnalytics(env, checkoutsFirst)),
    optionalSection('payments', () => fetchPaymentAnalytics(env, paymentsFirst)),
  ]);

  const checkoutData = checkouts.ok ? checkouts.data : emptyCheckoutAnalytics();
  const funnelData = buildFunnelAnalytics(revenueMetrics, checkoutData);
  const issues = [customers, checkouts, payments]
    .filter((section) => !section.ok)
    .map((section) => ({
      section: section.section,
      error: section.error,
    }));

  return {
    generatedAt: new Date().toISOString(),
    customers: customers.ok ? customers : { ...customers, data: emptyCustomerAnalytics() },
    checkouts: checkouts.ok ? checkouts : { ...checkouts, data: emptyCheckoutAnalytics() },
    payments: payments.ok ? payments : { ...payments, data: emptyPaymentAnalytics() },
    funnel: {
      ok: checkouts.ok && Boolean(revenueMetrics),
      section: 'funnel',
      error: checkouts.ok ? null : 'Abandoned checkout data unavailable.',
      data: funnelData,
    },
    issues,
  };
}

module.exports = {
  buildPendingAnalytics,
  emptyCheckoutAnalytics,
  emptyCustomerAnalytics,
  emptyFunnelAnalytics,
  emptyPaymentAnalytics,
  fetchAdminAnalytics,
  fetchCheckoutAnalytics,
  fetchCustomerAnalytics,
  fetchPaymentAnalytics,
};
