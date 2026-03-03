import { useParams, useNavigate } from "react-router-dom";
import { Button, Loader, Stack, Text } from "@mantine/core";
import { useTripAccess } from "@/entities/trip";

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
				<Button variant="subtle" size="sm" mt="xs" onClick={() => navigate("/")}>
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
				<Button variant="subtle" size="sm" mt="xs" onClick={() => navigate("/")}>
					홈으로 돌아가기
				</Button>
			</Stack>
		);
	}

	// authorized
	return (
		<Stack gap="xl" pt="xl">
			<div>
				<Text size="xs" c="gray.5" mb={4}>
					{trip!.destination}
				</Text>
				<h1
					className="text-2xl font-bold text-gray-900 tracking-tight"
					style={{ fontFamily: "Paperozi" }}
				>
					{trip!.name}
				</h1>
				<Text size="sm" c="gray.5" mt={4}>
					{trip!.start_date} ~ {trip!.end_date}
				</Text>
			</div>

			<Text size="sm" c="gray.4">
				{member!.nickname} ({member!.role === "host" ? "호스트" : "멤버"})
			</Text>
		</Stack>
	);
};
