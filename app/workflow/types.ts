import type { Node, Edge } from "reactflow";

export type WorkflowSchema = {
  nodes?: unknown[];
  edges?: unknown[];
};

export type QfNodeData = {
  title: string;
  subtitle: string;
  description?: string;
  raw: unknown;
};

export type WorkflowNode = Node<QfNodeData>;
export type WorkflowEdge = Edge;

export type NodeType = 
  | "start"
  | "end" 
  | "service_http"
  | "api"
  | "llm"
  | "agent"
  | "intention"
  | "chat"
  | "message"
  | "code"
  | "loop"
  | "branch"
  | "switch"
  | "workflow"
  | "component"
  | "mcp"
  | "jump"
  | "jump_out"
  | "knowledge"
  | "database"
  | "memory"
  | "text"
  | "stream";

export type NodeInput = {
  name?: string;
  type?: string;
  value?: ValueConfig;
  required?: boolean;
  desc?: string;
};

export type NodeOutput = {
  name?: string;
  type?: string;
  object_schema?: unknown;
  list_schema?: unknown;
};

export type ValueConfig = {
  type?: "literal" | "ref";
  content?: {
    ref_node_id?: string;
    ref_var_name?: string;
  } | unknown;
};

export type NodeSettings = {
  url?: string;
  http_method?: string;
  model_name?: string;
  model?: {
    model_name?: string;
    chat_history?: boolean;
  };
  prompt?: string;
  question_template?: string;
  message_template?: string;
  code?: string;
  content?: string;
  streaming?: boolean;
  loop_type?: "array" | "condition";
  intentions?: IntentionConfig[];
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  component?: string;
};

export type IntentionConfig = {
  meta?: { id?: string };
  name?: string;
  desc?: string;
  global_selected?: boolean;
};

export type RawNodeData = {
  type?: NodeType;
  name?: string;
  data?: {
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
    settings?: NodeSettings;
  };
  meta?: {
    uiState?: {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
    };
  };
  id?: string;
  component?: string;
  workflow_id?: string;
};

export type SectionState = Record<string, boolean>;
