"use client";

import { Component, type ErrorInfo, type ReactNode, useState } from "react";

import type { Room3DModel } from "@/components/planner/room-3d-utils";
import { Room3DScene } from "@/components/planner/room-3d-scene";

type Room3DViewportProps = { model: Room3DModel };
type BoundaryProps = { children: ReactNode };
type BoundaryState = { failed: boolean };

class WebGLErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("FORMA 3D preview failed", error, info.componentStack);
  }

  render() {
    return this.state.failed
      ? <ViewportFallback />
      : this.props.children;
  }
}

function ViewportFallback() {
  return <div className="room-3d-viewport__fallback" role="status">3D preview недоступен на этом устройстве.</div>;
}

export function Room3DViewport({ model }: Room3DViewportProps) {
  const [webglAvailable] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      return Boolean(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
      );
    } catch {
      return false;
    }
  });

  return (
    <figure className="room-3d-viewport">
      <div className="room-3d-viewport__canvas">
        {webglAvailable ? (
          <WebGLErrorBoundary><Room3DScene model={model} /></WebGLErrorBoundary>
        ) : (
          <ViewportFallback />
        )}
      </div>
      <figcaption>Базовая геометрия пространства · 1 единица сцены = 1 метр</figcaption>
    </figure>
  );
}
