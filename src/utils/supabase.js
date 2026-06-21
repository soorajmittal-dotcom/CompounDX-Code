import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wedcbyxokedmsksjqwpq.supabase.co';
const supabaseKey = 'sb_publishable_VmjIMAwXspkble7Cl0gjuQ_gKR1PZFk';

export const supabase = createClient(supabaseUrl, supabaseKey);
