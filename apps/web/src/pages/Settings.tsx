export function Settings() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-medium text-white">
          Notification channels
        </h2>
        <p className="text-slate-400">
          Telegram and Slack integrations will be available in a future update.
        </p>
      </div>
    </div>
  );
}
