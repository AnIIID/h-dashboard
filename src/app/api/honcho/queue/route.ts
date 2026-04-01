import { NextResponse } from "next/server";
import { getQueueStatus } from "@/lib/honcho";

export async function GET() {
  try {
    const data = await getQueueStatus();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
