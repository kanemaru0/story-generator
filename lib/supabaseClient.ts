import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvqhgdrqymqsdlwndyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2cXZoZ2RyY3ltcXNkbHduZHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MDM2NzksImV4cCI6MjA2NzA3OTY3OX0.Vq2WOdcVuaisPOpzw09HPn3uFa3e42AM41lhCNpYBpU';

export const supabase = createClient(supabaseUrl, supabaseKey);
