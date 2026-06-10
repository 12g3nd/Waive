import { NextResponse } from "next/server";
import { buildNoticeTypes } from "@/lib/notice-types";

export const runtime = "nodejs";

/**
 * The notice types (and their jurisdictions) for the upload picker, so the person
 * can say what kind of notice they have instead of the app assuming one.
 */
export async function GET() {
  return NextResponse.json({ noticeTypes: buildNoticeTypes() });
}
