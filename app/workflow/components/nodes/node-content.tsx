import type { NodeProps } from "reactflow";
import type { QfNodeData, NodeInput, NodeOutput } from "../../types";
import { formatValue } from "../../utils";
import { renderNodeIcon } from "../node-icons";
import { Position, Handle } from "reactflow";

interface NodeContentProps extends NodeProps<QfNodeData> {
  isStart: boolean;
  isApi: boolean;
  isLlm: boolean;
  isEnd: boolean;
  isIntention: boolean;
  isChat: boolean;
  isMessage: boolean;
  isCode: boolean;
  isLoop: boolean;
  isBranch: boolean;
  isWorkflow: boolean;
}

export function NodeContent({ data, selected, isStart, isApi, isLlm, isEnd, isIntention, isChat, isMessage, isCode, isLoop, isBranch, isWorkflow }: NodeContentProps) {
  const cardClass = selected
    ? "border-sky-300 shadow-md shadow-sky-50"
    : "border-slate-200";

  const startInputs = isStart 
    ? (data.raw?.data?.inputs?.length 
        ? data.raw.data.inputs.map((item: NodeInput) => ({
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
          ])
    : [];

  return (
    <div className={`rounded-lg border bg-white px-4 py-3 shadow-sm ${cardClass}`}>
      {!isStart && <Handle id="input" type="target" position={Position.Left} />}
      
      <NodeHeader data={data} isIntention={isIntention} isLoop={isLoop} isBranch={isBranch} isWorkflow={isWorkflow} />
      
      {data.description && (
        <p className="mt-2 text-xs leading-5 text-slate-600">{data.description}</p>
      )}

      {isStart && <StartNodeContent inputs={startInputs} />}
      {isApi && <ApiNodeContent data={data} />}
      {isIntention && <IntentionNodeContent data={data} />}
      {isChat && <ChatNodeContent data={data} />}
      {isMessage && <MessageNodeContent data={data} />}
      {isCode && <CodeNodeContent data={data} />}
      {isLoop && <LoopNodeContent data={data} />}
      {isBranch && <BranchNodeContent />}
      {isWorkflow && <WorkflowNodeContent data={data} />}
      {isLlm && <LlmNodeContent data={data} />}
      {isEnd && <EndNodeContent data={data} />}
      
      {!isEnd && <Handle id="output" type="source" position={Position.Right} />}
    </div>
  );
}

interface NodeHeaderProps {
  data: QfNodeData;
  isIntention: boolean;
  isLoop: boolean;
  isBranch: boolean;
  isWorkflow: boolean;
}

function NodeHeader({ data, isIntention, isLoop, isBranch, isWorkflow }: NodeHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          {renderNodeIcon(data.raw?.type)}
          <span>{data.title}</span>
          {isIntention && (
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              极速
            </span>
          )}
          {isLoop && (
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              {data.raw?.data?.settings?.loop_type === "array" ? "数组循环" : "循环"}
            </span>
          )}
          {isBranch && (
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              条件分支
            </span>
          )}
          {isWorkflow && (
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              子流程
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">{data.subtitle}</div>
      </div>
      <span className="rounded bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-600">
        {data.raw?.type ?? "node"}
      </span>
    </div>
  );
}

interface InputOutputSectionProps {
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  showValues?: boolean;
}

function InputOutputSection({ inputs, outputs, showValues = false }: InputOutputSectionProps) {
  return (
    <>
      {inputs && inputs.length > 0 && (
        <div className="rounded-md bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-600">输入</div>
          <div className="mt-2 space-y-1">
            {inputs.map((item, index) => (
              <div
                key={item?.name ?? index}
                className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs"
              >
                <div className="flex items-center gap-2 text-amber-700">
                  <span className="font-semibold">{item?.name ?? "-"}</span>
                  {item?.required && <span>*</span>}
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {item?.type ?? "unknown"}
                  </span>
                </div>
                {showValues && (
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-700">
                    {formatValue(item?.value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {outputs && outputs.length > 0 && (
        <div className="rounded-md bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-600">输出</div>
          <div className="mt-2 space-y-1">
            {outputs.map((item, index) => (
              <div key={item?.name ?? index} className="flex items-center gap-2 text-xs text-amber-700">
                <span className="font-semibold">{item?.name ?? "-"}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                  {item?.type ?? "unknown"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StartNodeContent({ inputs }: { inputs: Array<{ name: string; type: string }> }) {
  return (
    <div className="mt-3 rounded-md bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-600">输入</div>
      <div className="mt-2 space-y-1">
        {inputs.map((item) => (
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
  );
}

function ApiNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection 
        inputs={data.raw?.data?.inputs} 
        outputs={data.raw?.data?.outputs}
        showValues 
      />
    </div>
  );
}

function IntentionNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection 
        inputs={data.raw?.data?.inputs} 
        outputs={data.raw?.data?.outputs}
        showValues 
      />
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">意图</div>
        <div className="mt-2 space-y-2">
          {(data.raw?.data?.settings?.intentions ?? []).map((it: any, idx: number) => (
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
          ))}
          <div className="flex items-center justify-between rounded bg-white px-2 py-2 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="text-slate-500">-1</span>
              <span>其他意图</span>
            </span>
            <span className="text-sky-600 font-semibold">+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatNodeContent({ data }: { data: QfNodeData }) {
  const firstInput = data.raw?.data?.inputs?.[0];
  
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">输入</div>
        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-700">
            <span className="font-semibold">{firstInput?.name || "未命名"}</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {firstInput?.type || "String"}
            </span>
          </div>
          <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-500">
            {formatValue(firstInput?.value) || "未选择"}
          </span>
        </div>
      </div>
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">提问内容</div>
        <div className="mt-2 text-xs text-slate-500">
          {data.raw?.data?.settings?.question_template || "未填写提问内容"}
        </div>
      </div>
      <InputOutputSection outputs={data.raw?.data?.outputs} />
    </div>
  );
}

function MessageNodeContent({ data }: { data: QfNodeData }) {
  const firstInput = data.raw?.data?.inputs?.[0];
  
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">输出</div>
        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-700">
            <span className="font-semibold">{firstInput?.name || "output"}</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {firstInput?.type || "String"}
            </span>
          </div>
          <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-500">
            {formatValue(firstInput?.value) || "未选择"}
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
  );
}

function CodeNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection 
        inputs={data.raw?.data?.inputs} 
        outputs={data.raw?.data?.outputs}
        showValues 
      />
    </div>
  );
}

function LoopNodeContent({ data }: { data: QfNodeData }) {
  const firstInput = data.raw?.data?.inputs?.[0];
  
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">循环数组</div>
        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-700">
            <span className="font-semibold">
              {firstInput?.name || "未命名"}
              {firstInput?.required ? "*" : ""}
            </span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {firstInput?.type || "list"}
            </span>
          </div>
          <span className="rounded bg-white px-2 py-0.5 text-[11px] text-slate-500">
            {formatValue(firstInput?.value) || "未选择"}
          </span>
        </div>
      </div>
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">输出</div>
      </div>
    </div>
  );
}

function BranchNodeContent() {
  return (
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
  );
}

function WorkflowNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">引用子流程</div>
        <div className="mt-2 text-xs text-slate-500">
          {data.raw?.data?.settings?.component || data.raw?.component || data.raw?.id || "未配置子流程文件"}
        </div>
      </div>
    </div>
  );
}

function LlmNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection 
        inputs={data.raw?.data?.inputs} 
        outputs={data.raw?.data?.outputs}
        showValues 
      />
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
    </div>
  );
}

function EndNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">输出</div>
        <div className="mt-2 space-y-1">
          {(data.raw?.data?.inputs ?? []).map((item: NodeInput, index) => (
            <div
              key={item?.name ?? index}
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
  );
}
