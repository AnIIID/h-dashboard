import { NextResponse } from "next/server";
import { listPeers } from "@/lib/honcho";

export async function GET() {
  try {
    const data = await listPeers();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
