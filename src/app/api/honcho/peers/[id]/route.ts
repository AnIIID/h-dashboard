import { NextRequest, NextResponse } from "next/server";
import { getPeerCard, getPeerRepresentation, getPeerConclusions } from "@/lib/honcho";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [card, representation, conclusions] = await Promise.all([
      getPeerCard(id).catch(() => null),
      getPeerRepresentation(id).catch(() => null),
      getPeerConclusions(id).catch(() => []),
    ]);
    return NextResponse.json({ id, card, representation, conclusions });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
