import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabaseClient';

type Payload = unknown;

export default function DebugTemplates() {
  const [payload, setPayload] = useState<Payload>(null);

  useEffect(() => {
    async function run() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('templates')
          .select('id,name,is_public')
          .limit(5);
        setPayload({ data, error });
      } catch (e: any) {
        setPayload({ error: { message: e?.message } });
      }
    }
    void run();
  }, []);

  return <pre>{JSON.stringify(payload, null, 2)}</pre>;
}
