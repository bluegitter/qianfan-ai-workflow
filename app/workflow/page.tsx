"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BaseEdge,
  BezierEdge,
  Controls,
  Edge,
  EdgeProps,
  MarkerType,
  Handle,
  MiniMap,
  Node,
  Position,
  ReactFlowProvider,
  NodeProps,
  ReactFlowInstance,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  EdgeChange,
  NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import YAML from "js-yaml";

let nodeNameMap: Record<string, string> = {};

type WorkflowSchema = {
  nodes?: any[];
  edges?: any[];
};

type QfNodeData = {
  title: string;
  subtitle: string;
  description?: string;
  raw: any;
};

function QfNode({ data, selected }: NodeProps<QfNodeData>) {
  const isStart = data.raw?.type === "start";
  const isApi =
    data.raw?.type === "service_http" || data.raw?.type === "api";
  const isLlm = data.raw?.type === "llm";
  const isEnd = data.raw?.type === "end";
  const isIntention = data.raw?.type === "intention";
  const isChat = data.raw?.type === "chat";
  const isMessage = data.raw?.type === "message";
  const isCode = data.raw?.type === "code";
  const isLoop = data.raw?.type === "loop";
  const isBranch = data.raw?.type === "branch" || data.raw?.type === "switch";
  const isWorkflow = data.raw?.type === "workflow";
  const startInputs: { name: string; type: string }[] =
    data.raw?.data?.inputs?.length
      ? data.raw.data.inputs.map((item: any) => ({
          name: item?.name ?? "-",
          type: item?.type ?? "unknown",
        }))
      : [
          { name: "rawQuery", type: "String" },
          { name: "chatHistory", type: "String" },
          { name: "fileUrls", type: "Array<String>" },
          { name: "fileNames", type: "Array<String>" },
          { name: "end_user_id", type: "String" },
          { name: "conversation_id", type: "String" },
          { name: "request_id", type: "String" },
          { name: "fileIds", type: "Array<String>" },
        ];

  const cardClass = selected
    ? "border-sky-300 shadow-md shadow-sky-50"
    : "border-slate-200";

  return (
    <div className={`rounded-lg border bg-white px-4 py-3 shadow-sm ${cardClass}`}>
      {!isStart ? <Handle id="input" type="target" position={Position.Left} /> : null}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            {renderNodeIcon(data.raw?.type)}
            <span>{data.title}</span>
            {isIntention ? (
              <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                极速
              </span>
            ) : null}
            {isLoop ? (
              <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                {data.raw?.data?.settings?.loop_type === "array" ? "数组循环" : "循环"}
              </span>
            ) : null}
            {isBranch ? (
              <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                条件分支
              </span>
            ) : null}
            {isWorkflow ? (
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                子流程
              </span>
            ) : null}
          </div>
          <div className="text-xs text-slate-500">{data.subtitle}</div>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-600">
          {data.raw?.type ?? "node"}
        </span>
      </div>
      {data.description ? (
        <p className="mt-2 text-xs leading-5 text-slate-600">
          {data.description}
        </p>
      ) : null}
      {isStart ? (
        <div className="mt-3 rounded-md bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-600">输入</div>
          <div className="mt-2 space-y-1">
            {startInputs.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 text-xs text-amber-700"
              >
                <span className="font-semibold">{item.name}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isApi ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输入</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.inputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="font-semibold">{item?.name ?? "-"}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item?.type ?? "unknown"}
                    </span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    {formatValue(item?.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.outputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="flex items-center gap-2 text-xs text-amber-700"
                >
                  <span className="font-semibold">{item?.name ?? "-"}</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item?.type ?? "unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isIntention ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输入</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.inputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-700">
                      {item?.name ?? "-"}{item?.required ? "*" : ""}
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item?.type ?? "unknown"}
                    </span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    {formatValue(item?.value) || "未选择"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">意图</div>
            <div className="mt-2 space-y-2">
              {(data.raw?.data?.settings?.intentions ?? []).map(
                (it: any, idx: number) => (
                  <div
                    key={it?.meta?.id ?? idx}
                    className="flex items-center justify-between rounded bg-white px-2 py-2 text-xs text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-slate-500">{idx}</span>
                      <span>{it?.name ?? "意图"}</span>
                    </span>
                    <span className="text-sky-600 font-semibold">+</span>
                  </div>
                ),
              )}
              <div className="flex items-center justify-between rounded bg-white px-2 py-2 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="text-slate-500">-1</span>
                  <span>其他意图</span>
                </span>
                <span className="text-sky-600 font-semibold">+</span>
              </div>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.outputs ?? []).map((item: any) => (
                <div key={item?.name} className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="font-semibold">{item?.name ?? "-"}</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item?.type ?? "unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isChat ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输入</div>
            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-700">
                <span className="font-semibold">
                  {data.raw?.data?.inputs?.[0]?.name || "未命名"}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {data.raw?.data?.inputs?.[0]?.type || "String"}
                </span>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-500">
                {formatValue(data.raw?.data?.inputs?.[0]?.value) || "未选择"}
              </span>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">提问内容</div>
            <div className="mt-2 text-xs text-slate-500">
              {data.raw?.data?.settings?.question_template || "未填写提问内容"}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.outputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="flex items-center gap-2 text-xs text-amber-700"
                >
                  <span className="font-semibold">{item?.name ?? "-"}</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item?.type ?? "unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isMessage ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-700">
                <span className="font-semibold">
                  {data.raw?.data?.inputs?.[0]?.name || "output"}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {data.raw?.data?.inputs?.[0]?.type || "String"}
                </span>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-500">
                {formatValue(data.raw?.data?.inputs?.[0]?.value) || "未选择"}
              </span>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">消息模板</div>
            <div className="mt-2 text-xs text-slate-500">
              {data.raw?.data?.settings?.message_template || "未填写消息模板"}
            </div>
          </div>
        </div>
      ) : null}

      {isCode ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输入</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.inputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-700">
                      {item?.name ?? "-"}{item?.required ? "*" : ""}
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item?.type ?? "unknown"}
                    </span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    {formatValue(item?.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.outputs ?? []).map((item: any) => (
                <div key={item?.name} className="flex items-center gap-2 text-xs text-amber-700">
                  <span className="font-semibold">{item?.name ?? "-"}</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item?.type ?? "unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isLoop ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">循环数组</div>
            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-700">
                <span className="font-semibold">
                  {data.raw?.data?.inputs?.[0]?.name || "未命名"}
                  {data.raw?.data?.inputs?.[0]?.required ? "*" : ""}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {data.raw?.data?.inputs?.[0]?.type || "list"}
                </span>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-500">
                {formatValue(data.raw?.data?.inputs?.[0]?.value) || "未选择"}
              </span>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
          </div>
        </div>
      ) : null}

      {isBranch ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>如果</span>
              <span className="text-sky-600 font-semibold">+</span>
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>否则</span>
              <span className="text-sky-600 font-semibold">+</span>
            </div>
          </div>
        </div>
      ) : null}

      {isWorkflow ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">引用子流程</div>
            <div className="mt-2 text-xs text-slate-500">
              {data.raw?.data?.settings?.component || data.raw?.component || data.raw?.id || "未配置子流程文件"}
            </div>
          </div>
        </div>
      ) : null}

      {isLlm ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输入</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.inputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="font-semibold">
                      {item?.name ?? "-"}
                      {item?.required ? "*" : ""}
                    </span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item?.type ?? "unknown"}
                    </span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    {formatValue(item?.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md bg-slate-50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>提示词</span>
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                {data.raw?.data?.settings?.model_name ?? "LLM"}
              </span>
            </div>
            <div className="mt-2 rounded bg-white px-3 py-2 text-xs text-slate-700">
              <div className="text-[11px] text-slate-500">用户提示词</div>
              <pre className="mt-1 whitespace-pre-wrap break-words text-[11px]">
                {data.raw?.data?.settings?.prompt ?? ""}
              </pre>
            </div>
          </div>

          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.outputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="flex items-center gap-2 text-xs text-amber-700"
                >
                  <span className="font-semibold">{item?.name ?? "-"}</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item?.type ?? "unknown"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isEnd ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">输出</div>
            <div className="mt-2 space-y-1">
              {(data.raw?.data?.inputs ?? []).map((item: any) => (
                <div
                  key={item?.name}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="font-semibold">{item?.name ?? "-"}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item?.type ?? "unknown"}
                    </span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    {formatValue(item?.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-md bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">回复模板</div>
            <div className="mt-2 rounded bg-white px-3 py-2 text-[11px] text-slate-700">
              {data.raw?.data?.settings?.content ?? ""}
            </div>
          </div>
        </div>
      ) : null}
      {!isEnd ? <Handle id="output" type="source" position={Position.Right} /> : null}
    </div>
  );
}

function formatValue(value: any): string {
  if (!value) return "";
  if (value.type === "literal") {
    return Array.isArray(value.content)
      ? JSON.stringify(value.content)
      : String(value.content);
  }
  if (value.type === "ref") {
    const refNode = value.content?.ref_node_id ?? "ref";
    const refVar = value.content?.ref_var_name ?? "";
    const refName = nodeNameMap[refNode] || refNode;
    return `${refName}/${refVar}`;
  }
  return value.type ? String(value.type) : "";
}

const nodeTypes = { qfNode: QfNode };
const edgeTypes = { arrowBezier: ArrowBezier };

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function NodeInspector({ node }: { node: Node<QfNodeData> }) {
  const raw = node.data.raw ?? {};
  const type = raw.type;

  if (type === "start") {
    const systemParams =
      raw?.data?.inputs?.length > 0
        ? raw.data.inputs.map((item: any) => ({
            name: item?.name ?? "-",
            type: item?.type ?? "",
            desc: item?.desc ?? "",
          }))
        : [
            { name: "rawQuery", type: "String", desc: "用户输入的原始内容" },
            { name: "chatHistory", type: "String", desc: "用户与应用的对话历史（轮数受限）" },
            { name: "fileUrls", type: "Array<String>", desc: "用户在应用对话中上传的文件链接" },
            { name: "fileNames", type: "Array<String>", desc: "用户在对话中上传的文件名" },
            { name: "end_user_id", type: "String", desc: "终端用户的唯一 id，应用调用时传入" },
            { name: "conversation_id", type: "String", desc: "会话 id，是会话的唯一标识" },
            { name: "request_id", type: "String", desc: "本次请求的 id，便于记录与调试" },
            { name: "fileIds", type: "Array<String>", desc: "用户在对话中上传的文件 id" },
          ];

    return (
      <div className="space-y-4 text-xs text-slate-700">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 h-6 w-6 rounded-full bg-emerald-100 text-center text-sm leading-6 text-emerald-600">
            ▶
          </span>
          <div>
            <div className="text-base font-semibold text-slate-900">开始</div>
            <p className="mt-1 text-xs text-slate-500">
              工作流运行的起点，开始节点支持定义工作流所需的输入参数，包含用户输入的原始内容、用户与应用的对话历史、文件信息等。
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            输入
          </div>
          <div className="mt-2 rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span>系统参数</span>
              <span className="text-slate-400">?</span>
            </div>
            <div className="mt-2 space-y-1">
              {systemParams.map((item) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[170px_1fr] items-start gap-3 rounded px-1 py-1 hover:bg-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-700">{item.name}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {item.type}
                    </span>
                  </div>
                  <span className="block whitespace-nowrap text-left text-[11px] text-slate-500 leading-5 overflow-hidden text-ellipsis">
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            + 添加参数
          </button>
        </div>
      </div>
    );
  }

  if (type === "service_http" || type === "api") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">API</div>
        <div className="rounded border border-slate-200 p-3">
          <InfoRow label="接口地址" value={raw?.data?.settings?.url ?? ""} />
          <InfoRow label="请求方式" value={raw?.data?.settings?.http_method ?? ""} />
        </div>
        <Section title="输入">
          {(raw?.data?.inputs ?? []).map((item: any) => (
            <div
              key={item?.name}
              className="grid grid-cols-[1fr_auto] items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {item?.name ?? "-"}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? ""}
                </span>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                {formatValue(item?.value)}
              </span>
            </div>
          ))}
        </Section>
        <Section title="输出">
          {(raw?.data?.outputs ?? []).map((item: any) => (
            <div key={item?.name} className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {item?.name ?? "-"}
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {item?.type ?? ""}
              </span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (type === "intention") {
    const intentions = raw?.data?.settings?.intentions ?? [];
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">意图识别</div>
        <p className="text-xs text-slate-500">
          识别用户的输入意图，并分配到不同分支执行。
        </p>

        <Section title="模式">
          <div className="flex items-center gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="radio" defaultChecked className="h-4 w-4 text-indigo-600" />
              极速模式
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" className="h-4 w-4 text-indigo-600" />
              精确模式
            </label>
          </div>
        </Section>

        <Section title="输入">
          {(raw?.data?.inputs ?? []).map((item: any) => (
            <div
              key={item?.name}
              className="grid grid-cols-[120px_100px_1fr] items-center gap-2 text-sm text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item?.name ?? "-"}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? ""}
                </span>
              </div>
              <select className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <option>引用</option>
              </select>
              <input
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                placeholder="请选择引用值"
                defaultValue={formatValue(item?.value)}
              />
            </div>
          ))}
        </Section>

        <Section title="意图配置">
          <div className="space-y-3">
            {intentions.map((it: any, idx: number) => (
              <div
                key={it?.meta?.id ?? idx}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>意图{idx + 1}</span>
                    <input type="checkbox" className="h-4 w-4" defaultChecked={!!it?.global_selected} />
                    <span className="text-xs text-slate-500">允许跳转</span>
                  </div>
                  <span className="text-slate-400">?</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold">
                      意图名称 *
                    </span>
                    <input
                      className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-800"
                      defaultValue={it?.name ?? ""}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold">意图描述 *</span>
                    <textarea
                      className="min-h-[80px] rounded border border-slate-200 px-2 py-2 text-sm text-slate-800"
                      placeholder="请描述意图的含义、使用场景，或提供例句，便于模型识别"
                      defaultValue={it?.desc ?? ""}
                    />
                  </label>
                </div>
              </div>
            ))}
            <button className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700">
              + 添加意图
            </button>
          </div>
        </Section>

        <Section title="高级配置">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm text-slate-700"
                placeholder="请选择模型"
                defaultValue={raw?.data?.settings?.model?.model_name ?? ""}
              />
              <button className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600">
                刷新
              </button>
            </div>
            <label className="flex items-center gap-2">
              <span>对话历史</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  defaultChecked={!!raw?.data?.settings?.model?.chat_history}
                />
                <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
              </label>
            </label>
            <div>
              <div className="flex items-center justify-between">
                <span>附加提示词</span>
                <div className="flex items-center gap-2 text-xs text-indigo-600">
                  <span>✨ 优化</span>
                  <span>模板</span>
                </div>
              </div>
              <textarea
                className="mt-2 w-full rounded border border-slate-200 px-2 py-2 text-sm text-slate-700"
                placeholder="请输入附加提示词，提高意图识别准确率"
              />
            </div>
          </div>
        </Section>

        <Section title="输出">
          {(raw?.data?.outputs ?? []).map((item: any) => (
            <div key={item?.name} className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {item?.name ?? "-"}
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {item?.type ?? ""}
              </span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (type === "chat") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">信息收集</div>
        <p className="text-xs text-slate-500">
          支持在该节点向用户提问，等待用户回复，将用户回复内容及抽取的信息作为输出参数。
        </p>

        <Section title="输入">
          {(raw?.data?.inputs ?? []).map((item: any, idx: number) => (
            <div
              key={item?.name ?? idx}
              className="grid grid-cols-[140px_100px_1fr] items-center gap-2 text-sm text-slate-700"
            >
              <input
                className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-700"
                defaultValue={item?.name ?? ""}
                placeholder="请输入参数名"
              />
              <select className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <option>引用</option>
              </select>
              <input
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                placeholder="请选择引用参数"
                defaultValue={formatValue(item?.value)}
              />
            </div>
          ))}
        </Section>

        <Section title="提问内容">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>流式输出</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                defaultChecked={!!raw?.data?.settings?.streaming}
              />
              <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
            </label>
          </div>
          <textarea
            className="mt-2 min-h-[120px] w-full rounded border border-slate-200 px-2 py-2 text-sm text-slate-700"
            placeholder="请填写对话过程中应用向用户提问的内容，通过插入{{参数名}}可以引用对应的输入参数"
            defaultValue={raw?.data?.settings?.question_template ?? ""}
          />
        </Section>

        <Section title="参数抽取">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>0/10</span>
            <span className="text-lg text-slate-500">+</span>
          </div>
        </Section>

        <Section title="高级配置">
          <div className="space-y-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm text-slate-700"
                placeholder="请选择模型"
                defaultValue={raw?.data?.settings?.model?.model_name ?? ""}
              />
              <button className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600">
                刷新
              </button>
            </div>
            <label className="flex items-center gap-2">
              <span>对话历史</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  defaultChecked={!!raw?.data?.settings?.model?.chat_history}
                />
                <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
              </label>
            </label>
          </div>
        </Section>

        <Section title="输出">
          {(raw?.data?.outputs ?? []).map((item: any) => (
            <div key={item?.name} className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {item?.name ?? "-"}
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {item?.type ?? ""}
              </span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (type === "code") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">代码</div>
        <p className="text-xs text-slate-500">
          编写代码，处理输入输出变量来生成返回值。
        </p>

        <Section title="输入">
          {(raw?.data?.inputs ?? []).map((item: any, idx: number) => (
            <div
              key={item?.name ?? idx}
              className="grid grid-cols-[120px_120px_1fr] items-center gap-2 text-sm text-slate-700"
            >
              <input
                className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-700"
                defaultValue={item?.name ?? ""}
                placeholder="参数名"
              />
              <select className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <option>{item?.type ?? "String"}</option>
              </select>
              <input
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                defaultValue={
                  item?.value?.type === "literal"
                    ? String(item?.value?.content ?? "")
                    : formatValue(item?.value)
                }
                placeholder="值"
              />
            </div>
          ))}
        </Section>

        <Section title="代码">
          <div className="rounded border border-slate-200 bg-black text-white">
            <pre className="overflow-auto p-3 text-[12px] leading-5 text-emerald-100">
{raw?.data?.settings?.code ?? ""}
            </pre>
          </div>
          <button className="mt-2 w-full rounded border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700">
            编辑代码
          </button>
        </Section>

        <Section title="输出">
          {(raw?.data?.outputs ?? []).map((item: any, idx: number) => (
            <div
              key={item?.name ?? idx}
              className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item?.name ?? "-"}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item?.object_schema || item?.list_schema ? (
                  <span className="text-xs text-slate-500">结构化</span>
                ) : null}
              </div>
            </div>
          ))}
        </Section>
      </div>
    );
  }
  if (type === "message") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">消息</div>
        <p className="text-xs text-slate-500">
          支持在工作流运行过程中发送消息输出。
        </p>

        <Section title="回复模式">
          <div className="flex items-center gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="radio" defaultChecked className="h-4 w-4 text-indigo-600" />
              按模板配置格式返回文本
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" className="h-4 w-4 text-indigo-600" />
              直接返回参数值
            </label>
          </div>
        </Section>

        <Section title="输出">
          {(raw?.data?.inputs ?? []).map((item: any, idx: number) => (
            <div
              key={item?.name ?? idx}
              className="grid grid-cols-[120px_100px_1fr] items-center gap-2 text-sm text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{item?.name ?? "output"}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? "String"}
                </span>
              </div>
              <select className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <option>引用</option>
              </select>
              <input
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                placeholder="请选择引用参数"
                defaultValue={formatValue(item?.value)}
              />
            </div>
          ))}
        </Section>

        <Section title="消息模板">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>流式输出</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                defaultChecked={!!raw?.data?.settings?.streaming}
              />
              <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
            </label>
          </div>
          <textarea
            className="mt-2 min-h-[120px] w-full rounded border border-slate-200 px-2 py-2 text-sm text-slate-700"
            placeholder="请填写向用户发送的消息模板内容，通过插入{{参数名}}可以引用对应的输出参数"
            defaultValue={raw?.data?.settings?.message_template ?? ""}
          />
        </Section>
      </div>
    );
  }

  if (type === "loop") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">循环</div>
        <p className="text-xs text-slate-500">
          通过设定条件或循环次数，实现容器中流程的重复执行。
        </p>

        <Section title="循环类型">
          <div className="flex items-center gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="radio" defaultChecked className="h-4 w-4 text-indigo-600" />
              数组循环
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" className="h-4 w-4 text-indigo-600" />
              条件循环
            </label>
          </div>
        </Section>

        <Section title="循环数组">
          <div className="grid grid-cols-[140px_1fr] items-center gap-2 text-sm text-slate-700">
            <input
              className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-700"
              placeholder="请输入参数名"
              defaultValue={raw?.data?.inputs?.[0]?.name ?? ""}
            />
            <div className="flex items-center gap-2">
              <select className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700">
                <option>引用值</option>
              </select>
              <input
                className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                placeholder="请选择引用参数"
                defaultValue={formatValue(raw?.data?.inputs?.[0]?.value)}
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500">{`{x} 循环变量`}</div>
        </Section>

        <Section title="并行执行">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span>并行执行</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
            </label>
          </label>
        </Section>

        <Section title="输出">
          <div className="text-xs text-slate-500">暂无输出配置</div>
        </Section>
      </div>
    );
  }

  if (type === "branch" || type === "switch") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">分支器</div>
        <p className="text-xs text-slate-500">
          连接多个下游分支节点，若设定条件成立则运行对应的条件分支，若均不成立则运行“否则”分支。
        </p>

        <Section title="条件分支">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
              <span>如果</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">〇</span>
                <span className="text-slate-400">〇</span>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="rounded-md border border-red-300 bg-white px-2 py-2">
                <div className="text-xs text-red-500">请填写条件</div>
              </div>
              <div className="rounded-md border border-red-300 bg-white px-2 py-2">
                <div className="text-xs text-red-500">请填写条件</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-indigo-600">
                <button className="rounded border border-indigo-200 px-2 py-1">+ 添加条件</button>
                <button className="rounded border border-indigo-200 px-2 py-1">且/或</button>
              </div>
            </div>
          </div>
          <button className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700">
            + 添加分支
          </button>
        </Section>
      </div>
    );
  }

  if (type === "llm") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">大模型</div>
        <Section title="输入">
          {(raw?.data?.inputs ?? []).map((item: any) => (
            <div
              key={item?.name}
              className="grid grid-cols-[1fr_auto] items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {item?.name ?? "-"}
                  {item?.required ? "*" : ""}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? ""}
                </span>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                {formatValue(item?.value)}
              </span>
            </div>
          ))}
        </Section>
        <Section title="提示词">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">模型</span>
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              {raw?.data?.settings?.model_name ?? "LLM"}
            </span>
          </div>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-slate-100 px-2 py-2 text-[11px] text-slate-700">
            {raw?.data?.settings?.prompt ?? ""}
          </pre>
        </Section>
        <Section title="输出">
          {(raw?.data?.outputs ?? []).map((item: any) => (
            <div key={item?.name} className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {item?.name ?? "-"}
              </span>
              <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {item?.type ?? ""}
              </span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (type === "end") {
    return (
      <div className="space-y-4 text-xs">
        <div className="text-sm font-semibold text-slate-900">结束</div>
        <Section title="输出">
          {(raw?.data?.inputs ?? []).map((item: any) => (
            <div
              key={item?.name}
              className="grid grid-cols-[1fr_auto] items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {item?.name ?? "-"}
                </span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? ""}
                </span>
              </div>
              <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                {formatValue(item?.value)}
              </span>
            </div>
          ))}
        </Section>
        <Section title="回复模板">
          <pre className="whitespace-pre-wrap break-words rounded bg-slate-100 px-2 py-2 text-[11px] text-slate-700">
            {raw?.data?.settings?.content ?? ""}
          </pre>
        </Section>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-500">暂不支持的节点类型：{type}</div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-700">{title}</div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function ArrowBezier(props: EdgeProps) {
  return (
    <BezierEdge
      {...props}
      style={{ stroke: "#6b7280", strokeWidth: 2 }}
      markerEnd={props.markerEnd}
    />
  );
}

function SidebarSection({
  title,
  open,
  onToggle,
  extra,
  content,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  extra?: React.ReactNode;
  content: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <div className="flex items-center justify-between py-3">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-slate-800"
          onClick={onToggle}
        >
          <span>{open ? "▾" : "▸"}</span>
          <span>{title}</span>
        </button>
        {extra}
      </div>
      {open ? <div className="rounded-lg bg-slate-50 p-3">{content}</div> : null}
    </div>
  );
}

function LoopContainerPreview({ loopSchema }: { loopSchema: any }) {
  const innerNodes = loopSchema?.nodes ?? [];
  const innerEdges = loopSchema?.edges ?? [];
  const nodes = useMemo(() => toReactFlowNodes(innerNodes), [innerNodes]);
  const edges = useMemo(() => toReactFlowEdges(innerEdges), [innerEdges]);

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        循环容器 <span className="text-slate-400">?</span>
      </div>
      <div
        className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
        style={{
          backgroundImage:
            "radial-gradient(#cbd5e1 1px, transparent 0)",
          backgroundSize: "12px 12px",
          backgroundPosition: "-1px -1px",
        }}
      >
        {innerNodes.length === 0 ? (
          <div className="text-xs text-slate-500">暂无子节点</div>
        ) : (
          <div className="h-[380px] rounded-lg border border-dashed border-slate-300 bg-white">
            <ReactFlowProvider>
              <ReactFlow
                nodesDraggable
                nodesConnectable
                elementsSelectable
                panOnDrag
                zoomOnScroll={false}
                zoomOnPinch={false}
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
              >
                <Background />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        )}
      </div>
    </div>
  );
}

function PaletteItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-800">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>
        {label.slice(0, 1)}
      </span>
      <span>{label}</span>
    </div>
  );
}

function PaletteList() {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm">
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">
          理解&思考&生成
        </div>
        <div className="space-y-2">
          <PaletteItem label="大模型" color="bg-indigo-600" />
          <PaletteItem label="智能体" color="bg-indigo-600" />
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">工具引入</div>
        <div className="space-y-2">
          <PaletteItem label="组件" color="bg-teal-500" />
          <PaletteItem label="API" color="bg-teal-500" />
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">业务逻辑</div>
        <div className="space-y-2">
          <PaletteItem label="意图识别" color="bg-orange-500" />
          <PaletteItem label="分支器" color="bg-orange-500" />
          <PaletteItem label="循环" color="bg-orange-500" />
          <PaletteItem label="代码" color="bg-orange-500" />
        </div>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">输入&输出</div>
        <div className="space-y-2">
          <PaletteItem label="信息收集" color="bg-pink-500" />
          <PaletteItem label="消息节点" color="bg-pink-500" />
        </div>
      </div>
    </div>
  );
}

function renderNodeIcon(type?: string) {
  if (type === "start") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#13b982" rx="5"></rect>
        <circle cx="9.999" cy="10" r="5.2" fill="#fff" stroke="#fff" strokeWidth="1.3"></circle>
        <path
          fill="#13b982"
          d="m9.31 7.498 3.15 2.182a.39.39 0 0 1 0 .642L9.31 12.5a.39.39 0 0 1-.612-.32V7.819c0-.314.353-.5.612-.32"
        ></path>
      </svg>
    );
  }
  if (type === "intention") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path
          fill="#fff"
          d="M7.95 6.5c.534-.755 1.967-.755 2.5 0l.534.755 1.05-.087c.928-.077 1.559.86 1.132 1.705l-.349.696.632.59c.703.657.302 1.835-.657 1.959l-.853.11-.23.827c-.203.73-1.21 1.025-1.788.535l-.663-.555-.663.555c-.578.49-1.585.195-1.788-.535l-.23-.827-.853-.11c-.959-.124-1.36-1.302-.657-1.96l.632-.588-.349-.697c-.427-.844.204-1.782 1.132-1.705l1.05.087z"
        />
      </svg>
    );
  }
  if (type === "service_http" || type === "api") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#29ccc9" rx="5"></rect>
        <path
          fill="#fff"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
          d="m13.755 9.422-.866.867L9.71 7.111l.867-.866c.433-.434 2.022-1.156 3.177 0s.434 2.744 0 3.177"
        ></path>
        <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m15.2 4.8-1.445 1.445"></path>
        <path
          fill="#fff"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
          d="m6.244 10.578.867-.867 3.178 3.178-.867.867c-.433.433-2.022 1.155-3.178 0-1.155-1.156-.433-2.745 0-3.178"
        ></path>
        <path stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m9.71 12.311 1.156-1.155M4.8 15.2l1.444-1.444m1.444-3.467 1.156-1.156"></path>
      </svg>
    );
  }
  if (type === "chat") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#f471b5" rx="5"></rect>
        <path
          fill="#fff"
          d="M6.5 6.5h7a1 1 0 0 1 1 1v3.75a1 1 0 0 1-1 1h-1.9l-1.52 1.52a.5.5 0 0 1-.848-.353V12.25H6.5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1"
        />
      </svg>
    );
  }
  if (type === "message") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#fb7185" rx="5"></rect>
        <path
          fill="#fff"
          d="M6.5 6h7a1 1 0 0 1 1 1v4.5a1 1 0 0 1-1 1h-2l-1.7 1.7a.5.5 0 0 1-.854-.353V12.5h-2.5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1"
        />
      </svg>
    );
  }
  if (type === "loop") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path
          fill="#fff"
          d="M6.5 6.5h5.25V5l2.75 2.25-2.75 2.25v-1.5H7.5c-.552 0-1 .448-1 1v2h-1v-2c0-1.105.895-2 2-2m7.5 4v2c0 1.105-.895 2-2 2H6.75V16L4 13.75 6.75 11.5V13h4.25c.552 0 1-.448 1-1v-2h1z"
        />
      </svg>
    );
  }
  if (type === "code") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path
          fill="#fff"
          d="M8.5 6.5a.5.5 0 0 1 .83-.37l2.5 2.25a.5.5 0 0 1 0 .74l-2.5 2.25a.5.5 0 0 1-.83-.37z"
        />
        <path
          fill="#fff"
          d="M7.5 7.25a.5.5 0 0 0-.83-.37L4.17 9.13a.5.5 0 0 0 0 .74l2.5 2.25a.5.5 0 0 0 .83-.37z"
        />
        <rect width="2" height="10" x="13" y="5" fill="#fff" rx="0.5"></rect>
      </svg>
    );
  }
  if (type === "workflow") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#4F46E5" rx="5"></rect>
        <path
          fill="#fff"
          d="M6.5 5.5a1 1 0 0 1 1-1h2.75a1 1 0 0 1 1 1v1.25h1.25a1 1 0 0 1 1 1v2.25a1 1 0 0 1-1 1H11.25V14a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1z"
        />
      </svg>
    );
  }
  if (type === "branch" || type === "switch") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#f97316" rx="5"></rect>
        <path
          fill="#fff"
          d="M6.5 5.5c0-.552.448-1 1-1h1.5c.552 0 1 .448 1 1v2.115c0 .414.336.75.75.75h1.252c.69 0 1.248.559 1.248 1.248v.774c0 .414-.336.75-.75.75h-.75a.75.75 0 0 0-.75.75v2.563c0 .552-.448 1-1 1H7.5c-.552 0-1-.448-1-1z"
        />
      </svg>
    );
  }
  if (type === "llm") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#352eff" rx="5"></rect>
        <path
          fill="#fff"
          d="M14.841 7.23a.645.645 0 0 0-.352-.868l-3.956-1.774a1.32 1.32 0 0 0-1.068 0L5.51 6.362a.67.67 0 0 0-.35.331.645.645 0 0 0 .35.868l4.163 1.857c.1.05.213.08.328.08a.8.8 0 0 0 .329-.08l4.162-1.856a.68.68 0 0 0 .35-.333M9.23 9.999 5.476 8.331a.69.69 0 0 0-.648 0 .67.67 0 0 0-.352.581v4.26c0 .26.149.496.383.607l3.76 1.671q.145.072.307.074a.72.72 0 0 0 .587-.34.7.7 0 0 0 .097-.338V10.58a.69.69 0 0 0-.38-.58m6.294 3.173v-4.26a.68.68 0 0 0-.352-.58.68.68 0 0 0-.636-.017L10.757 10a.68.68 0 0 0-.367.582v4.278a.69.69 0 0 0 .35.582.7.7 0 0 0 .334.083.65.65 0 0 0 .306-.073l3.776-1.672a.67.67 0 0 0 .368-.607"
        ></path>
      </svg>
    );
  }
  if (type === "end") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="none"
        viewBox="0 0 20 20"
      >
        <rect width="20" height="20" fill="#fa423c" rx="5"></rect>
        <circle cx="10" cy="10" r="5.15" stroke="#fff" strokeWidth="1.4"></circle>
        <circle cx="10" cy="10" r="1.95" fill="#fff"></circle>
      </svg>
    );
  }
  return null;
}

function toReactFlowNodes(nodes: any[] = []): Node<QfNodeData>[] {
  const toNum = (val: any, fallback: number) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : fallback;
  };

  return nodes.map((node) => {
    const ui = node?.meta?.uiState ?? {};
    const width = toNum(ui.width, 320);
    const height = toNum(ui.height, 160);
    const posX = toNum(ui.x, 0);
    const posY = toNum(ui.y, 0);

    const isApi = node?.type === "service_http" || node?.type === "api";
    const description =
      isApi
        ? node?.data?.settings?.url ?? node?.data?.settings?.http_method
        : node?.type === "llm"
          ? node?.data?.settings?.model_name ?? "LLM"
        : node?.type === "code"
          ? "代码节点"
        : node?.type === "workflow"
          ? "子流程引用"
        : node?.type === "end"
          ? "返回结果节点"
          : undefined;

    return {
      id: node.id,
      type: "qfNode",
      position: { x: posX, y: posY },
      data: {
        title: node.name ?? "节点",
        subtitle: node.type ?? "unknown",
        description,
        raw: node,
      },
      style: {
        width,
        height,
      },
    };
  });
}

function toReactFlowEdges(edges: any[] = []): Edge[] {
  return edges.map((edge, index) => ({
    id: edge.id ?? `${edge.source_node_id}-${edge.target_node_id}-${index}`,
    source: edge.source_node_id,
    target: edge.target_node_id,
    sourceHandle: "output",
    targetHandle: "input",
    animated: false,
    type: "arrowBezier",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#6b7280",
      width: 18,
      height: 18,
    },
  }));
}

function WorkflowCanvas() {
  const [nodes, setNodes] = useState<Node<QfNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<QfNodeData> | null>(null);
  const [showAppConfig, setShowAppConfig] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [appSectionOpen, setAppSectionOpen] = useState<Record<string, boolean>>({
    basic: false,
    memory: false,
    voice: false,
    opening: false,
    suggest: false,
    followup: false,
    background: false,
  });
  const defaultFile = "flow-examples/意图识别/app.yaml";
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const loadWorkflow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fileParam = encodeURIComponent(defaultFile);
      const res = await fetch(`/api/workflow-example?file=${fileParam}`);
      if (!res.ok) {
        throw new Error(`请求失败：${res.statusText}`);
      }
      const payload = await res.json();
      const content = payload?.content;
      if (!content) {
        throw new Error("未获取到示例 YAML 内容");
      }
      const parsed = YAML.load(content) as any;
      let schema: WorkflowSchema | undefined =
        parsed?.workflow_detail?.workflow_schema || parsed?.workflow_schema;

      if (!schema && parsed?.workflow_id) {
        const baseDir = defaultFile.split("/").slice(0, -1).join("/");
        const componentPath = `${baseDir}/component/${parsed.workflow_id}.yaml`;
        const compRes = await fetch(
          `/api/workflow-example?file=${encodeURIComponent(componentPath)}`,
        );
        if (!compRes.ok) {
          throw new Error(`组件文件加载失败：${componentPath}`);
        }
        const compPayload = await compRes.json();
        const compContent = compPayload?.content;
        const compParsed = compContent ? (YAML.load(compContent) as any) : null;
        schema =
          compParsed?.workflow_schema ||
          compParsed?.workflow_detail?.workflow_schema;
      }

      if (!schema) {
        throw new Error("YAML 中缺少 workflow_schema");
      }
      nodeNameMap = {};
      (schema.nodes || []).forEach((n: any) => {
        if (n?.id) nodeNameMap[n.id] = n.name || n.id;
      });
      setNodes(toReactFlowNodes(schema.nodes));
      setEdges(toReactFlowEdges(schema.edges));
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setError(message);
      console.error("[workflow-page] load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const autoLayout = useCallback(() => {
    setNodes((prev) => {
      if (prev.length === 0) return prev;

      const idToNode = new Map(prev.map((n) => [n.id, n]));
      const indegree: Record<string, number> = {};
      prev.forEach((n) => (indegree[n.id] = 0));
      edges.forEach((e) => {
        if (indegree[e.target] !== undefined) {
          indegree[e.target] += 1;
        }
      });

      const queue: string[] = [];
      Object.entries(indegree).forEach(([id, deg]) => {
        if (deg === 0) queue.push(id);
      });

      const layers: string[][] = [];
      const indegreeCopy = { ...indegree };
      let processed = 0;
      while (queue.length) {
        const size = queue.length;
        const layer: string[] = [];
        for (let i = 0; i < size; i++) {
          const id = queue.shift()!;
          layer.push(id);
          processed += 1;
          edges.forEach((e) => {
            if (e.source === id) {
              indegreeCopy[e.target] -= 1;
              if (indegreeCopy[e.target] === 0) queue.push(e.target);
            }
          });
        }
        layers.push(layer);
      }

      const hasCycle = processed !== prev.length;
      const spacingX = 420;
      const spacingY = 260;

      if (hasCycle) {
        const cols = Math.ceil(Math.sqrt(prev.length));
        return prev.map((n, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          return {
            ...n,
            position: { x: col * spacingX, y: row * spacingY },
          };
        });
      }

      const layerMaxCount = Math.max(...layers.map((l) => l.length));
      const xOffset = (layer: number) => layer * spacingX;
      return prev.map((n) => {
        const layerIdx = layers.findIndex((layer) => layer.includes(n.id));
        const layer = layers[layerIdx];
        const idxInLayer = layer.indexOf(n.id);
        const y =
          ((idxInLayer + 0.5) / layer.length) * (layerMaxCount * spacingY);
        return {
          ...n,
          position: { x: xOffset(layerIdx), y },
        };
      });
    });
  }, [edges]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "arrowBezier",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6b7280",
              width: 18,
              height: 18,
            },
          },
          eds,
        ),
      ),
    [],
  );

  const centerView = useCallback(() => {
    if (rfInstance) {
      rfInstance.fitView({ padding: 0.2, includeHiddenNodes: true });
    }
  }, [rfInstance]);

  const canvasContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          正在加载工作流...
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-600">
          <span>加载失败：{error}</span>
          <button
            onClick={loadWorkflow}
            className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            重试
          </button>
        </div>
      );
    }

    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedNode(node);
          setShowInspector(true);
        }}
        onPaneClick={() => {
          setSelectedNode(null);
          setShowInspector(false);
        }}
        onSelectionChange={(params) => {
          const n = params.nodes && params.nodes[0];
          if (n) {
            setSelectedNode(n);
            setShowInspector(true);
          } else {
            setSelectedNode(null);
            setShowInspector(false);
          }
        }}
        onInit={(instance) => setRfInstance(instance)}
        fitView
        className="bg-slate-50"
      >
        <Background />
        <MiniMap />
        <Controls position="bottom-left" />
      </ReactFlow>
    );
  }, [
    edges,
    error,
    loadWorkflow,
    loading,
    nodes,
    onConnect,
    onEdgesChange,
    onNodesChange,
  ]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="text-base font-semibold text-slate-900">
            知识库问答工作流
          </div>
          <div className="text-xs text-slate-500">暂无短信推送 · 工作流Agent</div>
          <div className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            自动保存于 08:25:15
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>配置</span>
            <span>发布</span>
            <span>调优</span>
            <span>分析</span>
          </div>
          <button
            onClick={loadWorkflow}
            className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            重载
          </button>
          <button className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
            更新发布
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-56px)]">
        {showAppConfig ? (
          <aside className="w-80 border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">应用配置</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-indigo-600">对话设置</span>
                <button
                  className="text-xs text-slate-500"
                  onClick={() => setShowAppConfig(false)}
                >
                  收起
                </button>
              </div>
            </div>
            <div className="h-[calc(100vh-56px-52px)] overflow-auto p-4 text-sm">
              <SidebarSection
                title="基本信息"
                open={appSectionOpen.basic}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, basic: !s.basic }))
                }
                content={
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-lg font-bold">
                        🌸
                      </div>
                      <div className="flex-1">
                        <input
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400"
                          defaultValue="知识库问答工作流"
                        />
                        <div className="mt-1 text-right text-[11px] text-slate-400">
                          8 / 50
                        </div>
                      </div>
                    </div>
                    <div>
                      <textarea
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                        rows={3}
                        placeholder="请描述你的应用，该描述将在应用发布后固定展示"
                      />
                      <div className="mt-1 text-right text-[11px] text-slate-400">
                        0 / 100
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-semibold text-indigo-600">
                      ✨ AI生成
                    </button>
                  </div>
                }
              />

              <div className="mt-4 text-xs font-semibold text-slate-400">记忆</div>
              <SidebarSection
                title="记忆变量"
                open={appSectionOpen.memory}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, memory: !s.memory }))
                }
                extra={<span className="text-lg text-slate-500">+</span>}
                content={
                  <p className="text-xs text-slate-500">
                    请先配置该应用的记忆变量，然后在工作流中配置记忆变量节点来写入和读取记忆变量的值。
                  </p>
                }
              />

              <div className="mt-6 text-xs font-semibold text-slate-400">对话</div>
              <SidebarSection
                title="声音和形象"
                open={appSectionOpen.voice}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, voice: !s.voice }))
                }
                extra={
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
                  </label>
                }
                content={
                  <p className="text-xs text-slate-500">
                    选择与应用角色设定匹配的播报音色或数字人形象，查看
                    <span className="text-indigo-600">SDK集成说明</span>
                  </p>
                }
              />

              <SidebarSection
                title="开场白"
                open={appSectionOpen.opening}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, opening: !s.opening }))
                }
                content={
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                    rows={3}
                    placeholder="请输入开场白"
                  />
                }
              />

              <SidebarSection
                title="推荐问"
                open={appSectionOpen.suggest}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, suggest: !s.suggest }))
                }
                content={
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                    placeholder="请输入推荐问"
                  />
                }
              />

              <SidebarSection
                title="追问"
                open={appSectionOpen.followup}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, followup: !s.followup }))
                }
                extra={<span className="text-xs text-indigo-600">关闭 ▾</span>}
                content={
                  <p className="text-xs text-slate-500">
                    在每轮回复后，不会提供用户任何提问建议
                  </p>
                }
              />

              <SidebarSection
                title="背景图片"
                open={appSectionOpen.background}
                onToggle={() =>
                  setAppSectionOpen((s) => ({ ...s, background: !s.background }))
                }
                extra={<span className="text-lg text-slate-500">+</span>}
                content={
                  <p className="text-xs text-slate-500">
                    上传聊天背景图片，提供更沉浸的对话体验
                  </p>
                }
              />
            </div>
          </aside>
        ) : null}

        <main className="relative flex flex-1">
          <div className="absolute inset-0 flex">
            <div className="flex-1 relative">
              {canvasContent}
              {!showAppConfig ? (
                <button
                  className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white shadow"
                  onClick={() => setShowAppConfig(true)}
                  title="展开配置"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
                    <g fill="none" fillRule="evenodd">
                      <path d="M-5-5h24v24H-5z"></path>
                      <rect width="9.8" height="9.8" x="0.6" y="0.6" stroke="#151B26" strokeWidth="1.2" rx="2"></rect>
                      <path fill="#151B26" fillRule="nonzero" d="M5 14h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2"></path>
                      <path stroke="#FFF" strokeLinecap="round" strokeWidth="1.2" d="M5.396 6.5h2.736m.868 4h2.606"></path>
                      <circle cx="9.5" cy="6.5" r="1.1" stroke="#FFF" strokeWidth="1.2"></circle>
                      <circle cx="7.5" cy="10.5" r="1.1" stroke="#FFF" strokeWidth="1.2"></circle>
                      <path stroke="#FFF" strokeLinecap="round" strokeWidth="1.2" d="M11 6.5h.606m-6.21 4h.755"></path>
                    </g>
                  </svg>
                </button>
              ) : null}
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-2 shadow-lg">
                  <button
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowNodePalette((v) => !v)}
                    className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    <span className="h-4 w-4" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                        <g fill="none">
                          <path fill="#FFF" d="M3.121 2h9.758q1.041 0 1.581.478T15 3.895v8.21q0 .939-.54 1.417T12.879 14H3.121q-1.047 0-1.584-.478Q1 13.043 1 12.105v-8.21q0-.939.537-1.417T3.12 2z"></path>
                          <path fill="#2468F2" d="M5 8.01a.57.57 0 0 0 .172.428q.172.165.435.166H7.4v1.795q0 .264.165.432.165.17.43.169.27 0 .439-.169A.59.59 0 0 0 8.6 10.4V8.604h1.8a.6.6 0 0 0 .43-.166.57.57 0 0 0 .17-.428.6.6 0 0 0-.169-.438.59.59 0 0 0-.432-.169H8.6v-1.79a.6.6 0 0 0-.168-.437.58.58 0 0 0-.44-.175.56.56 0 0 0-.429.175.61.61 0 0 0-.165.438v1.79H5.607a.6.6 0 0 0-.435.168A.59.59 0 0 0 5 8.01"></path>
                        </g>
                      </svg>
                    </span>
                    <span>节点</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button className="text-slate-700 text-sm" title="折叠节点" style={{ cursor: "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path fill="#141A25" d="M8.004 1a.72.72 0 0 0-.484.165.54.54 0 0 0-.192.426v1.841l.053 1.39-1.99-1.907a.54.54 0 0 0-.221-.13 1 1 0 0 0-.259-.038.67.67 0 0 0-.47.168.54.54 0 0 0-.183.417.5.5 0 0 0 .056.238.8.8 0 0 0 .17.218L7.5 6.495q.105.101.233.155a.7.7 0 0 0 .536 0 .8.8 0 0 0 .237-.155l3.017-2.707a.8.8 0 0 0 .17-.218.5.5 0 0 0 .056-.238.54.54 0 0 0-.184-.417.67.67 0 0 0-.47-.168 1 1 0 0 0-.258.037.54.54 0 0 0-.222.131l-1.99 1.908.046-1.39V1.59a.54.54 0 0 0-.188-.426.7.7 0 0 0-.48-.165M1 8q0 .262.184.43a.68.68 0 0 0 .477.168h12.686q.284 0 .47-.168A.56.56 0 0 0 15 8a.57.57 0 0 0-.184-.433.66.66 0 0 0-.47-.172H1.662a.67.67 0 0 0-.477.172A.57.57 0 0 0 1 8m7.004 7a.7.7 0 0 0 .48-.168.55.55 0 0 0 .188-.43v-1.841l-.045-1.384 1.99 1.901a.54.54 0 0 0 .22.131 1 1 0 0 0 .26.037q.285 0 .469-.168a.54.54 0 0 0 .184-.416.5.5 0 0 0-.057-.239.8.8 0 0 0-.169-.218L8.507 9.498a.75.75 0 0 0-.503-.208.7.7 0 0 0-.27.053.8.8 0 0 0-.233.155l-3.018 2.707a.8.8 0 0 0-.169.218.5.5 0 0 0-.056.239q0 .248.184.416a.67.67 0 0 0 .469.168q.135 0 .259-.037a.54.54 0 0 0 .221-.13l1.99-1.902-.053 1.384v1.841q0 .262.192.43a.7.7 0 0 0 .484.168"></path>
                    </svg>
                  </button>
                  <button className="text-slate-700 text-sm" title="切换折线" style={{ cursor: "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <g fill="none" fillRule="evenodd">
                        <path fill="#151B26" fillRule="nonzero" d="M16.588 5a.6.6 0 0 1 .098 1.192l-.098.008c-2.599 0-3.369.515-4.461 2.622l-.428.835c-.619 1.193-1.245 1.99-2.118 2.473.873.483 1.497 1.28 2.118 2.474l.15.292.132.258.146.284c1.092 2.107 1.862 2.622 4.461 2.622l.098.008a.6.6 0 0 1-.098 1.192c-3.068 0-4.237-.781-5.526-3.27l-.148-.287-.132-.257-.147-.288C9.669 13.302 8.88 12.73 6.6 12.73h.043H6.6a.6.6 0 1 1 0-1.2h.052H6.6c2.281 0 3.069-.571 4.035-2.427.071-.138.355-.696.427-.833C12.352 5.782 13.52 5 16.588 5"></path>
                        <path d="M0 0h24v24H0z"></path>
                      </g>
                    </svg>
                  </button>
                  <button className="text-slate-700 text-sm" title="注释" style={{ cursor: "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path fill="#000" d="M7.097 18.312a1.6 1.6 0 0 1-1.6-1.6v-5.7a.6.6 0 1 1 1.2 0v5.7c0 .22.18.4.4.4h6.053V14.25a1.1 1.1 0 0 1 1.1-1.1h2.86V7.1a.4.4 0 0 0-.4-.4h-5.253a.6.6 0 1 1 0-1.2h5.253a1.6 1.6 0 0 1 1.6 1.6v7.07c0 .425-.17.833-.47 1.133l-2.54 2.54a1.6 1.6 0 0 1-1.131.468zm1.032-7.548a.6.6 0 0 1-.6-.6V8.731H6.1a.6.6 0 1 1 0-1.199h1.43V6.1a.6.6 0 1 1 1.2 0v1.432h1.435a.6.6 0 1 1 0 1.2H8.728v1.432a.6.6 0 0 1-.6.6m6.22 6.303a.4.4 0 0 0 .103-.073l2.54-2.54a.4.4 0 0 0 .073-.103H14.35z"></path>
                    </svg>
                  </button>
                  <button className="text-slate-700 text-sm" title="优化布局" onClick={autoLayout} style={{ cursor: "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#151B26" d="M6.357 11.5q-.681 0-1.02-.348-.336-.347-.337-1.062V7.405q0-.715.338-1.06T6.358 6h1.295q.682 0 1.02.344.338.345.338 1.061v2.684q0 .716-.338 1.063t-1.02.347zm.008-1.06H7.64q.165 0 .249-.088.083-.087.083-.261v-2.69q0-.171-.083-.257-.084-.084-.249-.085H6.365q-.165 0-.245.085-.081.086-.081.258v2.689q0 .174.08.261.081.088.246.088m4.989 1.06q-.687 0-1.022-.348-.336-.347-.335-1.063V7.405q0-.715.335-1.06T11.354 6h1.297q.68 0 1.019.344.337.345.337 1.061v2.684q0 .716-.337 1.063-.339.347-1.019.347zm.008-1.06h1.281q.164 0 .245-.088.08-.087.08-.261v-2.69q0-.171-.08-.257-.081-.084-.245-.085h-1.281q-.165 0-.246.085t-.08.258v2.689q0 .174.08.261.081.088.246.088m4.989 1.06q-.687 0-1.024-.348-.339-.347-.339-1.063V7.405q0-.715.339-1.06Q15.664 6 16.351 6h1.292q.685 0 1.021.344.336.345.336 1.061v2.684q0 .716-.336 1.063t-1.021.347zm.003-1.06h1.28q.164 0 .245-.088.081-.087.081-.261v-2.69q0-.171-.08-.257-.082-.084-.245-.085h-1.281q-.164 0-.245.085t-.08.258v2.689q0 .174.08.261t.245.088M6.357 18q-.681 0-1.02-.345-.336-.345-.337-1.061v-2.689q0-.71.338-1.058.338-.347 1.02-.347h1.295q.682 0 1.02.347.338.348.338 1.058v2.689q0 .716-.338 1.061T7.653 18zm.008-1.06H7.64q.165 0 .249-.085t.083-.258v-2.69q0-.177-.083-.262-.084-.086-.249-.086H6.365q-.165 0-.245.086-.081.085-.081.263v2.689q0 .172.08.258.081.086.246.086zM11.354 18q-.687 0-1.022-.345-.336-.345-.335-1.061v-2.689q0-.71.335-1.058.335-.347 1.022-.347h1.297q.68 0 1.019.347.337.348.337 1.058v2.689q0 .716-.337 1.061-.339.345-1.019.345zm.008-1.06h1.281q.164 0 .245-.085t.08-.258v-2.69q0-.177-.08-.262-.081-.086-.245-.086h-1.281q-.165 0-.246.086t-.08.263v2.689q0 .172.08.258.081.086.246.086zM16.35 18q-.687 0-1.024-.345-.339-.345-.339-1.061v-2.689q0-.71.339-1.058.337-.347 1.024-.347h1.292q.685 0 1.021.347.336.348.336 1.058v2.689q0 .716-.336 1.061T17.642 18zm.003-1.06h1.28q.165 0 .245-.085.081-.085.081-.258v-2.69q0-.177-.08-.262-.082-.086-.245-.086h-1.281q-.165 0-.245.086t-.08.263v2.689q0 .172.08.258t.245.086z"></path>
                    </svg>
                  </button>
                  <button className="text-slate-700 text-sm" title="居中视图" onClick={centerView} style={{ cursor: "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <path fill="#151B26" d="M5.638 14.369q.645 0 .644.645v1.637q0 .537.273.805.274.27.78.269h1.679q.651 0 .652.637 0 .638-.652.638h-1.73q-1.131 0-1.707-.566Q5 17.867 5 16.744v-1.73q0-.645.638-.645m12.724 0q.638 0 .638.645v1.73q0 1.117-.573 1.686-.573.57-1.712.57h-1.729q-.645 0-.645-.638 0-.637.645-.637h1.678q.508 0 .784-.269.277-.268.277-.805v-1.637q0-.645.637-.645M13 9a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zm0 1.2h-2a.8.8 0 0 0-.8.8v2a.8.8 0 0 0 .8.8h2a.8.8 0 0 0 .8-.8v-2a.8.8 0 0 0-.8-.8M9.014 5q.651 0 .652.644 0 .638-.652.638H7.335q-.506 0-.78.269-.273.268-.273.805v1.637q0 .645-.644.645Q5 9.638 5 8.993V7.257q0-1.118.577-1.687Q6.152 5 7.284 5zm7.7 0q1.14 0 1.713.57T19 7.257v1.736q0 .645-.638.645-.637 0-.637-.645V7.356q0-.537-.277-.805-.277-.27-.784-.269h-1.678q-.645 0-.645-.638 0-.644.645-.644z"></path>
                    </svg>
                  </button>
                  <span className="text-slate-700 text-sm">50%</span>
                  <span className="text-slate-300">|</span>
                  <button className="flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white" style={{ cursor: "pointer" }}>
                    <span className="h-3.5 w-3.5" aria-hidden>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="12">
                        <g fill="none" fillRule="evenodd">
                          <path d="M-1-2h16v16H-1z"></path>
                          <path fill="currentColor" fillRule="nonzero" d="M6.217 8.566h-.724L3.89 9.916a2.7 2.7 0 0 1-.455.322.9.9 0 0 1-.407.1q-.311 0-.486-.19t-.175-.518V8.566h-.17q-.67 0-1.163-.256a1.8 1.8 0 0 1-.764-.738Q0 7.09 0 6.42V2.9q0-.671.266-1.154a1.8 1.8 0 0 1 .769-.738Q1.537.75 2.25.75h5.96q.714 0 1.217.257.503.256.769.738t.266 1.154v.74H9.416v-.694q0-.591-.31-.893t-.94-.303h-5.87q-.633 0-.942.303-.308.302-.308.893v3.428q0 .59.308.892.309.301.942.301h.582q.205 0 .305.09c.1.09.1.16.1.3v1.265L4.77 7.825a.9.9 0 0 1 .295-.207 1 1 0 0 1 .362-.052h.393z"></path>
                          <path fill="currentColor" fillRule="nonzero" d="M7.392 9.9q-.676 0-1.15-.23a1.63 1.63 0 0 1-.722-.662q-.248-.435-.248-1.05V5.324q0-.632.248-1.08.25-.445.722-.681.474-.236 1.15-.236h4.487q.678 0 1.15.236.473.235.722.682.249.446.249 1.079v2.632q0 .618-.242 1.05a1.6 1.6 0 0 1-.702.664q-.46.228-1.12.229h-.083v.998q0 .321-.174.513a.62.62 0 0 1-.482.193.86.86 0 0 1-.406-.11 3 3 0 0 1-.45-.31L8.773 9.9z"></path>
                          <path stroke="#FFF" strokeLinecap="round" d="M7.876 5.827h3.613M7.886 7.576h2.742"></path>
                        </g>
                      </svg>
                    </span>
                    <span>调试</span>
                  </button>
                </div>
              </div>
              {showNodePalette ? (
                <div
                  className="absolute inset-0 z-20 flex items-end justify-center bg-black/10"
                  onClick={() => setShowNodePalette(false)}
                >
                  <div
                    className="mb-16 w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <input
                        placeholder="搜索节点、工具或Agent"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                      />
                    </div>
                    <PaletteList />
                  </div>
                </div>
              ) : null}
            </div>
            {showInspector && selectedNode ? (
              <aside className="w-[400px] border-l border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      属性面板
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedNode ? selectedNode.data.title : "未选择节点"}
                    </div>
                  </div>
                  <button
                    className="text-sm text-slate-500"
                    onClick={() => {
                      setSelectedNode(null);
                      setShowInspector(false);
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="h-[calc(100vh-56px-52px)] overflow-auto p-4">
                  <NodeInspector node={selectedNode} />
                </div>
              </aside>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
