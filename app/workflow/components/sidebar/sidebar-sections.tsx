import { useState } from "react";
import type { SectionState, NodeType } from "../../types";
import { renderNodeIcon } from "../node-icons";

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

const labelToType: Record<string, NodeType> = {
  大模型: "llm",
  智能体: "agent",
  组件: "component",
  API: "api",
  "MCP Server": "mcp",
  "函数计算 CFC": "code",
  意图识别: "intention",
  全局跳转: "jump",
  分支器: "branch",
  代码: "code",
  循环: "loop",
  跳出循环: "jump_out",
  参数聚合: "component",
  知识库: "knowledge",
  数据库: "database",
  记忆变量: "memory",
  文本处理: "text",
  Query改写: "text",
  流式数据处理: "stream",
  信息收集: "chat",
  消息节点: "message",
};

interface PaletteItemProps {
  label: string;
}

export function PaletteItem({ label }: PaletteItemProps) {
  const type = labelToType[label] ?? "component";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-[6px] h-8 text-sm text-slate-800">
      <span className="inline-flex h-6 w-6 items-center justify-center">
        {renderNodeIcon(type)}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function PaletteList() {
  const [searchQuery, setSearchQuery] = useState("");

  const allCategories = [
    {
      title: "理解&思考&生成",
      items: ["大模型", "智能体"]
    },
    {
      title: "工具引入",
      items: ["组件", "API", "MCP Server", "函数计算 CFC"]
    },
    {
      title: "业务逻辑",
      items: ["意图识别", "全局跳转", "分支器", "代码", "循环", "跳出循环", "参数聚合"]
    },
    {
      title: "信息&知识",
      items: ["知识库", "数据库", "记忆变量", "文本处理", "Query改写", "流式数据处理"]
    },
    {
      title: "输入&输出",
      items: ["信息收集", "消息节点"]
    }
  ];

  const filteredCategories = allCategories
    .map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => category.items.length > 0);

  return (
    <div className="grid grid-cols-1 gap-3 text-sm px-2 py-4">
      <div className="relative">
        <input
          type="text"
          placeholder="搜索节点、工具或Agent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm text-slate-700 outline-none focus:border-indigo-400"
        />
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <path fill="currentColor" d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
        </svg>
      </div>
      
      {filteredCategories.map((category) => (
        <div key={category.title}>
          <div className="mb-2 text-xs font-semibold text-slate-500">{category.title}</div>
          <div className="grid grid-cols-2 gap-2">
            {category.items.map((item) => (
              <PaletteItem key={item} label={item} />
            ))}
          </div>
        </div>
      ))}
      
      {filteredCategories.length === 0 && (
        <div className="text-center text-slate-400 py-4">
          没有找到匹配的节点
        </div>
      )}
    </div>
  );
}

export function AppConfigSidebar({
  appSectionOpen,
  setAppSectionOpen,
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
