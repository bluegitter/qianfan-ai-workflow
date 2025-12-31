import type { Node, Edge, MarkerType } from "reactflow";
import YAML from "js-yaml";
import type { 
  WorkflowSchema, 
  WorkflowNode, 
  WorkflowEdge, 
  RawNodeData,
  ValueConfig,
  NodeType
} from "./types";
import { 
  EDGE_MARKER_CONFIG, 
  NODE_DIMENSIONS, 
  START_NODE_DEFAULT_INPUTS,
  START_NODE_SYSTEM_PARAMS
} from "./constants";

declare global {
  var nodeNameMap: Record<string, string>;
}

globalThis.nodeNameMap = globalThis.nodeNameMap || {};

export function formatValue(value: ValueConfig | undefined): string {
  if (!value) return "";
  
  if (value.type === "literal") {
    return Array.isArray(value.content)
      ? JSON.stringify(value.content)
      : String(value.content);
  }
  
  if (value.type === "ref") {
    const refNode = value.content?.ref_node_id ?? "ref";
    const refVar = value.content?.ref_var_name ?? "";
    const refName = globalThis.nodeNameMap[refNode] || refNode;
    return `${refName}/${refVar}`;
  }
  
  return value.type ? String(value.type) : "";
}

export function toNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function toReactFlowNodes(nodes: unknown[] = []): WorkflowNode[] {
  return nodes.map((node) => {
    const rawNode = node as RawNodeData;
    const ui = rawNode?.meta?.uiState ?? {};
    const width = toNumber(ui.width, NODE_DIMENSIONS.DEFAULT_WIDTH);
    const height = toNumber(ui.height, NODE_DIMENSIONS.DEFAULT_HEIGHT);
    const posX = toNumber(ui.x, 0);
    const posY = toNumber(ui.y, 0);

    const nodeType = rawNode?.type;
    const isApi = nodeType === "service_http" || nodeType === "api";
    
    let description: string | undefined;
    if (isApi) {
      description = rawNode?.data?.settings?.url ?? rawNode?.data?.settings?.http_method;
    } else if (nodeType === "llm") {
      description = rawNode?.data?.settings?.model_name ?? "LLM";
    } else if (nodeType === "code") {
      description = "代码节点";
    } else if (nodeType === "workflow") {
      description = "子流程引用";
    } else if (nodeType === "end") {
      description = "返回结果节点";
    }

    return {
      id: rawNode.id ?? "",
      type: "qfNode",
      position: { x: posX, y: posY },
      data: {
        title: rawNode.name ?? "节点",
        subtitle: nodeType ?? "unknown",
        description,
        raw: rawNode,
      },
      style: { width, height },
    };
  });
}

export function toReactFlowEdges(edges: unknown[] = []): WorkflowEdge[] {
  return edges.map((edge, index) => {
    const edgeData = edge as { 
      id?: string; 
      source_node_id?: string; 
      target_node_id?: string;
      meta?: {
        source_handle_id?: string;
        target_handle_id?: string;
        source_port_id?: string | number;
      };
    };

    const meta = edgeData.meta || {};
    const sourceHandle =
      meta.source_handle_id
        ? `intention-${meta.source_handle_id}`
        : meta.source_port_id !== undefined
          ? `intention-${meta.source_port_id}`
          : "output";
    const targetHandle = meta.target_handle_id ?? "input";
    
    return {
      id: edgeData.id ?? `${edgeData.source_node_id}-${edgeData.target_node_id}-${index}`,
      source: edgeData.source_node_id ?? "",
      target: edgeData.target_node_id ?? "",
      sourceHandle,
      targetHandle,
      animated: false,
      type: "arrowBezier",
      markerEnd: EDGE_MARKER_CONFIG,
    };
  });
}

type LoadOptions =
  | string
  | {
      apiUrl?: string;
      workflowId?: string | null;
    };

export async function loadWorkflowSchema(
  filePath: string,
  options: LoadOptions = "/api/workflow-example",
): Promise<{ schema: WorkflowSchema; nodeNameMap: Record<string, string> }> {
  const { apiUrl, workflowId } =
    typeof options === "string"
      ? { apiUrl: options, workflowId: undefined }
      : options || {};

  const search = new URLSearchParams({ file: filePath });
  if (workflowId) {
    search.set("workflowId", workflowId);
  }

  const response = await fetch(
    `${apiUrl ?? "/api/workflow-example"}?${search.toString()}`,
  );
  
  if (!response.ok) {
    throw new Error(`请求失败：${response.statusText}`);
  }
  
  const payload = await response.json();
  const content = payload?.content;
  
  if (!content) {
    throw new Error("未获取到示例 YAML 内容");
  }
  
  const parsed = YAML.load(content) as any;
  const extractSchema = (doc: any) =>
    doc?.workflow_detail?.workflow_schema || doc?.workflow_schema;
  let schema: WorkflowSchema | undefined = extractSchema(parsed);

  if (!schema && parsed?.workflow_id) {
    // 检查是否已经是在加载组件文件，避免递归
    if (filePath.includes("/component/")) {
      console.log(`[工作流加载] 检测到组件文件，跳过递归加载: ${filePath}`);
      // 对于组件文件，我们不应该尝试加载子组件
    } else {
      const pathParts = filePath.split("/");
      let baseDir = pathParts.slice(0, -1).join("/");
      
      if (!baseDir || baseDir === "") {
        baseDir = ".";
      }
      
      const parsedWorkflowId = parsed.workflow_id;
      const artifactId =
        parsed?.artifact_id ||
        parsed?.rev?.latest?.artifact_id ||
        parsed?.rev?.current?.artifact_id;

      console.log(`[工作流加载] 原始文件路径: ${filePath}`);
      console.log(`[工作流加载] 路径分割: ${JSON.stringify(pathParts)}`);
      console.log(`[工作流加载] 计算的基础目录: "${baseDir}"`);
      console.log(`[工作流加载] 工作流ID: ${parsedWorkflowId}`);
      console.log(`[工作流加载] 制品ID: ${artifactId}`);
      console.log(`[工作流加载] 当前workflowId参数: ${workflowId || '无'}`);

      const candidateFiles = [
        artifactId ? `${parsedWorkflowId}--${artifactId}.yaml` : null,
        `${parsedWorkflowId}.yaml`,
      ].filter(Boolean) as string[];

      for (const fileName of candidateFiles) {
        const componentPath = baseDir === "." 
          ? `component/${fileName}`
          : `${baseDir}/component/${fileName}`;
        
        // 如果当前有workflowId参数，说明是从MongoDB加载，需要继续使用workflowId
        // 否则使用文件系统路径
        const compSearch = new URLSearchParams({ file: componentPath });
        if (workflowId) {
          compSearch.set("workflowId", workflowId);
        }
        
        console.log(`[工作流加载] 尝试加载组件文件: ${componentPath}`);
        console.log(`[工作流加载] baseDir值: "${baseDir}", 是否为当前目录: ${baseDir === "."}`);
        console.log(`[工作流加载] 是否使用MongoDB: ${!!workflowId}`);
        
        const compResponse = await fetch(
          `${apiUrl ?? "/api/workflow-example"}?${compSearch.toString()}`,
        );

        if (!compResponse.ok) {
          console.warn(`组件文件加载失败: ${componentPath}, 状态: ${compResponse.status}`);
          continue;
        }

        const compPayload = await compResponse.json();
        const compContent = compPayload?.content;
        console.log(`[工作流加载] 组件文件内容长度: ${compContent?.length || 0}`);
        
        const compParsed = compContent ? (YAML.load(compContent) as any) : null;
        schema = compParsed ? extractSchema(compParsed) : undefined;
        console.log(`[工作流加载] 提取的schema: ${schema ? '成功' : '失败'}`);
        
        if (schema) break;
      }

      if (!schema) {
        const tried = candidateFiles.map(f => `${baseDir}/component/${f}`).join("，");
        throw new Error(`组件文件加载失败，尝试路径：${tried}`);
      }
    }
  }

  if (!schema) {
    throw new Error("YAML 中缺少 workflow_schema");
  }

  const nodeNameMap: Record<string, string> = {};
  (schema.nodes || []).forEach((n: any) => {
    if (n?.id) nodeNameMap[n.id] = n.name || n.id;
  });

  return { schema, nodeNameMap };
}

export function getStartNodeInputs(raw: unknown): Array<{ name: string; type: string }> {
  const rawData = raw as RawNodeData;
  const inputs = rawData?.data?.inputs;
  
  return inputs?.length 
    ? inputs.map((item) => ({
        name: item?.name ?? "-",
        type: item?.type ?? "unknown",
      }))
    : [...START_NODE_DEFAULT_INPUTS];
}

export function getStartNodeSystemParams(raw: unknown): Array<{ name: string; type: string; desc: string }> {
  const rawData = raw as RawNodeData;
  const inputs = rawData?.data?.inputs;
  
  return inputs?.length > 0
    ? inputs.map((item) => ({
        name: item?.name ?? "-",
        type: item?.type ?? "",
        desc: item?.desc ?? "",
      }))
    : [...START_NODE_SYSTEM_PARAMS];
}

export function getNodeType(raw: unknown): NodeType | undefined {
  const rawData = raw as RawNodeData;
  return rawData?.type;
}

export function isNodeType(raw: unknown, ...types: NodeType[]): boolean {
  const nodeType = getNodeType(raw);
  return types.some(type => nodeType === type);
}
