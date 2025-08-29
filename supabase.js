import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://sdzwzndtfjvtvjlokbcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkend6bmR0Zmp2dHZqbG9rYmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDc3MDEsImV4cCI6MjA3MjA4MzcwMX0.u_tbEPlGYARHq60ijLD74NuONJVHcY-FNH0A69Xn06I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
