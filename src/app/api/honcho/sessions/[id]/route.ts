import { NextRequest, NextResponse } from "next/server";
import { getSessionMessages, getSessionPeers } from "@/lib/honcho";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [messages, peers] = await Promise.all([
      getSessionMessages(id),
      getSessionPeers(id),
    ]);
    return NextResponse.json({ id, messages, peers });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
