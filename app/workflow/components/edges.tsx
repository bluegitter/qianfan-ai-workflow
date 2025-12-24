import type { EdgeProps } from "reactflow";
import { BezierEdge } from "reactflow";

export function ArrowBezier(props: EdgeProps) {
  return (
    <BezierEdge
      {...props}
      style={{ stroke: "#6b7280", strokeWidth: 2 }}
      markerEnd={props.markerEnd}
    />
  );
}

export const edgeTypes = { arrowBezier: ArrowBezier };
