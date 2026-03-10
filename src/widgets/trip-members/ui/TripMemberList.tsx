import { Loader, Text } from "@mantine/core";
import { useTripMembers } from "@/entities/trip-member";

type Props = {
	tripId: string;
	myMemberId: string;
};

export const TripMemberList = ({ tripId, myMemberId }: Props) => {
	const { data: members, isPending } = useTripMembers(tripId);

	if (isPending) {
		return (
			<div className="flex justify-center py-6">
				<Loader size="xs" color="indigo" />
			</div>
		);
	}

	return (
		<div>
			<Text
				size="xs"
				fw={600}
				c="gray.5"
				mb="sm"
				style={{ letterSpacing: "0.05em" }}
			>
				멤버 {members?.length ?? 0}명
			</Text>
			<div className="flex flex-col gap-2">
				{members?.map((m) => (
					<div key={m.id} className="flex items-center gap-2.5">
						{/* Avatar */}
						<div
							className="flex items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
							style={{
								width: 32,
								height: 32,
								backgroundColor: m.role === "host" ? "#6366f1" : "#d1d5db",
								color: m.role === "host" ? "white" : "#6b7280",
							}}
						>
							{m.nickname.charAt(0).toUpperCase()}
						</div>

						{/* Name + role */}
						<div className="flex items-center gap-1.5 min-w-0">
							<span className="text-sm text-gray-800 font-medium truncate">
								{m.nickname}
							</span>
							{m.id === myMemberId && (
								<span className="text-xs text-gray-400 shrink-0">(나)</span>
							)}
							{m.role === "host" && (
								<span
									className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
									style={{
										backgroundColor: "#eef2ff",
										color: "#6366f1",
										fontSize: "0.65rem",
										fontWeight: 600,
									}}
								>
									호스트
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
