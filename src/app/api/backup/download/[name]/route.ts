import path from "path";
import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBackupSqlPath } from "@/lib/backup";

type RouteProps = {
  params: Promise<{
    name: string;
  }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  await requireUser();

  const { name } = await params;
  const filePath = await getBackupSqlPath(name);
  const fileBuffer = await readFile(filePath);
  const filename = path.basename(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}