import type { ReactNode } from "react";

const CardComponent = ({
	children,
	className = "",
}: {
	children: ReactNode;
	className?: string;
}) => {
	return (
		<div className={`border border-white/20 p-6 ${className}`}>{children}</div>
	);
};

export { CardComponent };
