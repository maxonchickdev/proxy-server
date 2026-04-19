import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { API_V1_BASE_PATH } from "@/apis/consts/api-base-path.const";
import { notificationsApi } from "@/apis/notifications.api";
import { ButtonComponent } from "@/components/button.component";
import { CardComponent } from "@/components/card.component";
import { InputComponent } from "@/components/input.component";
import { LoadingSkeletonComponent } from "@/components/loading-skeleton.component";
import { useCanQueryProtectedApi } from "@/contexts/auth.context";

export const IntegrationsPage = () => {
	const can = useCanQueryProtectedApi();
	const qc = useQueryClient();
	const { data: channelsData, isLoading: chLoading } = useQuery({
		queryKey: ["notifications", "channels"],
		queryFn: () => notificationsApi.channels({ limit: 50 }),
		enabled: can,
	});
	const { data: schedules, isLoading: schLoading } = useQuery({
		queryKey: ["notifications", "report-schedules"],
		queryFn: () => notificationsApi.listReportSchedules(),
		enabled: can,
	});

	const [channelId, setChannelId] = useState("");
	const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY");
	const [formError, setFormError] = useState("");
	const createSch = useMutation({
		mutationFn: notificationsApi.createReportSchedule,
		onSuccess: () => {
			void qc.invalidateQueries({
				queryKey: ["notifications", "report-schedules"],
			});
			setChannelId("");
			setFormError("");
		},
		onError: (e: unknown) =>
			setFormError(e instanceof Error ? e.message : "Failed"),
	});
	const delSch = useMutation({
		mutationFn: notificationsApi.deleteReportSchedule,
		onSuccess: () => {
			void qc.invalidateQueries({
				queryKey: ["notifications", "report-schedules"],
			});
		},
	});

	const handleSubmitSchedule = (e: FormEvent) => {
		e.preventDefault();
		setFormError("");
		if (!channelId.trim()) {
			setFormError("Channel id required");
			return;
		}
		createSch.mutate({ channelId: channelId.trim(), frequency });
	};

	const origin = typeof window !== "undefined" ? window.location.origin : "";

	return (
		<div className="space-y-8">
			<h1 className="text-2xl font-medium">Integrations</h1>
			<p className="max-w-2xl text-white/60">
				Configure Slack interactivity and slash commands to POST to{" "}
				<code className="text-white/80">
					{origin}
					{API_V1_BASE_PATH}/integrations/slack/actions
				</code>{" "}
				and{" "}
				<code className="text-white/80">
					{origin}
					{API_V1_BASE_PATH}/integrations/slack/commands
				</code>
				. Telegram bot updates:{" "}
				<code className="text-white/80">
					{origin}
					{API_V1_BASE_PATH}/integrations/telegram/webhook
				</code>
				.
			</p>

			<CardComponent>
				<h2 className="mb-2 text-lg font-medium">Notification channels</h2>
				{chLoading ? (
					<LoadingSkeletonComponent rows={3} className="max-w-md" />
				) : (
					<ul className="space-y-2 text-sm text-white/80">
						{(channelsData?.items ?? []).map((c) => (
							<li key={c.id} className="font-mono">
								{c.type} — {c.id}
							</li>
						))}
						{channelsData?.items.length === 0 ? (
							<li className="text-white/50">
								Create channels via API or Settings.
							</li>
						) : null}
					</ul>
				)}
			</CardComponent>

			<CardComponent>
				<h2 className="mb-4 text-lg font-medium">Report schedules</h2>
				{schLoading ? (
					<LoadingSkeletonComponent rows={2} className="max-w-md" />
				) : (
					<ul className="mb-6 space-y-2">
						{(schedules ?? []).map((s) => (
							<li
								key={s.id}
								className="flex items-center justify-between gap-4 border border-white/10 px-3 py-2 text-sm"
							>
								<span>
									{s.frequency} → channel {s.channelId}
								</span>
								<button
									type="button"
									onClick={() => delSch.mutate(s.id)}
									className="border border-white/30 px-2 py-1 text-xs hover:bg-white hover:text-black"
								>
									Remove
								</button>
							</li>
						))}
						{schedules?.length === 0 ? (
							<li className="text-white/50">No schedules yet.</li>
						) : null}
					</ul>
				)}
				<form onSubmit={handleSubmitSchedule} className="space-y-4">
					{formError ? (
						<p className="text-red-400/90" role="alert">
							{formError}
						</p>
					) : null}
					<InputComponent
						label="Channel ID (UUID)"
						name="channelId"
						value={channelId}
						onChange={(e) => setChannelId(e.target.value)}
						placeholder="notification channel uuid"
					/>
					<div className="space-y-2">
						<label htmlFor="freq" className="text-sm text-white/80">
							Frequency
						</label>
						<select
							id="freq"
							value={frequency}
							onChange={(e) =>
								setFrequency(e.target.value as "DAILY" | "WEEKLY")
							}
							className="w-full border border-white/30 bg-black px-3 py-2 text-white"
						>
							<option value="DAILY">Daily</option>
							<option value="WEEKLY">Weekly</option>
						</select>
					</div>
					<ButtonComponent type="submit" disabled={createSch.isPending}>
						{createSch.isPending ? "Saving…" : "Add schedule"}
					</ButtonComponent>
				</form>
			</CardComponent>
		</div>
	);
};
