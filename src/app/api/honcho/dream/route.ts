import { NextRequest, NextResponse } from "next/server";
import { scheduleDream } from "@/lib/honcho";

export async function POST(req: NextRequest) {
  try {
    const { peerId, workspaceId, sessionId, targetPeerId } = await req.json();

    if (!peerId) {
      return NextResponse.json(
        { error: "peerId is required" },
        { status: 400 }
      );
    }

    const data = await scheduleDream(
      peerId,
      workspaceId,
      sessionId,
      targetPeerId
    );
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
