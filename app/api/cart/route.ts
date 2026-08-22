import { NextResponse, type NextRequest } from "next/server";

import { getProductsByIds } from "@/lib/catalog/queries";
import { cartLookupSchema } from "@/lib/validation/cart";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = cartLookupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const products = await getProductsByIds(parsed.data.productIds);

  return NextResponse.json({ products });
}
