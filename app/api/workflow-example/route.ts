import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getWorkflowsCollection, isValidObjectId, toObjectId } from "@/lib/mongodb";

function normalizePath(value: string) {
  return value.replace(/^\.?\/+/, "");
}

async function readFromDatabase(workflowId: string, file: string) {
  if (!isValidObjectId(workflowId)) {
    return NextResponse.json(
      { error: "无效的工作流 ID" },
      { status: 400 },
    );
  }

  const collection = await getWorkflowsCollection();
  const doc = await collection.findOne(
    { _id: toObjectId(workflowId) },
    { projection: { files: 1 } },
  );

  if (!doc || !doc.files) {
    return NextResponse.json(
      { error: "未找到对应的工作流" },
      { status: 404 },
    );
  }

  console.log(`[MongoDB] 查找文件: ${file}`);
  console.log(`[MongoDB] 数据库中的文件数量: ${doc.files.length}`);
  console.log(`[MongoDB] 数据库中的文件路径:`, doc.files.map((f: any) => ({ path: f.path, id: f.id, artifact_id: f.artifact_id, name: f.name })));

  const normalized = normalizePath(file);
  
  // 首先尝试通过ID直接查找（这是新的查找方式）
  const matchedById = doc.files.find((item: any) => item.id === normalized || item.artifact_id === normalized);
  if (matchedById) {
    console.log(`[MongoDB] 通过ID找到匹配文件: ${matchedById.path}`);
    return NextResponse.json({
      content: matchedById.content,
      file: matchedById.path,
      workflowId,
    });
  }
  
  // 然后尝试传统的路径匹配方式
  const matched =
    doc.files.find((item: any) => normalizePath(item.path) === normalized) ||
    doc.files.find((item: any) => normalizePath(item.path).endsWith(`/${normalized}`)) ||
    (() => {
      const basename = normalized.split("/").pop();
      if (!basename) return undefined;
      return doc.files.find((item: any) =>
        normalizePath(item.path).split("/").pop() === basename,
      );
    })();

  if (!matched) {
    console.log(`[MongoDB] 未找到文件: ${file}`);
    return NextResponse.json(
      { error: "未找到指定的文件内容" },
      { status: 404 },
    );
  }

  console.log(`[MongoDB] 找到匹配文件: ${matched.path}`);
  return NextResponse.json({
    content: matched.content,
    file: matched.path,
    workflowId,
  });
}

async function readFromFilesystem(file: string) {
  const filePath = path.join(process.cwd(), file);
  console.log(`[API] 读取文件系统文件: ${file}`);
  console.log(`[API] 构建的完整路径: ${filePath}`);
  
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return NextResponse.json({ content, file });
  } catch (error) {
    console.error(`[API] 文件读取失败: ${filePath}`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const fileParam =
      searchParams.get("file") ??
      path.join("flow-examples", "知识库问答工作流.yaml");

    console.log(`[API] 接收到请求 - workflowId: ${workflowId}, file: ${fileParam}`);

    if (workflowId) {
      return await readFromDatabase(workflowId, fileParam);
    }

    return await readFromFilesystem(fileParam);
  } catch (error) {
    console.error("[workflow-example] read error", error);
    return NextResponse.json(
      { error: "Unable to read workflow example file" },
      { status: 500 },
    );
  }
}
