export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <main className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg">
        <p className="text-sm font-semibold text-slate-500">百度千帆 · 工作流</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          React Flow 编辑器
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          可视化加载并编辑示例「知识库问答工作流」的节点和连线。点击下方按钮进入编辑器。
        </p>
        <div className="mt-8 flex gap-3">
          <a
            className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"
            href="/workflow"
          >
            打开工作流编辑器
          </a>
          <a
            className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            href="https://reactflow.dev/"
            target="_blank"
            rel="noopener noreferrer"
          >
            React Flow 文档
          </a>
        </div>
      </main>
    </div>
  );
}
