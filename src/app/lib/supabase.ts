import { createClient } from '@supabase/supabase-js';

// 1. 아까 .env.local에 숨겨둔 주소와 열쇠를 꺼내옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 2. 이 열쇠를 가진 전용 배달원(supabase)을 생성해서 밖으로 내보냅니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);