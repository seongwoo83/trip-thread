import { useParams, useNavigate } from "react-router-dom";
import { Button, Loader, Stack, Text } from "@mantine/core";
import { useTripAccess } from "@/entities/trip";
import { DestinationVoteWidget } from "@/widgets/destination-vote";

export const TripPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { status, trip, member } = useTripAccess(id);

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center py-32">
				<Loader size="sm" color="indigo" />
			</div>
		);
	}

	if (status === "not-found") {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={600} c="gray.7">
					여행을 찾을 수 없어요
				</Text>
				<Text size="sm" c="gray.5">
					링크가 잘못됐거나 삭제된 여행일 수 있어요.
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					onClick={() => navigate("/")}
				>
					홈으로 돌아가기
				</Button>
			</Stack>
		);
	}

	if (status === "unauthorized") {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={600} c="gray.7">
					이 여행의 멤버가 아니에요
				</Text>
				<Text size="sm" c="gray.5" ta="center">
					초대 코드로 참여하거나, 복구 코드로 접근권을 복구해보세요.
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					onClick={() => navigate("/")}
				>
					홈으로 돌아가기
				</Button>
			</Stack>
		);
	}

	// authorized
	return (
		<Stack gap="xl" pt="xl">
			{/* 여행 헤더 */}
			<div>
				<Text size="xs" c="gray.4" mb={4}>
					{trip!.start_date} ~ {trip!.end_date}
				</Text>
				<h1
					className="text-2xl font-bold text-gray-900 tracking-tight"
					style={{ fontFamily: "Paperozi" }}
				>
					{trip!.name}
				</h1>
				{trip!.destination && (
					<div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1">
						<span className="text-xs font-medium text-indigo-600">
							📍 {trip!.destination}
						</span>
					</div>
				)}
			</div>

			{/* destination null → 투표 위젯 / 확정 → 게시판 (추후 개발) */}
			{!trip!.destination ? (
				<DestinationVoteWidget
					tripId={trip!.id}
					memberId={member!.id}
					role={member!.role}
				/>
			) : (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
					<Text size="sm" c="gray.4">
						게시판이 곧 열려요
					</Text>
				</div>
			)}
		</Stack>
	);
};
