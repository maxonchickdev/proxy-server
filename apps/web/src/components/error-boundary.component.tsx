import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

class ErrorBoundaryComponent extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, message: "" };
	}

	static getDerivedStateFromError(err: Error): State {
		return { hasError: true, message: err.message };
	}

	override componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("ErrorBoundary:", error, info.componentStack);
	}

	handleReload = (): void => {
		window.location.reload();
	};

	override render() {
		if (this.state.hasError) {
			return (
				<div
					className="mx-auto max-w-lg p-8 text-center text-white"
					role="alert"
				>
					<h1 className="text-xl font-medium">Something went wrong</h1>
					<p className="mt-2 text-sm text-white/60">{this.state.message}</p>
					<button
						type="button"
						onClick={this.handleReload}
						className="mt-6 border border-white/40 px-4 py-2 text-sm hover:bg-white hover:text-black"
					>
						Reload page
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

export { ErrorBoundaryComponent };
