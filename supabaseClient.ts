// --- FILE: src/supabaseClient.ts ---
import { createClient } from '@supabase/supabase-js';

// 1. GET THIS FROM SUPABASE: Settings (Gear) -> API -> Project URL
// It looks like: https://abcdefghijklm.supabase.co
const SUPABASE_URL = 'https://txpguctgvjjxxkivigni.supabase.co'; 

// 2. THIS IS THE KEY FROM YOUR SCREENSHOT
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cGd1Y3RndmpqeHhraXZpZ25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjQ3NzMsImV4cCI6MjA4MDkwMDc3M30.HP7H153XAQP8RUVPtOhJXI0sJYZ0-IMNdYUzINR2vfg'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);