import type { NodeProps } from "reactflow";
import type { QfNodeData } from "../../types";
import { isNodeType } from "../../utils";
import { NodeContent } from "./node-content";

export function QfNode(props: NodeProps<QfNodeData>) {
  const { data, selected, isConnectable } = props;
  const isStart = isNodeType(data.raw, "start");
  const isApi = isNodeType(data.raw, "service_http", "api");
  const isLlm = isNodeType(data.raw, "llm");
  const isEnd = isNodeType(data.raw, "end");
  const isIntention = isNodeType(data.raw, "intention");
  const isChat = isNodeType(data.raw, "chat");
  const isMessage = isNodeType(data.raw, "message");
  const isCode = isNodeType(data.raw, "code");
  const isLoop = isNodeType(data.raw, "loop");
  const isBranch = isNodeType(data.raw, "branch", "switch");
  const isWorkflow = isNodeType(data.raw, "workflow");

  return (
    <NodeContent
      {...props}
      isStart={isStart}
      isApi={isApi}
      isLlm={isLlm}
      isEnd={isEnd}
      isIntention={isIntention}
      isChat={isChat}
      isMessage={isMessage}
      isCode={isCode}
      isLoop={isLoop}
      isBranch={isBranch}
      isWorkflow={isWorkflow}
    />
  );
}
