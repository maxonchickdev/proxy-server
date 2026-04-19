import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
	label: string;
};

export const InputComponent = ({
	label,
	id,
	className = "",
	"aria-describedby": ariaDescribedByProp,
	"aria-invalid": ariaInvalidProp,
	...rest
}: Props) => {
	const inputId = id ?? rest.name ?? label.replace(/\s/g, "-").toLowerCase();
	return (
		<div>
			<label htmlFor={inputId} className="mb-1 block text-sm text-white/60">
				{label}
			</label>
			<input
				{...rest}
				id={inputId}
				aria-describedby={ariaDescribedByProp}
				aria-invalid={ariaInvalidProp}
				className={`w-full border border-white/20 bg-black px-3 py-2 text-white focus:border-white focus:outline-none ${className}`}
			/>
		</div>
	);
};
