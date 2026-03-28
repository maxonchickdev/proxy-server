export const SettingsPage = () => {
	return (
		<section className="space-y-8" aria-labelledby="settings-heading">
			<h1 id="settings-heading" className="text-2xl font-medium">
				Settings
			</h1>
			<section
				className="border border-white/20 p-6"
				aria-labelledby="settings-channels-heading"
			>
				<h2 id="settings-channels-heading" className="mb-4 text-lg font-medium">
					Notification channels
				</h2>
				<p className="text-white/60">
					Telegram and Slack integrations will be available in a future update.
				</p>
			</section>
		</section>
	);
};
