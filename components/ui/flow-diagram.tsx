"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import { cn } from "@/lib/utils";

type NodeKind = "default" | "accent" | "warning" | "success" | "error";

interface FlowNode extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  x: number;
  y: number;
  kind?: NodeKind;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  animated?: boolean;
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  height?: number;
  caption?: string;
}

const kindStyles: Record<NodeKind, string> = {
  default: "bg-background border-border",
  accent: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  warning: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",
  success: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
};

function subscribeDarkClass(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getDarkClassSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerDarkSnapshot() {
  return false;
}

function useIsDark() {
  return useSyncExternalStore(subscribeDarkClass, getDarkClassSnapshot, getServerDarkSnapshot);
}

const handleSides = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const;

function FlowCardNode({ data }: NodeProps<Node<FlowNode>>) {
  const kind = data.kind ?? "default";
  return (
    <div
      className={cn(
        "min-w-[140px] max-w-[220px] rounded-md border px-3 py-2 shadow-sm",
        kindStyles[kind]
      )}
    >
      {handleSides.map((side) => (
        <div key={side.id}>
          <Handle
            id={side.id}
            type="source"
            position={side.position}
            className="!h-2 !w-2 !border-0 !bg-transparent"
          />
          <Handle
            id={side.id}
            type="target"
            position={side.position}
            className="!h-2 !w-2 !border-0 !bg-transparent"
          />
        </div>
      ))}
      <div className="text-sm font-semibold leading-tight text-foreground">{data.title}</div>
      {data.description && (
        <div className="mt-1 text-xs leading-snug text-secondary">{data.description}</div>
      )}
    </div>
  );
}

function pickHandles(
  source: { x: number; y: number },
  target: { x: number; y: number }
): { sourceHandle: string; targetHandle: string } {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "right", targetHandle: "left" }
      : { sourceHandle: "left", targetHandle: "right" };
  }
  return dy >= 0
    ? { sourceHandle: "bottom", targetHandle: "top" }
    : { sourceHandle: "top", targetHandle: "bottom" };
}

const nodeTypes = { card: FlowCardNode };

export function FlowDiagram({ nodes, edges, height = 400, caption }: FlowDiagramProps) {
  const isDark = useIsDark();

  const rfNodes = useMemo<Node<FlowNode>[]>(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "card",
        position: { x: n.x, y: n.y },
        data: n,
      })),
    [nodes]
  );

  const edgeColor = isDark ? "#3b82f6" : "#2563eb";

  const rfEdges = useMemo<Edge[]>(() => {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return edges.map((e, i) => {
      const src = nodeMap.get(e.from);
      const tgt = nodeMap.get(e.to);
      const handles =
        src && tgt
          ? pickHandles({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y })
          : { sourceHandle: "right", targetHandle: "left" };
      return {
        id: `${e.from}-${e.to}-${i}`,
        source: e.from,
        target: e.to,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        label: e.label,
        animated: e.animated ?? false,
        type: "smoothstep",
        style: { stroke: edgeColor, strokeWidth: 1.5 },
        labelStyle: { fontSize: 12, fontWeight: 500, fill: isDark ? "#e4e4e7" : "#171717" },
        labelBgStyle: { fill: isDark ? "#111113" : "#ffffff" },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
      };
    });
  }, [nodes, edges, edgeColor, isDark]);

  return (
    <figure className="my-6">
      <div
        className="overflow-hidden rounded-lg border border-border bg-[var(--color-bg-secondary)]"
        style={{ height: `min(${height}px, 60vh)` }}
      >
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch
          zoomOnDoubleClick
          colorMode={isDark ? "dark" : "light"}
          minZoom={0.4}
          maxZoom={2}
        >
          <Background gap={18} size={1} color={isDark ? "#2a2a2e" : "#e5e7eb"} />
          <Controls
            showInteractive={false}
            className="!shadow-none [&>button]:!border-border [&>button]:!bg-background [&>button]:!text-foreground"
          />
        </ReactFlow>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs text-secondary">{caption}</figcaption>
      )}
    </figure>
  );
}
