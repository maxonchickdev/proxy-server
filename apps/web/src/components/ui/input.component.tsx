import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
	label: string;
};

export function InputComponent({ label, id, className = "", ...rest }: Props) {
	const inputId = id ?? rest.name ?? label.replace(/\s/g, "-").toLowerCase();
	return (
		<div>
			<label htmlFor={inputId} className="mb-1 block text-sm text-white/60">
				{label}
			</label>
			<input
				id={inputId}
				className={`w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none ${className}`}
				{...rest}
			/>
		</div>
	);
}
