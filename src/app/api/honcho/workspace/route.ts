import { NextResponse } from "next/server";
import { listWorkspaces } from "@/lib/honcho";

export async function GET() {
  try {
    const data = await listWorkspaces();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
