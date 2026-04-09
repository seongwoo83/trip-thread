import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Loader, Modal, Stack, Text } from "@mantine/core";
import { useClipboard, useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useTripAccess } from "@/entities/trip";
import { DestinationVoteWidget } from "@/widgets/destination-vote";
import { TripBoard } from "@/widgets/trip-board";
import { TripMemberList } from "@/widgets/trip-members";
import { useDeleteTrip } from "@/features/delete-trip";
import { useLeaveTrip } from "@/features/leave-trip";
import styles from "./Trip.module.scss";

export const TripPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { status, trip, member } = useTripAccess(id);
	const clipboard = useClipboard({ timeout: 2000 });
	const [copyToastVisible, setCopyToastVisible] = useState(false);
	const copyToastTimerRef = useRef<number | null>(null);
	const [
		memberModalOpened,
		{ open: openMemberModal, close: closeMemberModal },
	] = useDisclosure(false);
	const { t } = useTranslation();
	const deleteTrip = useDeleteTrip();
	const leaveTrip = useLeaveTrip();
	const [
		deleteModalOpened,
		{ open: openDeleteModal, close: closeDeleteModal },
	] = useDisclosure(false);
	const [leaveModalOpened, { open: openLeaveModal, close: closeLeaveModal }] =
		useDisclosure(false);

	useEffect(() => {
		return () => {
			if (copyToastTimerRef.current) {
				window.clearTimeout(copyToastTimerRef.current);
			}
		};
	}, []);

	if (status === "loading") {
		return (
			<div className="flex items-center justify-center py-32">
				<Loader size="sm" color="cyan" />
			</div>
		);
	}

	if (status === "not-found") {
		return (
			<Stack align="center" gap="sm" pt={60}>
				<Text size="lg" fw={700} className={styles.stateTitle}>
					{t("trip.notFound.title")}
				</Text>
				<Text size="sm" className={styles.stateText}>
					{t("trip.notFound.description")}
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					color="cyan"
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
				<Text size="lg" fw={700} className={styles.stateTitle}>
					{t("trip.unauthorized.title")}
				</Text>
				<Text size="sm" ta="center" className={styles.stateText}>
					{t("trip.unauthorized.description")}
				</Text>
				<Button
					variant="subtle"
					size="sm"
					mt="xs"
					color="cyan"
					onClick={() => navigate("/")}
				>
					{t("common.goHome")}
				</Button>
			</Stack>
		);
	}

	const handleShare = () => {
		clipboard.copy(trip!.invite_code);
		setCopyToastVisible(true);

		if (copyToastTimerRef.current) {
			window.clearTimeout(copyToastTimerRef.current);
		}

		copyToastTimerRef.current = window.setTimeout(() => {
			setCopyToastVisible(false);
		}, 2400);
	};

	return (
		<>
			<div
				className="invite-copy-toast"
				data-visible={copyToastVisible}
				role="status"
				aria-live="polite"
				aria-hidden={!copyToastVisible}
			>
				<div className="invite-copy-toast__orb">✓</div>
				<div className="invite-copy-toast__content">
					<p className="invite-copy-toast__eyebrow">
						{t("trip.copyToast.eyebrow")}
					</p>
					<p className="invite-copy-toast__title">
						{t("trip.copyToast.title")}
					</p>
					<p className="invite-copy-toast__description">
						{t("trip.copyToast.description")}
					</p>
				</div>
				<div className="invite-copy-toast__code">{trip!.invite_code}</div>
			</div>

			<div className={`animate-float-in ${styles.page}`}>
				<div>
					<p className={styles.meta}>
						{trip!.start_date} — {trip!.end_date}
					</p>
					<div className={styles.headingRow}>
						<h1 className={styles.title}>{trip!.name}</h1>
						<div className={styles.actions}>
							<Button
								variant="subtle"
								size="xs"
								color="gray"
								hiddenFrom="sm"
								onClick={openMemberModal}
								className={styles.actionButton}
							>
								{t("trip.viewMembers")}
							</Button>
							<Button
								variant="subtle"
								size="xs"
								color={clipboard.copied ? "cyan" : "gray"}
								onClick={handleShare}
								className={styles.actionButton}
							>
								{clipboard.copied
									? t("common.copied")
									: t("trip.copyInviteCode")}
							</Button>
							{member!.role === "host" ? (
								<Button
									variant="subtle"
									size="xs"
									color="red"
									onClick={openDeleteModal}
									className={styles.actionButton}
								>
									{t("trip.deleteTrip")}
								</Button>
							) : (
								<Button
									variant="subtle"
									size="xs"
									color="red"
									onClick={openLeaveModal}
									className={styles.actionButton}
								>
									{t("trip.leaveTrip")}
								</Button>
							)}
						</div>
					</div>
					{trip!.destination && (
						<div className={styles.destinationBadge}>
							<span className={styles.destinationText}>
								📍 {trip!.destination}
							</span>
						</div>
					)}
				</div>

				<div className="wave-divider" />

				<div className={styles.contentGrid}>
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

					<div className={`${styles.sidebar} hidden sm:block`}>
						<TripMemberList tripId={trip!.id} myMemberId={member!.id} />
					</div>
				</div>
			</div>

			<Modal
				opened={memberModalOpened}
				onClose={closeMemberModal}
				title={
					<Text fw={700} size="sm" className={styles.modalTitle}>
						{t("trip.memberListTitle")}
					</Text>
				}
				size="xs"
			>
				<TripMemberList tripId={trip!.id} myMemberId={member!.id} />
			</Modal>

			<Modal
				opened={deleteModalOpened}
				onClose={closeDeleteModal}
				title={
					<Text fw={700} size="sm" className={styles.deleteTitle}>
						{t("trip.deleteTrip")}
					</Text>
				}
				size="xs"
			>
				<Stack gap="md">
					<Text size="sm" className={styles.deleteText}>
						{t("trip.deleteConfirm", { name: trip!.name })}
					</Text>
					<div className={styles.modalActions}>
						<Button
							variant="subtle"
							color="gray"
							size="sm"
							onClick={closeDeleteModal}
						>
							{t("common.cancel")}
						</Button>
						<Button
							color="red"
							size="sm"
							loading={deleteTrip.isPending}
							onClick={() => deleteTrip.mutate(trip!.id)}
						>
							{t("common.delete")}
						</Button>
					</div>
				</Stack>
			</Modal>

			<Modal
				opened={leaveModalOpened}
				onClose={closeLeaveModal}
				title={
					<Text fw={700} size="sm" className={styles.deleteTitle}>
						{t("trip.leaveTrip")}
					</Text>
				}
				size="xs"
			>
				<Stack gap="md">
					<Text size="sm" className={styles.deleteText}>
						{t("trip.leaveConfirm", { name: trip!.name })}
					</Text>
					<div className={styles.modalActions}>
						<Button
							variant="subtle"
							color="gray"
							size="sm"
							onClick={closeLeaveModal}
						>
							{t("common.cancel")}
						</Button>
						<Button
							color="red"
							size="sm"
							loading={leaveTrip.isPending}
							onClick={() =>
								leaveTrip.mutate({ tripId: trip!.id, memberId: member!.id })
							}
						>
							{t("trip.leaveConfirmButton")}
						</Button>
					</div>
				</Stack>
			</Modal>
		</>
	);
};
