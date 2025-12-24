import type { WorkflowNode } from "../../types";
import { formatValue, isNodeType } from "../../utils";

interface InspectorNodeProps {
  node: WorkflowNode;
}

export function InspectorNode({ node }: InspectorNodeProps) {
  const raw = node.data.raw ?? {};
  const type = raw?.type;

  if (type === "start") {
    return <StartInspector raw={raw} />;
  }
  if (type === "service_http" || type === "api") {
    return <ApiInspector raw={raw} />;
  }
  if (type === "intention") {
    return <IntentionInspector raw={raw} />;
  }
  if (type === "chat") {
    return <ChatInspector raw={raw} />;
  }
  if (type === "code") {
    return <CodeInspector raw={raw} />;
  }
  if (type === "message") {
    return <MessageInspector raw={raw} />;
  }
  if (type === "loop") {
    return <LoopInspector raw={raw} />;
  }
  if (type === "branch" || type === "switch") {
    return <BranchInspector />;
  }
  if (type === "llm") {
    return <LlmInspector raw={raw} />;
  }
  if (type === "end") {
    return <EndInspector raw={raw} />;
  }
  return <div className="text-xs text-slate-500">暂不支持的节点类型：{type}</div>;
}

function StartInspector({ raw }: { raw: unknown }) {
  const systemParams = raw?.data?.inputs?.length > 0
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
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">输入</div>
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

function ApiInspector({ raw }: { raw: unknown }) {
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
              <span className="font-semibold text-slate-800">{item?.name ?? "-"}</span>
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
            <span className="font-semibold text-slate-800">{item?.name ?? "-"}</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item?.type ?? ""}
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

function IntentionInspector({ raw }: { raw: unknown }) {
  const intentions = raw?.data?.settings?.intentions ?? [];
  
  return (
    <div className="space-y-4 text-xs">
      <div className="text-sm font-semibold text-slate-900">意图识别</div>
      <p className="text-xs text-slate-500">识别用户的输入意图，并分配到不同分支执行。</p>

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
                  <span className="text-xs font-semibold">意图名称 *</span>
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
              <input type="checkbox" className="peer sr-only" defaultChecked={!!raw?.data?.settings?.model?.chat_history} />
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
            <span className="font-semibold text-slate-800">{item?.name ?? "-"}</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item?.type ?? ""}
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

function ChatInspector({ raw }: { raw: unknown }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="text-sm font-semibold text-slate-900">信息收集</div>
      <p className="text-xs text-slate-500">支持在该节点向用户提问，等待用户回复，将用户回复内容及抽取的信息作为输出参数。</p>

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
            <input type="checkbox" className="peer sr-only" defaultChecked={!!raw?.data?.settings?.streaming} />
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
              <input type="checkbox" className="peer sr-only" defaultChecked={!!raw?.data?.settings?.model?.chat_history} />
              <div className="h-5 w-9 rounded-full bg-slate-200 transition peer-checked:bg-indigo-500"></div>
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></div>
            </label>
          </label>
        </div>
      </Section>

      <Section title="输出">
        {(raw?.data?.outputs ?? []).map((item: any) => (
          <div key={item?.name} className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{item?.name ?? "-"}</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item?.type ?? ""}
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

function CodeInspector({ raw }: { raw: unknown }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="text-sm font-semibold text-slate-900">代码</div>
      <p className="text-xs text-slate-500">编写代码，处理输入输出变量来生成返回值。</p>

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
              defaultValue={item?.value?.type === "literal" ? String(item?.value?.content ?? "") : formatValue(item?.value)}
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

function MessageInspector({ raw }: { raw: unknown }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="text-sm font-semibold text-slate-900">消息</div>
      <p className="text-xs text-slate-500">支持在工作流运行过程中发送消息输出。</p>

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
            <input type="checkbox" className="peer sr-only" defaultChecked={!!raw?.data?.settings?.streaming} />
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

function LoopInspector({ raw }: { raw: unknown }) {
  return (
    <div className="space-y-4 text-xs">
      <div className="text-sm font-semibold text-slate-900">循环</div>
      <p className="text-xs text-slate-500">通过设定条件或循环次数，实现容器中流程的重复执行。</p>

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
        <div className="mt-2 text-xs text-slate-500">{"{x} 循环变量"}</div>
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

function BranchInspector() {
  return (
    <div className="space-y-4 text-xs">
      <div className="text-sm font-semibold text-slate-900">分支器</div>
      <p className="text-xs text-slate-500">连接多个下游分支节点，若设定条件成立则运行对应的条件分支，若均不成立则运行"否则"分支。</p>

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

function LlmInspector({ raw }: { raw: unknown }) {
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
              <span className="font-semibold text-slate-800">{item?.name ?? "-"}{item?.required ? "*" : ""}</span>
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
            <span className="font-semibold text-slate-800">{item?.name ?? "-"}</span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item?.type ?? ""}
            </span>
          </div>
        ))}
      </Section>
    </div>
  );
}

function EndInspector({ raw }: { raw: unknown }) {
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
              <span className="font-semibold text-slate-800">{item?.name ?? "-"}</span>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-700">{title}</div>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}
