import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileParam =
      searchParams.get("file") ??
      path.join("flow-examples", "知识库问答工作流.yaml");

    const filePath = path.join(process.cwd(), fileParam);
    const content = await fs.readFile(filePath, "utf-8");

    return NextResponse.json({ content, file: fileParam });
  } catch (error) {
    console.error("[workflow-example] read error", error);
    return NextResponse.json(
      { error: "Unable to read workflow example file" },
      { status: 500 },
    );
  }
}
