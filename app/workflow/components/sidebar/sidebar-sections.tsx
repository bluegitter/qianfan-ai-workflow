import type { SectionState } from "../../types";

interface SidebarSectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  extra?: React.ReactNode;
  content: React.ReactNode;
}

export function SidebarSection({ title, open, onToggle, extra, content }: SidebarSectionProps) {
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

interface PaletteItemProps {
  label: string;
  color: string;
}

export function PaletteItem({ label, color }: PaletteItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-800">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>
        {label.slice(0, 1)}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function PaletteList() {
  return (
    <div className="grid grid-cols-1 gap-3 text-sm">
      <div>
        <div className="mb-2 text-xs font-semibold text-slate-500">理解&思考&生成</div>
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

export function AppConfigSidebar({ 
  appSectionOpen, 
  setAppSectionOpen 
}: { 
  appSectionOpen: SectionState;
  setAppSectionOpen: React.Dispatch<React.SetStateAction<SectionState>>;
}) {
  return (
    <div className="h-[calc(100vh-56px-52px)] overflow-auto p-4 text-sm">
      <SidebarSection
        title="基本信息"
        open={appSectionOpen.basic}
        onToggle={() => setAppSectionOpen((s) => ({ ...s, basic: !s.basic }))}
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
        onToggle={() => setAppSectionOpen((s) => ({ ...s, memory: !s.memory }))}
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
        onToggle={() => setAppSectionOpen((s) => ({ ...s, voice: !s.voice }))}
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
        onToggle={() => setAppSectionOpen((s) => ({ ...s, opening: !s.opening }))}
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
        onToggle={() => setAppSectionOpen((s) => ({ ...s, suggest: !s.suggest }))}
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
        onToggle={() => setAppSectionOpen((s) => ({ ...s, followup: !s.followup }))}
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
        onToggle={() => setAppSectionOpen((s) => ({ ...s, background: !s.background }))}
        extra={<span className="text-lg text-slate-500">+</span>}
        content={
          <p className="text-xs text-slate-500">
            上传聊天背景图片，提供更沉浸的对话体验
          </p>
        }
      />
    </div>
  );
}
