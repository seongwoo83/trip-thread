import { useParams, useNavigate } from "react-router-dom";
import { Button, Loader, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useTripAccess } from "@/entities/trip";
import { PostThread } from "@/widgets/post-thread";

export const PostPage = () => {
	const { id, postId } = useParams<{ id: string; postId: string }>();
	const navigate = useNavigate();
	const { status, trip } = useTripAccess(id);
	const { t } = useTranslation();

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
					{t("trip.notFound.title")}
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					onClick={() => navigate("/")}
				>
					{t("common.goHome")}
				</Button>
			</Stack>
		);
	}

	if (status === "unauthorized") {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={600} c="gray.7">
					{t("trip.unauthorized.title")}
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					onClick={() => navigate("/")}
				>
					{t("common.goHome")}
				</Button>
			</Stack>
		);
	}

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

			<PostThread postId={postId!} tripId={trip!.id} />
		</Stack>
	);
};
