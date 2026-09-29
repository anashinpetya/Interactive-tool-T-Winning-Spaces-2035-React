import { Component, type ReactNode } from "react";

/**
 * Shows a friendly message instead of a blank page when a page fails to load
 * (typically: the site was updated while it was open, so an old code file no
 * longer exists - a reload fetches the new version).
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    // navigating to another page clears the error
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <div className="panel error-panel" role="alert">
          <h1>This page could not be loaded</h1>
          <p className="lede">
            The tool may have been updated since you opened it. Reloading the page usually fixes this.
          </p>
          <button type="button" className="button primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
