/*
 * Supabase Client Configuration
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  FOLLOW-UP: Replace the two placeholders below with     │
 * │  your Supabase project URL and anon key.                │
 * └─────────────────────────────────────────────────────────┘
 *
 * Table creation SQL — run this in Supabase SQL Editor:
 *
 *   CREATE TABLE logged_services (
 *     id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     number      text NOT NULL UNIQUE,
 *     customer_id text NOT NULL,
 *     created_on  timestamptz DEFAULT now() NOT NULL,
 *     redemption  text
 *   );
 *
 *   CREATE TABLE loyalty_redemptions (
 *     id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     number       text NOT NULL UNIQUE,
 *     created_on   timestamptz DEFAULT now() NOT NULL,
 *     triggered_by text NOT NULL
 *   );
 *
 *   CREATE INDEX idx_ls_customer ON logged_services(customer_id);
 *   CREATE INDEX idx_ls_redemption ON logged_services(redemption);
 *   CREATE INDEX idx_lr_triggered ON loyalty_redemptions(triggered_by);
 *
 *   ALTER TABLE logged_services ENABLE ROW LEVEL SECURITY;
 *   ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
 *
 *   CREATE POLICY "Authenticated full access" ON logged_services
 *     FOR ALL USING (auth.role() = 'authenticated');
 *
 *   CREATE POLICY "Authenticated full access" ON loyalty_redemptions
 *     FOR ALL USING (auth.role() = 'authenticated');
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://dshdhogmarlrsowctzae.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzaGRob2dtYXJscnNvd2N0emFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjM4MzEsImV4cCI6MjA5MDg5OTgzMX0.W_CJ7HjhLJG3jUzfdje4C6SCn1r9bUZGmFMZ2gUxsC0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
