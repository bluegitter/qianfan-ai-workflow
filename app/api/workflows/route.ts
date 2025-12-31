import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import YAML from "js-yaml";
import { getWorkflowsCollection, serializeWorkflow } from "@/lib/mongodb";

type UploadResult = {
  files: Array<{ path: string; content: string; id?: string; artifact_id?: string; name?: string; desc?: string }>;
  entryPath: string;
  nameFromPath: string;
  appNameFromYaml: string | null;
};

const YAML_EXT = /\.ya?ml$/i;

function normalizePath(value: string) {
  return value.replace(/^\.?\/+/, "");
}

function deriveName(entryPath: string, fallback: string) {
  const clean = normalizePath(entryPath || fallback);
  const segments = clean.split("/").filter(Boolean);
  const last = segments.at(-1) || fallback;
  const parent = segments.length > 1 ? segments.at(-2) : undefined;
  const base = (parent || last).replace(YAML_EXT, "");
  return base || "未命名工作流";
}

function extractAppNameFromYaml(yamlContent: string): string | null {
  try {
    const parsed = YAML.load(yamlContent) as any;
    return parsed?.app_name || null;
  } catch (error) {
    console.warn("[workflows] Failed to parse YAML for app_name:", error);
    return null;
  }
}

async function parseYamlFile(file: File): Promise<UploadResult> {
  const content = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  const path = file.name || "workflow.yaml";

  // 解析YAML内容，提取工作流元数据
  let id: string | undefined;
  let artifact_id: string | undefined;
  let name: string | undefined;
  let desc: string | undefined;
  
  try {
    const parsed = YAML.load(content) as any;
    id = parsed?.id || parsed?.workflow_id;
    artifact_id = parsed?.artifact_id || parsed?.rev?.current?.artifact_id || parsed?.rev?.latest?.artifact_id;
    name = parsed?.name;
    desc = parsed?.desc;
  } catch (error) {
    console.warn(`[workflows] 解析YAML元数据失败: ${path}`, error);
  }

  return {
    files: [{ path, content, id, artifact_id, name, desc }],
    entryPath: path,
    nameFromPath: deriveName(path, path),
    appNameFromYaml: extractAppNameFromYaml(content),
  };
}

async function parseZipFile(file: File): Promise<UploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = await JSZip.loadAsync(buffer);

  const entries: Array<{ path: string; content: string; id?: string; artifact_id?: string; name?: string; desc?: string }> = [];

  for (const zipEntry of Object.values(zip.files)) {
    if (zipEntry.dir) continue;
    if (!YAML_EXT.test(zipEntry.name)) continue;

    const content = await zipEntry.async("string");
    const path = normalizePath(zipEntry.name);
    
    // 解析YAML内容，提取工作流元数据
    let id: string | undefined;
    let artifact_id: string | undefined;
    let name: string | undefined;
    let desc: string | undefined;
    
    try {
      const parsed = YAML.load(content) as any;
      id = parsed?.id || parsed?.workflow_id;
      artifact_id = parsed?.artifact_id || parsed?.rev?.current?.artifact_id || parsed?.rev?.latest?.artifact_id;
      name = parsed?.name;
      desc = parsed?.desc;
    } catch (error) {
      console.warn(`[workflows] 解析YAML元数据失败: ${path}`, error);
    }
    
    entries.push({ path, content, id, artifact_id, name, desc });
  }

  if (entries.length === 0) {
    throw new Error("压缩包中未找到 YAML 文件");
  }

  const entryPath =
    entries.find((item) => item.path.endsWith("app.yaml"))?.path ||
    entries[0].path;

  // 尝试从 app.yaml 或入口文件中提取 app_name
  const entryFile = entries.find((item) => item.path === entryPath);
  const appNameFromYaml = entryFile ? extractAppNameFromYaml(entryFile.content) : null;

  return {
    files: entries,
    entryPath,
    nameFromPath: deriveName(entryPath, file.name),
    appNameFromYaml,
  };
}

export async function GET() {
  try {
    const collection = await getWorkflowsCollection();
    const docs = await collection
      .find(
        {},
        {
          projection: {
            name: 1,
            entryPath: 1,
            createdAt: 1,
            updatedAt: 1,
            "files.path": 1,
          },
        },
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const items = docs.map((doc) => ({
      ...serializeWorkflow(doc as any),
      fileCount: (doc.files || []).length,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[workflows][GET] list error", error);
    return NextResponse.json(
      { error: "无法获取工作流列表" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "请上传 YAML 文件或 ZIP 压缩包" },
        { status: 400 },
      );
    }

    const isZip = /\.zip$/i.test(file.name);
    const parseResult = isZip
      ? await parseZipFile(file)
      : await parseYamlFile(file);

    const nameInput = formData.get("name");
    const workflowName =
      (typeof nameInput === "string" ? nameInput.trim() : "") ||
      parseResult.appNameFromYaml ||
      parseResult.nameFromPath;

    console.log(`[workflows] 工作流名称解析: input="${nameInput}", app_name="${parseResult.appNameFromYaml}", fallback="${parseResult.nameFromPath}", final="${workflowName}"`);

    const now = new Date();
    const doc = {
      name: workflowName,
      entryPath: parseResult.entryPath,
      files: parseResult.files,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getWorkflowsCollection();
    const result = await collection.insertOne(doc);

    return NextResponse.json({
      id: result.insertedId.toString(),
      name: workflowName,
      entryPath: parseResult.entryPath,
      fileCount: parseResult.files.length,
    });
  } catch (error) {
    console.error("[workflows][POST] upload error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 },
    );
  }
}
