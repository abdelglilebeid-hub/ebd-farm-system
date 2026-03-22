'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.replace(user ? '/dashboard' : '/auth');
    });
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
