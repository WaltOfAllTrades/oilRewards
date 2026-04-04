import { supabase } from '../config/supabase.js';

export async function create(triggeredByNumber) {
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .insert({ triggered_by: triggeredByNumber })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getByNumber(number) {
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .select('*')
    .eq('number', number)
    .single();
  if (error) throw error;
  return data;
}

export async function getByNumbers(numbers) {
  if (numbers.length === 0) return [];
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .select('*')
    .in('number', numbers);
  if (error) throw error;
  return data;
}

export async function deleteAll() {
  const { error } = await supabase
    .from('loyalty_redemptions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
