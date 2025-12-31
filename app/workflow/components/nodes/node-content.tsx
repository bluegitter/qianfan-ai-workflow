import type { NodeProps } from "reactflow";
import { useRef, RefObject } from "react";
import type { QfNodeData, NodeInput, NodeOutput } from "../../types";
import { formatValue } from "../../utils";
import { renderNodeIcon } from "../node-icons";
import { Position, Handle } from "reactflow";
// 不再需要动态导入

interface IntentionOutputPortsProps {
  intentions: Array<{
    meta?: { id?: string };
    name?: string;
  }>;
  otherHandleId?: string;
  isConnectable?: boolean;
}

export function IntentionOutputPorts({ intentions, otherHandleId, isConnectable = true }: IntentionOutputPortsProps) {
  const FIRST_OFFSET = 191;
  const GAP = 40;
  const tops = intentions.map((_, idx) => FIRST_OFFSET + idx * GAP);
  const otherTop = FIRST_OFFSET + intentions.length * GAP;
  const otherId = otherHandleId ? `intention-${otherHandleId}` : "intention--1";

  const handleStyles = { background: "#f97316", width: 8, height: 8 };

  return (
    <>
      {intentions.map((intention, idx) => (
        <Handle
          key={`intention-${intention?.meta?.id || idx}`}
          id={`intention-${intention?.meta?.id || idx}`}
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          style={{
            top: tops[idx],
            ...handleStyles,
          }}
        />
      ))}
      <Handle
        id={otherId}
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{
          top: otherTop,
          background: "#94a3b8",
          width: 8,
          height: 8,
        }}
      />
    </>
  );
}

export interface NodeContentProps extends NodeProps<QfNodeData> {
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

export function NodeContent({ data, selected, isStart, isApi, isLlm, isEnd, isIntention, isChat, isMessage, isCode, isLoop, isBranch, isWorkflow, isConnectable }: NodeContentProps) {
  const cardClass = selected
    ? "border-sky-300 shadow-md shadow-sky-50"
    : "border-slate-200";

  const cardRef = useRef<HTMLDivElement>(null);
  const intentionListRef = useRef<HTMLDivElement>(null);

  const startInputs = isStart
    ? ((data as any).raw?.data?.inputs?.length
        ? (data as any).raw.data.inputs.map((item: NodeInput) => ({
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
    <div 
      ref={cardRef} 
      className={`rounded-lg border bg-white px-4 py-3 shadow-sm ${cardClass}`}
      style={{ position: 'relative' }}
    >
      {!isStart && (
        <Handle
          id="input"
          type="target"
          position={Position.Left}
          isConnectable={isConnectable ?? true}
          style={{ top: "50%", transform: "translateY(-50%)" }}
          className="react-flow__handle-left"
        />
      )}
      
      <NodeHeader data={data} isIntention={isIntention} isLoop={isLoop} isBranch={isBranch} isWorkflow={isWorkflow} />
      
      {data.description && (
        <p className="mt-2 text-xs leading-5 text-slate-600">{data.description}</p>
      )}

      {isStart && <StartNodeContent inputs={startInputs} />}
      {isApi && <ApiNodeContent data={data} />}
      {isIntention && <IntentionNodeContent data={data} intentionListRef={intentionListRef} />}
      {isChat && <ChatNodeContent data={data} />}
      {isMessage && <MessageNodeContent data={data} />}
      {isCode && <CodeNodeContent data={data} />}
      {isLoop && <LoopNodeContent data={data} />}
      {isBranch && <BranchNodeContent />}
      {isWorkflow && <WorkflowNodeContent data={data} />}
      {isLlm && <LlmNodeContent data={data} />}
      {isEnd && <EndNodeContent data={data} />}
      
      {/* 为意图识别节点添加多个输出端口 */}
      {isIntention ? (
        <IntentionOutputPorts
          intentions={(data as any).raw?.data?.settings?.intentions ?? []}
          otherHandleId={(data as any).raw?.data?.settings?.meta?.unmatedIntention?.id ?? "-1"}
          isConnectable={isConnectable ?? true}
        />
      ) : (
        !isEnd && (
          <Handle
            id="output"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable ?? true}
            style={{ top: "50%", transform: "translateY(-50%)" }}
            className="react-flow__handle-right"
          />
        )
      )}
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
          {renderNodeIcon((data as any).raw?.type)}
          <span>{data.title}</span>
          {isIntention && (
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              极速
            </span>
          )}
          {isLoop && (
            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
              {(data as any).raw?.data?.settings?.loop_type === "array" ? "数组循环" : "循环"}
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
        {(data as any).raw?.type ?? "node"}
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
        inputs={(data as any).raw?.data?.inputs} 
        outputs={(data as any).raw?.data?.outputs}
        showValues 
      />
    </div>
  );
}

function IntentionNodeContent({ data, intentionListRef }: { data: QfNodeData; intentionListRef?: RefObject<HTMLDivElement | null> }) {
  const intentions = (data as any).raw?.data?.settings?.intentions ?? [];
  const inputs = (data as any).raw?.data?.inputs;
  const outputs = (data as any).raw?.data?.outputs;
  
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection inputs={inputs} showValues />
      <div className="rounded-md bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">意图</div>
        <div className="mt-2 space-y-2" ref={intentionListRef}>
          {intentions.map((it: any, idx: number) => (
            <div
              key={it?.meta?.id ?? idx}
              data-intention-index={idx}
              className="flex items-center justify-between rounded bg-white px-2 py-2 text-xs text-slate-700"
            >
              <span className="flex items-center gap-2">
                <span className="text-slate-500">{idx}</span>
                <span>{it?.name ?? "意图"}</span>
              </span>
              <div className="flex items-center gap-2">
                {/* 输出端口指示器 */}
                <div 
                  className="w-2 h-2 rounded-full bg-orange-500"
                  title={`输出端口: ${it?.name ?? '意图'} ${idx}`}
                />
                <span className="text-sky-600 font-semibold">+</span>
              </div>
            </div>
          ))}
          <div 
            data-intention-other
            className="flex items-center justify-between rounded bg-white px-2 py-2 text-xs text-slate-500"
          >
            <span className="flex items-center gap-2">
              <span className="text-slate-500">-1</span>
              <span>其他意图</span>
            </span>
            <div className="flex items-center gap-2">
              {/* 其他意图输出端口指示器 */}
              <div 
                className="w-2 h-2 rounded-full bg-slate-400"
                title="输出端口: 其他意图"
              />
              <span className="text-sky-600 font-semibold">+</span>
            </div>
          </div>
        </div>
      </div>
      <InputOutputSection outputs={outputs} />
    </div>
  );
}

function ChatNodeContent({ data }: { data: QfNodeData }) {
  const firstInput = (data as any).raw?.data?.inputs?.[0];
  
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
          {(data as any).raw?.data?.settings?.question_template || "未填写提问内容"}
        </div>
      </div>
      <InputOutputSection outputs={(data as any).raw?.data?.outputs} />
    </div>
  );
}

function MessageNodeContent({ data }: { data: QfNodeData }) {
  const firstInput = (data as any).raw?.data?.inputs?.[0];
  
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
          {(data as any).raw?.data?.settings?.message_template || "未填写消息模板"}
        </div>
      </div>
    </div>
  );
}

function CodeNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection 
        inputs={(data as any).raw?.data?.inputs} 
        outputs={(data as any).raw?.data?.outputs}
        showValues 
      />
    </div>
  );
}

function LoopNodeContent({ data }: { data: QfNodeData }) {
  const firstInput = (data as any).raw?.data?.inputs?.[0];
  
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
          {(data as any).raw?.data?.settings?.component || (data as any).raw?.component || (data as any).raw?.id || "未配置子流程文件"}
        </div>
      </div>
    </div>
  );
}

function LlmNodeContent({ data }: { data: QfNodeData }) {
  return (
    <div className="mt-3 space-y-3">
      <InputOutputSection 
        inputs={(data as any).raw?.data?.inputs} 
        outputs={(data as any).raw?.data?.outputs}
        showValues 
      />
      <div className="rounded-md bg-slate-50 p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>提示词</span>
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
            {(data as any).raw?.data?.settings?.model_name ?? "LLM"}
          </span>
        </div>
        <div className="mt-2 rounded bg-white px-3 py-2 text-xs text-slate-700">
          <div className="text-[11px] text-slate-500">用户提示词</div>
          <pre className="mt-1 whitespace-pre-wrap break-words text-[11px]">
            {(data as any).raw?.data?.settings?.prompt ?? ""}
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
          {((data as any).raw?.data?.inputs ?? []).map((item: NodeInput, index: number) => (
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
          {(data as any).raw?.data?.settings?.content ?? ""}
        </div>
      </div>
    </div>
  );
}
