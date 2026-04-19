import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "ghost";
};

const ButtonComponent = ({
	variant = "primary",
	className = "",
	type = "button",
	...rest
}: Props) => {
	const base =
		variant === "primary"
			? "border border-white px-4 py-2 font-medium hover:bg-white hover:text-black disabled:opacity-50"
			: "border border-white/40 px-3 py-1.5 text-sm hover:bg-white hover:text-black disabled:opacity-50";
	return <button type={type} className={`${base} ${className}`} {...rest} />;
};

export { ButtonComponent };
