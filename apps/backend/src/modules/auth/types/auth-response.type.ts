export type AuthResponseType = {
	accessToken: string;
	user: {
		id: string;
		email: string;
		name: string | null;
	};
};
