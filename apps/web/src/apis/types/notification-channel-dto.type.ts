type NotificationChannelDto = {
	id: string;
	userId: string;
	type: string;
	config: unknown;
	isActive: boolean;
	createdAt: string;
};

export type { NotificationChannelDto };
