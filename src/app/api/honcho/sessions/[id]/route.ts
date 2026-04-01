import { NextRequest, NextResponse } from "next/server";
import { getSessionMessages } from "@/lib/honcho";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const messages = await getSessionMessages(id);
    return NextResponse.json({ id, messages });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
