import { useParams, useNavigate } from "react-router-dom";
import { Button, Loader, Modal, Stack, Text } from "@mantine/core";
import { useClipboard, useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useTripAccess } from "@/entities/trip";
import { DestinationVoteWidget } from "@/widgets/destination-vote";
import { TripBoard } from "@/widgets/trip-board";
import { TripMemberList } from "@/widgets/trip-members";

export const TripPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { status, trip, member } = useTripAccess(id);
	const clipboard = useClipboard({ timeout: 2000 });
	const [
		memberModalOpened,
		{ open: openMemberModal, close: closeMemberModal },
	] = useDisclosure(false);
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
				<Text size="sm" c="gray.5">
					{t("trip.notFound.description")}
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
				<Text size="sm" c="gray.5" ta="center">
					{t("trip.unauthorized.description")}
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

	// authorized
	const handleShare = () => {
		const text = `Trip·Thread 초대 코드: ${trip!.invite_code}`;
		if (navigator.share) {
			navigator.share({ title: trip!.name, text });
		} else {
			clipboard.copy(trip!.invite_code);
		}
	};

	return (
		<>
			<Stack gap="xl" pt="xl">
				{/* 여행 헤더 */}
				<div>
					<Text size="xs" c="gray.4" mb={4}>
						{trip!.start_date} ~ {trip!.end_date}
					</Text>
					<div className="flex items-start justify-between gap-2">
						<h1
							className="text-2xl font-bold text-gray-900 tracking-tight"
							style={{ fontFamily: "Paperozi" }}
						>
							{trip!.name}
						</h1>
						<div
							className="flex items-center gap-1 shrink-0"
							style={{ marginTop: 4 }}
						>
							{/* 멤버 보기 버튼: 모바일 전용 */}
							<Button
								variant="subtle"
								size="xs"
								color="gray"
								hiddenFrom="sm"
								onClick={openMemberModal}
							>
								{t("trip.viewMembers")}
							</Button>
							<Button
								variant="subtle"
								size="xs"
								color={clipboard.copied ? "teal" : "gray"}
								onClick={handleShare}
							>
								{clipboard.copied ? t("common.copied") : t("trip.shareInvite")}
							</Button>
						</div>
					</div>
					{trip!.destination && (
						<div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1">
							<span className="text-xs font-medium text-indigo-600">
								📍 {trip!.destination}
							</span>
						</div>
					)}
				</div>

				{/* Body: 데스크톱 2컬럼 / 모바일 1컬럼 */}
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_220px] sm:items-start">
					{/* 메인 콘텐츠 */}
					<div>
						{!trip!.destination ? (
							<DestinationVoteWidget
								tripId={trip!.id}
								memberId={member!.id}
								role={member!.role}
							/>
						) : (
							<TripBoard tripId={trip!.id} />
						)}
					</div>

					{/* 멤버 목록 사이드바: 데스크톱 전용 */}
					<div
						className="hidden sm:block rounded-xl p-4"
						style={{ border: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}
					>
						<TripMemberList tripId={trip!.id} myMemberId={member!.id} />
					</div>
				</div>
			</Stack>

			{/* 멤버 목록 모달: 모바일 전용 */}
			<Modal
				opened={memberModalOpened}
				onClose={closeMemberModal}
				title={
					<Text fw={600} size="sm">
						{t("trip.memberListTitle")}
					</Text>
				}
				size="xs"
			>
				<TripMemberList tripId={trip!.id} myMemberId={member!.id} />
			</Modal>
		</>
	);
};
