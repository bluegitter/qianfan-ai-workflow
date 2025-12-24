"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowInstance,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from "reactflow";
import type { Node } from "reactflow";
import { DEFAULT_WORKFLOW_FILE, LAYOUT_SPACING, NODE_DIMENSIONS, EDGE_MARKER_CONFIG } from "../constants";
import { loadWorkflowSchema, toReactFlowNodes, toReactFlowEdges } from "../utils";
import type { WorkflowNode, SectionState, NodeType } from "../types";
import { QfNode } from "./nodes";
import { ArrowBezier, edgeTypes } from "./edges";
import { InspectorNode } from "./inspector";
import { AppConfigSidebar, PaletteList } from "./sidebar";
import { renderNodeIcon } from "./node-icons";

const nodeTypes = { qfNode: QfNode };

export function WorkflowCanvas() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showAppConfig, setShowAppConfig] = useState(true);
  const [showInspector, setShowInspector] = useState(true);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  
  const [appSectionOpen, setAppSectionOpen] = useState<SectionState>({
    basic: false,
    memory: false,
    voice: false,
    opening: false,
    suggest: false,
    followup: false,
    background: false,
  });

  const loadWorkflow = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { schema, nodeNameMap } = await loadWorkflowSchema(DEFAULT_WORKFLOW_FILE);
      globalThis.nodeNameMap = nodeNameMap;
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
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
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
      const spacingX = LAYOUT_SPACING.X;
      const spacingY = LAYOUT_SPACING.Y;

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
        const y = ((idxInLayer + 0.5) / layer.length) * (layerMaxCount * spacingY);
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
            markerEnd: EDGE_MARKER_CONFIG,
          },
          eds,
        ),
      ),
    []
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
          setSelectedNode(node as WorkflowNode);
          setShowInspector(true);
        }}
        onPaneClick={() => {
          setSelectedNode(null);
          setShowInspector(false);
        }}
        onSelectionChange={(params) => {
          const n = params.nodes && params.nodes[0];
          if (n) {
            setSelectedNode(n as WorkflowNode);
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
      <Header onReload={loadWorkflow} />

      <div className="flex min-h-[calc(100vh-56px)]">
        {showAppConfig && (
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
            <AppConfigSidebar 
              appSectionOpen={appSectionOpen} 
              setAppSectionOpen={setAppSectionOpen}
            />
          </aside>
        )}

        <main className="relative flex flex-1">
          <div className="absolute inset-0 flex">
            <div className="flex-1 relative">
              {canvasContent}
              {!showAppConfig && (
                <button
                  className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white shadow"
                  onClick={() => setShowAppConfig(true)}
                  title="展开配置"
                >
                  <ExpandIcon />
                </button>
              )}
              <CanvasToolbar 
                onTogglePalette={() => setShowNodePalette((v) => !v)}
                onAutoLayout={autoLayout}
                onCenterView={centerView}
              />
              {showNodePalette && (
                <NodePalette onClose={() => setShowNodePalette(false)} />
              )}
            </div>
            {showInspector && selectedNode && (
              <aside className="w-[400px] border-l border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">属性面板</div>
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
                  <InspectorNode node={selectedNode} />
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Header({ onReload }: { onReload: () => void }) {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <header className="relative flex items-center justify-between border-b border-slate-200 bg-white px-6 h-14">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleGoBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
          title="返回"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z" fill="currentColor"/>
          </svg>
        </button>
        <div className="flex flex-col gap-0.5">
          <div className="text-base font-semibold text-slate-900 leading-tight">知识库问答工作流</div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 leading-tight">暂无短信推送 · 工作流Agent</div>
            <div className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 leading-tight">
              自动保存于 08:25:15
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-slate-600">
        <span>配置</span>
        <span>发布</span>
        <span>调优</span>
        <span>分析</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onReload}
          className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          重载
        </button>
        <button className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500">
          更新发布
        </button>
      </div>
    </header>
  );
}

function CanvasToolbar({ 
  onTogglePalette, 
  onAutoLayout, 
  onCenterView 
}: { 
  onTogglePalette: () => void;
  onAutoLayout: () => void;
  onCenterView: () => void;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-300 bg-white px-4 py-2 shadow-lg">
          <button
            style={{ cursor: "pointer" }}
            onClick={onTogglePalette}
            className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
          >
            <span className="h-4 w-4" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <g fill="none">
                  <path fill="#FFF" d="M3.121 2h9.758q1.041 0 1.581.478T15 3.895v8.21q0 .939-.54 1.417T12.879 14H3.121q-1.047 0-1.584-.478Q1 13.043 1 12.105v-8.21q0-.939.537-1.417T3.12 2z"></path>
                  <path fill="#2468F2" d="M5 8.01a.57.57 0 0 0 .172.428q.172.165.435.166H7.4l.868 4h2.606q.27 0 .439-.169A.59.59 0 0 0 8.6 10.4V8.604h1.8a.6.6 0 0 0 .43-.166.57.57 0 0 0 .17-.428.6.6 0 0 0-.169-.438.59.59 0 0 0-.432-.169H8.6v-1.79a.6.6 0 0 0-.168-.437.58.58 0 0 0-.44-.175.56.56 0 0 0-.429.175.61.61 0 0 0-.165.438v1.79H5.607a.6.6 0 0 0-.435.168A.59.59 0 0 0 5 8.01"></path>
                </g>
              </svg>
            </span>
            <span>节点</span>
          </button>
          <span className="text-slate-300">|</span>
          <button className="text-slate-700 text-sm" title="折叠节点" style={{ cursor: "pointer" }}>
            <CollapseIcon />
          </button>
          <button className="text-slate-700 text-sm" title="切换折线" style={{ cursor: "pointer" }}>
            <SwitchLineIcon />
          </button>
          <button className="text-slate-700 text-sm" title="注释" style={{ cursor: "pointer" }}>
            <CommentIcon />
          </button>
          <button className="text-slate-700 text-sm" title="优化布局" onClick={onAutoLayout} style={{ cursor: "pointer" }}>
            <LayoutIcon />
          </button>
          <button className="text-slate-700 text-sm" title="居中视图" onClick={onCenterView} style={{ cursor: "pointer" }}>
            <CenterIcon />
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
    </>
  );
}

function NodePalette({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center bg-black/10"
      onClick={onClose}
    >
      <div
        className="mb-16 w-96 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <PaletteList />
      </div>
    </div>
  );
}

function ExpandIcon() {
  return (
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
  );
}

function CollapseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <path fill="#141A25" d="M8.004 1a.72.72 0 0 0-.484.165.54.54 0 0 0-.192.426v1.841l.053 1.39-1.99-1.907a.54.54 0 0 0-.221-.13 1 1 0 0 0-.259-.038.67.67 0 0 0-.47.168.54.54 0 0 0-.183.417.5.5 0 0 0 .056.238.8.8 0 0 0 .17.218L7.5 6.495q.105.101.233.155a.7.7 0 0 0 .536 0 .8.8 0 0 0 .237-.155l3.017-2.707a.8.8 0 0 0 .17-.218.5.5 0 0 0 .056-.238.54.54 0 0 0-.184-.417.67.67 0 0 0-.47-.168 1 1 0 0 0-.258.037.54.54 0 0 0-.222.131l-1.99 1.908.046-1.39V1.59a.54.54 0 0 0-.188-.426.7.7 0 0 0-.48-.165M1 8q0 .262.184.43a.68.68 0 0 0 .477.168h12.686q.284 0 .47-.168A.56.56 0 0 0 15 8a.57.57 0 0 0-.184-.433.66.66 0 0 0-.47-.172H1.662a.67.67 0 0 0-.477.172A.57.57 0 0 0 1 8m7.004 7a.7.7 0 0 0 .48-.168.55.55 0 0 0 .188-.43v-1.841l-.045-1.384 1.99 1.901a.54.54 0 0 0 .22.131 1 1 0 0 0 .26.037q.285 0 .469-.168a.54.54 0 0 0 .184-.416.5.5 0 0 0-.057-.239.8.8 0 0 0-.169-.218L8.507 9.498a.75.75 0 0 0-.503-.208.7.7 0 0 0-.27.053.8.8 0 0 0-.233.155l-3.018 2.707a.8.8 0 0 0-.169.218.5.5 0 0 0-.056.239q0 .248.184.416a.67.67 0 0 0 .469.168q.135 0 .259-.037a.54.54 0 0 0 .221-.13l1.99-1.902-.053 1.384v1.841q0 .262.192.43a.7.7 0 0 0 .484.168"></path>
    </svg>
  );
}

function SwitchLineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <g fill="none" fillRule="evenodd">
        <path fill="#151B26" fillRule="nonzero" d="M16.588 5a.6.6 0 0 1 .098 1.192l-.098.008c-2.599 0-3.369.515-4.461 2.622l-.428.835c-.619 1.193-1.245 1.99-2.118 2.473.873.483 1.497 1.28 2.118 2.474l.15.292.132.258.146.284c1.092 2.107 1.862 2.622 4.461 2.622l.098.008a.6.6 0 0 1-.098 1.192c-3.068 0-4.237-.781-5.526-3.27l-.148-.287-.132-.257-.147-.288C9.669 13.302 8.88 12.73 6.6 12.73h.043H6.6a.6.6 0 1 1 0-1.2h.052H6.6c2.281 0 3.069-.571 4.035-2.427.071-.138.355-.696.427-.833C12.352 5.782 13.52 5 16.588 5"></path>
        <path d="M0 0h24v24H0z"></path>
      </g>
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path fill="#000" d="M7.097 18.312a1.6 1.6 0 0 1-1.6-1.6v-5.7a.6.6 0 1 1 1.2 0v5.7c0 .22.18.4.4.4h6.053V14.25a1.1 1.1 0 0 1 1.1-1.1h2.86V7.1a.4.4 0 0 0-.4-.4h-5.253a.6.6 0 1 1 0-1.2h5.253a1.6 1.6 0 0 1 1.6 1.6v7.07c0 .425-.17.833-.47 1.133l-2.54 2.54a1.6 1.6 0 0 1-1.131.468zm1.032-7.548a.6.6 0 0 1-.6-.6V8.731H6.1a.6.6 0 1 1 0-1.199h1.43V6.1a.6.6 0 1 1 1.2 0v1.432h1.435a.6.6 0 1 1 0 1.2H8.728v1.432a.6.6 0 0 1-.6.6m6.22 6.303a.4.4 0 0 0 .103-.073l2.54-2.54a.4.4 0 0 0 .073-.103H14.35z"></path>
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="#151B26" d="M6.357 11.5q-.681 0-1.02-.348-.336-.347-.337-1.062V7.405q0-.715.338-1.06T6.358 6h1.295q.682 0 1.02.344.338.345.338 1.061v2.684q0 .716-.338 1.063t-1.02.347zm.008-1.06H7.64q.165 0 .249-.088.083-.087.083-.261v-2.69q0-.171-.083-.257-.084-.084-.249-.085H6.365q-.165 0-.245.085-.081.086-.081.258v2.689q0 .174.08.261.081.088.246.088m4.989 1.06q-.687 0-1.022-.348-.336-.347-.335-1.063V7.405q0-.715.335-1.06T11.354 6h1.297q.68 0 1.019.344.337.345.337 1.061v2.684q0 .716-.337 1.063-.339.347-1.019.347zm.008-1.06h1.281q.164 0 .245-.088.08-.087.08-.261v-2.69q0-.171-.08-.257-.081-.084-.245-.085h-1.281q-.165 0-.246.085t-.08.258v2.689q0 .174.08.261.081.088.246.088m4.989 1.06q-.687 0-1.024-.348-.339-.347-.339-1.063V7.405q0-.715.339-1.06Q15.664 6 16.351 6h1.292q.685 0 1.021.344.336.345.336 1.061v2.684q0 .716-.336 1.063t-1.021.347zm.003-1.06h1.28q.164 0 .245-.088.081-.087.081-.261v-2.69q0-.171-.08-.257-.082-.084-.245-.085h-1.281q-.164 0-.245.085t-.08.258v2.689q0 .174.08.261t.245.088M6.357 18q-.681 0-1.02-.345-.336-.345-.337-1.061v-2.689q0-.71.338-1.058.338-.347 1.02-.347h1.295q.682 0 1.02.347.338.348.338 1.058v2.689q0 .716-.338 1.061T7.653 18zm.008-1.06H7.64q.165 0 .249-.085t.083-.258v-2.69q0-.177-.083-.262-.084-.086-.249-.086H6.365q-.165 0-.245.086-.081.085-.081.263v2.689q0 .172.08.258.081.086.246.086zM11.354 18q-.687 0-1.022-.345-.336-.345-.335-1.061v-2.689q0-.71.335-1.058.335-.347 1.022-.347h1.297q.68 0 1.019.347.337.348.337 1.058v2.689q0 .716-.337 1.061-.339.345-1.019.345zm.008-1.06h1.281q.164 0 .245-.085t.08-.258v-2.69q0-.177-.08-.262-.081-.086-.245-.086h-1.281q-.165 0-.246.086t-.08.263v2.689q0 .172.08.258.081.086.246.086zM16.35 18q-.687 0-1.024-.345-.339-.345-.339-1.061v-2.689q0-.71.339-1.058.337-.347 1.024-.347h1.292q.685 0 1.021.347.336.348.336 1.058v2.689q0 .716-.336 1.061T17.642 18zm.003-1.06h1.28q.165 0 .245-.085.081-.085.081-.258v-2.69q0-.177-.08-.262-.082-.086-.245-.086h-1.281q-.165 0-.245.086t-.08.263v2.689q0 .172.08.258t.245.086z"></path>
    </svg>
  );
}

function CenterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path fill="#151B26" d="M5.638 14.369q.645 0 .644.645v1.637q0 .537.273.805.274.27.78.269h1.679q.651 0 .652.637 0 .638-.652.638h-1.73q-1.131 0-1.707-.566Q5 17.867 5 16.744v-1.73q0-.645.638-.645m12.724 0q.638 0 .638.645v1.73q0 1.117-.573 1.686-.573.57-1.712.57h-1.729q-.645 0-.645-.638 0-.637.645-.637h1.678q.508 0 .784-.269.277-.268.277-.805v-1.637q0-.645.637-.645M13 9a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zm0 1.2h-2a.8.8 0 0 0-.8.8v2a.8.8 0 0 0 .8.8h2a.8.8 0 0 0 .8-.8v-2a.8.8 0 0 0-.8-.8M9.014 5q.651 0 .652.644 0 .638-.652.638H7.335q-.506 0-.78.269-.273.268-.273.805v1.637q0 .645-.644.645Q5 9.638 5 8.993V7.257q0-1.118.577-1.687Q6.152 5 7.284 5zm7.7 0q1.14 0 1.713.57T19 7.257v1.736q0 .645-.638.645-.637 0-.637-.645V7.356q0-.537-.277-.805-.277-.27-.784-.269h-1.678q-.645 0-.645-.638 0-.644.645-.644z"></path>
    </svg>
  );
}
