import React from "react";

export default class GardenMapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[GardenDebug] GardenMapCanvas rendering error", { error, errorInfo });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div>Garden map failed to render (see console)</div>;
    }
    return this.props.children;
  }
}
