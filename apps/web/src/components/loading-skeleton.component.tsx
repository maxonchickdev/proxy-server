type Props = {
	className?: string;

	rows?: number;
};

export function LoadingSkeletonComponent({ className = "", rows = 1 }: Props) {
	const rowHeightRem = 2.5;
	return (
		<div
			className={`animate-pulse rounded bg-white/10 ${className}`}
			style={{ minHeight: `${Math.max(1, rows) * rowHeightRem}rem` }}
			aria-busy="true"
			aria-live="polite"
		/>
	);
}
