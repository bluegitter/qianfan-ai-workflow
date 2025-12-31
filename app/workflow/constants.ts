import type { MarkerType } from "reactflow";

// export const DEFAULT_WORKFLOW_FILE = "flow-examples/意图识别/app.yaml";
// export const DEFAULT_WORKFLOW_FILE = "flow-examples/意图识别.yaml";
export const DEFAULT_WORKFLOW_FILE = "flow-examples/单配变停运抢修方案/app.yaml"

export const EDGE_MARKER_CONFIG = {
  type: "arrow" as MarkerType.ArrowClosed,
  color: "#6b7280",
  width: 18,
  height: 18,
};

export const LAYOUT_SPACING = {
  X: 420,
  Y: 260,
};

export const NODE_DIMENSIONS = {
  DEFAULT_WIDTH: 320,
  DEFAULT_HEIGHT: 160,
};

export const API_BASE_URL = "/api/workflow-example";

export const NODE_TYPE_COLORS = {
  LL: "bg-indigo-600",
  AGENT: "bg-indigo-600",
  COMPONENT: "bg-teal-500",
  API: "bg-teal-500",
  INTENTION: "bg-orange-500",
  BRANCH: "bg-orange-500",
  LOOP: "bg-orange-500",
  CODE: "bg-orange-500",
  CHAT: "bg-pink-500",
  MESSAGE: "bg-pink-500",
} as const;

export const NODE_TYPE_LABELS = {
  llm: "大模型",
  agent: "智能体",
  component: "组件",
  api: "API",
  intention: "意图识别",
  branch: "分支器",
  loop: "循环",
  code: "代码",
  chat: "信息收集",
  message: "消息节点",
} as const;

export const START_NODE_DEFAULT_INPUTS = [
  { name: "rawQuery", type: "String" },
  { name: "chatHistory", type: "String" },
  { name: "fileUrls", type: "Array<String>" },
  { name: "fileNames", type: "Array<String>" },
  { name: "end_user_id", type: "String" },
  { name: "conversation_id", type: "String" },
  { name: "request_id", type: "String" },
  { name: "fileIds", type: "Array<String>" },
] as const;

export const START_NODE_SYSTEM_PARAMS = [
  { name: "rawQuery", type: "String", desc: "用户输入的原始内容" },
  { name: "chatHistory", type: "String", desc: "用户与应用的对话历史（轮数受限）" },
  { name: "fileUrls", type: "Array<String>", desc: "用户在应用对话中上传的文件链接" },
  { name: "fileNames", type: "Array<String>", desc: "用户在对话中上传的文件名" },
  { name: "end_user_id", type: "String", desc: "终端用户的唯一 id，应用调用时传入" },
  { name: "conversation_id", type: "String", desc: "会话 id，是会话的唯一标识" },
  { name: "request_id", type: "String", desc: "本次请求的 id，便于记录与调试" },
  { name: "fileIds", type: "Array<String>", desc: "用户在对话中上传的文件 id" },
] as const;
