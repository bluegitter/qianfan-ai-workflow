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
    };
    
    return {
      id: edgeData.id ?? `${edgeData.source_node_id}-${edgeData.target_node_id}-${index}`,
      source: edgeData.source_node_id ?? "",
      target: edgeData.target_node_id ?? "",
      sourceHandle: "output",
      targetHandle: "input",
      animated: false,
      type: "arrowBezier",
      markerEnd: EDGE_MARKER_CONFIG,
    };
  });
}

export async function loadWorkflowSchema(
  filePath: string, 
  apiUrl: string = "/api/workflow-example"
): Promise<{ schema: WorkflowSchema; nodeNameMap: Record<string, string> }> {
  const fileParam = encodeURIComponent(filePath);
  const response = await fetch(`${apiUrl}?file=${fileParam}`);
  
  if (!response.ok) {
    throw new Error(`请求失败：${response.statusText}`);
  }
  
  const payload = await response.json();
  const content = payload?.content;
  
  if (!content) {
    throw new Error("未获取到示例 YAML 内容");
  }
  
  const parsed = YAML.load(content) as any;
  let schema: WorkflowSchema | undefined =
    parsed?.workflow_detail?.workflow_schema || parsed?.workflow_schema;

  if (!schema && parsed?.workflow_id) {
    const baseDir = filePath.split("/").slice(0, -1).join("/");
    const componentPath = `${baseDir}/component/${parsed.workflow_id}.yaml`;
    const compResponse = await fetch(
      `${apiUrl}?file=${encodeURIComponent(componentPath)}`
    );
    
    if (!compResponse.ok) {
      throw new Error(`组件文件加载失败：${componentPath}`);
    }
    
    const compPayload = await compResponse.json();
    const compContent = compPayload?.content;
    const compParsed = compContent ? (YAML.load(compContent) as any) : null;
    schema =
      compParsed?.workflow_schema ||
      compParsed?.workflow_detail?.workflow_schema;
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
