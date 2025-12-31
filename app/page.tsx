"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { DEFAULT_WORKFLOW_FILE } from "./workflow/constants";

type WorkflowListItem = {
  id: string;
  name: string;
  entryPath: string;
  fileCount: number;
  createdAt?: string;
  updatedAt?: string;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const editorLink = useMemo(
    () =>
      `/workflow?file=${encodeURIComponent(DEFAULT_WORKFLOW_FILE)}&name=${encodeURIComponent("内置示例工作流")}`,
    [],
  );

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workflows", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("获取列表失败");
      }
      const data = await res.json();
      setWorkflows(data.items || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("请选择需要上传的 YAML 或 ZIP 文件");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/workflows", {
        method: "POST",
        body: formData,
      });

      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || "上传失败");
      }

      setSelectedFile(null);
      setFileInputKey((v) => v + 1);
      await fetchWorkflows();
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传失败";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-indigo-600">百度千帆 · 工作流</p>
          <h1 className="text-3xl font-bold text-slate-900">AI 工作流中心</h1>
          <p className="text-base text-slate-600">
            上传 YAML 文件或百度千帆导出的 ZIP 包，系统会自动解压并保存到 MongoDB，支持直接在编辑器中打开。
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <form
            onSubmit={handleUpload}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">上传工作流</h2>
                <p className="text-sm text-slate-500 mt-1">
                  支持单个 YAML 文件或百度千帆导出的 ZIP 压缩包
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                MongoDB 持久化
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <label
                htmlFor="workflow-file"
                className="flex items-center justify-between rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">
                    {selectedFile ? selectedFile.name : "选择 YAML 或 ZIP 文件"}
                  </span>
                  <span className="text-xs text-slate-500">
                    仅读取 .yaml/.yml 或 .zip 文件，ZIP 会自动提取 app.yaml 作为入口
                  </span>
                </div>
                <div className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  浏览文件
                </div>
              </label>
              <input
                key={fileInputKey}
                id="workflow-file"
                name="workflow-file"
                type="file"
                accept=".yaml,.yml,.zip"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {uploading ? "上传中..." : "上传并保存"}
              </button>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">已上传的工作流</h2>
              <button
                onClick={fetchWorkflows}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                type="button"
              >
                刷新
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              点击卡片可打开工作流编辑器
            </p>

            <div className="mt-4 space-y-3">
              <Link
                href={editorLink}
                className="block rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-700">内置示例工作流</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      文件：{DEFAULT_WORKFLOW_FILE}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                    示例
                  </span>
                </div>
              </Link>

              {loading && (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-600">
                  正在加载工作流列表...
                </div>
              )}

              {!loading && workflows.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-600">
                  还没有上传记录，先上传一个 YAML 或 ZIP 文件吧。
                </div>
              )}

              {!loading &&
                workflows.map((item) => {
                  const link = `/workflow?workflowId=${encodeURIComponent(item.id)}&file=${encodeURIComponent(item.entryPath)}&name=${encodeURIComponent(item.name)}`;
                  return (
                    <Link
                      key={item.id}
                      href={link}
                      className="block rounded-xl border border-slate-200 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            入口：{item.entryPath} · 文件数：{item.fileCount}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            更新时间：{formatDate(item.updatedAt || item.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                          编辑
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
