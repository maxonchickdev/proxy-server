type Props = {
	className?: string;
	/** Visual height multiplier (each unit ~= one row). */
	rows?: number;
};

/** Simple pulse placeholder for list and card loading states. */
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
