import type { HttpClient } from "./helpers/http-client";
import type { NotificationChannelDto } from "./types/notification-channel-dto.type";
import { httpClient } from "./helpers/http-client";

export class NotificationsApi {
	constructor(private readonly http: HttpClient) {}

	channels(params?: { limit?: number; offset?: number }) {
		const search = new URLSearchParams();
		if (params?.limit != null) search.set("limit", String(params.limit));
		if (params?.offset != null) search.set("offset", String(params.offset));
		const qs = search.toString();
		return this.http.request<{
			items: NotificationChannelDto[];
			total: number;
			limit: number;
			offset: number;
		}>(`/notifications/channels${qs ? `?${qs}` : ""}`);
	}

	createReportSchedule(data: {
		channelId: string;
		frequency: "DAILY" | "WEEKLY";
	}) {
		return this.http.request<{
			id: string;
			frequency: string;
			channelId: string;
		}>("/notifications/report-schedules", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	listReportSchedules() {
		return this.http.request<
			Array<{
				id: string;
				userId: string;
				channelId: string;
				frequency: string;
				isActive: boolean;
				createdAt: string;
			}>
		>("/notifications/report-schedules");
	}

	deleteReportSchedule(id: string) {
		return this.http.request<{ success: boolean }>(
			`/notifications/report-schedules/${id}`,
			{
				method: "DELETE",
			},
		);
	}
}

export const notificationsApi = new NotificationsApi(httpClient);
