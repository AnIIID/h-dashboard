import { NextResponse } from "next/server";
import { listSessions } from "@/lib/honcho";

export async function GET() {
  try {
    const data = await listSessions();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
