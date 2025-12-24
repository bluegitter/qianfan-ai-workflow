"use client";

import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { WorkflowCanvas } from "./components/workflow-canvas";

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
