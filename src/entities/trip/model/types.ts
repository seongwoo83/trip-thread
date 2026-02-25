export type Trip = {
	id: string;
	name: string;
	destination: string;
	start_date: string;
	end_date: string;
	invite_code: string;
	created_at: string;
};

export type TripMember = {
	id: string;
	trip_id: string;
	device_id: string;
	nickname: string;
	role: "host" | "member";
	member_token_hash: string;
	recovery_code_hash: string;
	created_at: string;
};
