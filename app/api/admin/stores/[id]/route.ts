import { NextRequest, NextResponse } from 'next/server';
import { supabaseRest } from '../../../../../lib/supabase-rest';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const form = await request.formData();
  const action = String(form.get('action') || '');
  if (!['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  await supabaseRest(`stores?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: JSON.stringify({ status: action, updated_at: new Date().toISOString() }),
  });

  return NextResponse.redirect(new URL('/admin/discovery', request.url), 303);
}
