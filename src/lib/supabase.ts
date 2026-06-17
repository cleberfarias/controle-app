import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const ROW_ID = 'default';

export async function loadFromCloud(): Promise<any | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('finance_data')
    .select('data')
    .eq('id', ROW_ID)
    .single();

  if (error || !data) return null;
  return data.data;
}

export async function saveToCloud(state: any): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('finance_data')
    .upsert({
      id: ROW_ID,
      data: state,
      updated_at: new Date().toISOString(),
    });
}
