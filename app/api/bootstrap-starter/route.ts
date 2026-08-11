import { NextResponse } from "next/server";
import { bootstrapRealStores } from "@/lib/bootstrap-real-stores";
import { isSupabaseConfigured, supabaseRest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { message: "Supabase is not configured in this deployment." },
      { status: 500 }
    );
  }

  try {
    const existing = await supabaseRest<Array<{ id: string }>>(
      "stores?select=id&limit=1"
    );

    if (existing.length > 0) {
      return NextResponse.json({ alreadySeeded: true, importedStores: 0, importedProducts: 0 });
    }

    const result = await bootstrapRealStores(3);

    if (result.stores === 0) {
      return NextResponse.json({
        importedStores: 0,
        importedProducts: 0,
        errors: result.errors,
        message: "No starter stores passed verification yet. Check Vercel function logs for the bootstrap request.",
      });
    }

    return NextResponse.json({
      importedStores: result.stores,
      importedProducts: result.products,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Starter bootstrap failed",
      },
      { status: 500 }
    );
  }
}
