import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Navigate away from the failing route before clearing error (avoids immediate re-crash). */
  onRetry?: () => void;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-4, 16px)",
          padding: "var(--space-8, 32px)",
          height: "100%",
          fontFamily: "var(--font-body, sans-serif)",
          color: "var(--text-primary, #1e293b)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-lg, 18px)",
            fontFamily: "var(--font-heading, sans-serif)",
            fontWeight: "var(--weight-semibold, 600)",
            margin: 0,
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm, 14px)",
            color: "var(--text-secondary, #64748b)",
            margin: 0,
            maxWidth: "40ch",
            textAlign: "center",
          }}
        >
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => {
            this.props.onRetry?.();
            this.setState({ error: null });
          }}
          style={{
            padding: "8px 20px",
            fontSize: "var(--text-sm, 14px)",
            fontFamily: "var(--font-body, sans-serif)",
            fontWeight: "var(--weight-medium, 500)",
            color: "#fff",
            background: "var(--accent, #2563eb)",
            border: "none",
            borderRadius: "var(--radius-md, 6px)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
