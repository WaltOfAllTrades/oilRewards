/**
 * Unified data API — abstracts Supabase service calls behind a clean interface.
 * All feature code imports from here; no direct Supabase usage in features.
 */

import * as loggedServices from '../services/loggedServices.js';
import * as loyaltyRedemptions from '../services/loyaltyRedemptions.js';

/* ── Logged Services ──────────────────────────────────── */

export async function logService(customerId) {
  return loggedServices.create(customerId);
}

export async function getServices(customerId) {
  const rows = await loggedServices.getByCustomer(customerId);
  // Fetch all redemption numbers that triggered on this customer's services
  // to determine which service is the "redeemer" (triggered the free oil change)
  const redemptionNumbers = [...new Set(rows.map(r => r.redemption).filter(Boolean))];
  let redemptionMap = {};
  if (redemptionNumbers.length > 0) {
    const redemptions = await loyaltyRedemptions.getByNumbers(redemptionNumbers);
    for (const r of redemptions) {
      redemptionMap[r.number] = r;
    }
  }
  return rows.map(row => normalizeService(row, redemptionMap));
}

export async function getUnredeemedServices(customerId) {
  return loggedServices.getUnredeemedByCustomer(customerId);
}

/* ── Redemptions ──────────────────────────────────────── */

export async function redeemServices(customerId) {
  // unredeemed comes back sorted ascending (oldest first)
  const unredeemed = await loggedServices.getUnredeemedByCustomer(customerId);
  if (unredeemed.length < 10) return false;

  // Triggering service = the latest (newest) unredeemed
  const triggerService = unredeemed[unredeemed.length - 1];

  // The other 9 services = the 9 oldest unredeemed
  const oldest9 = unredeemed.slice(0, 9);

  const batch = [...oldest9, triggerService];

  // Create the redemption record
  const redemption = await loyaltyRedemptions.create(triggerService.number);

  // Mark all 10 services as redeemed
  const ids = batch.map(s => s.id);
  await loggedServices.markRedeemed(ids, redemption.number);

  return true;
}

/* ── Admin ────────────────────────────────────────────── */

export async function deleteAllServices() {
  await loyaltyRedemptions.deleteAll();
  await loggedServices.deleteAll();
}

/* ── Normalization ────────────────────────────────────── */

function normalizeService(row, redemptionMap) {
  const hasRedemption = !!row.redemption;
  const redemptionData = hasRedemption ? redemptionMap[row.redemption] : null;

  return {
    id: row.id,
    number: row.number,
    customer_id: row.customer_id,
    created_on: row.created_on,
    redemption: row.redemption,
    redemption_date: redemptionData?.created_on || null,
    is_redeemer: redemptionData?.triggered_by === row.number,
  };
}

