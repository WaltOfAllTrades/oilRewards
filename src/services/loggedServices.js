import { supabase } from '../config/supabase.js';

function generateNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'LS';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function create(customerId) {
  const number = generateNumber();
  const { data, error } = await supabase
    .from('logged_services')
    .insert({ number, customer_id: customerId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getByCustomer(customerId) {
  const { data, error } = await supabase
    .from('logged_services')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_on', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getUnredeemedByCustomer(customerId) {
  const { data, error } = await supabase
    .from('logged_services')
    .select('*')
    .eq('customer_id', customerId)
    .is('redemption', null)
    .order('created_on', { ascending: true });
  if (error) throw error;
  return data;
}

export async function markRedeemed(ids, redemptionNumber) {
  const { data, error } = await supabase
    .from('logged_services')
    .update({ redemption: redemptionNumber })
    .in('id', ids)
    .select();
  if (error) throw error;
  return data;
}

export async function deleteAll() {
  const { error } = await supabase
    .from('logged_services')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
