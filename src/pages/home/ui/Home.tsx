import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Button, Skeleton, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CreateTripModal } from "@/features/create-trip";
import { JoinTripForm } from "@/features/join-trip";
import { RecoverMembershipModal } from "@/features/recover-membership";
import { useMyTrips } from "@/entities/trip";
import type { Trip } from "@/entities/trip";
import styles from "./Home.module.scss";

function formatDateRange(start: string, end: string): string {
	const fmt = (iso: string) => {
		const d = new Date(iso);
		return `${d.getMonth() + 1}.${d.getDate()}`;
	};
	return `${fmt(start)} — ${fmt(end)}`;
}

const TripCard = ({ trip, index }: { trip: Trip; index: number }) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	return (
		<button
			onClick={() => navigate(`/trip/${trip.id}`)}
			className={`animate-float-in ${styles.tripCard}`}
			style={{ animationDelay: `${index * 60}ms` }}
		>
			<p className={styles.tripName}>{trip.name}</p>
			<p className={styles.tripDestination} data-empty={!trip.destination}>
				{trip.destination
					? `📍 ${trip.destination}`
					: t("home.destinationVoting")}
			</p>
			<p className={styles.tripDate}>
				{formatDateRange(trip.start_date, trip.end_date)}
			</p>
		</button>
	);
};

export const HomePage = () => {
	const [modalOpened, { open, close }] = useDisclosure(false);
	const [recoverOpened, { open: openRecover, close: closeRecover }] =
		useDisclosure(false);
	const { data: trips, isLoading } = useMyTrips();
	const { t } = useTranslation();

	return (
		<>
			<CreateTripModal opened={modalOpened} onClose={close} />
			<RecoverMembershipModal opened={recoverOpened} onClose={closeRecover} />

			<div className={styles.page}>
				<div className={`animate-float-in ${styles.hero}`}>
					<div className={styles.heroCopy}>
						<h1 className={styles.heroTitle}>{t("home.hero.title")}</h1>
						<p className={styles.heroSubtitle}>{t("home.hero.subtitle")}</p>
					</div>
					<Button
						onClick={open}
						radius="xl"
						size="sm"
						className={styles.heroAction}
					>
						{t("home.newTrip")}
					</Button>
				</div>

				<div className="wave-divider" />

				<div
					className={`animate-float-in ${styles.joinCard}`}
					style={{ animationDelay: "80ms" }}
				>
					<Text size="sm" fw={600} mb="sm" className={styles.sectionLabel}>
						{t("home.joinSection")}
					</Text>
					<JoinTripForm />
					<Text size="xs" ta="center" mt="sm" className={styles.helperText}>
						{t("home.deviceChanged")}{" "}
						<button onClick={openRecover} className={styles.linkButton}>
							{t("home.recoverAccess")}
						</button>
					</Text>
				</div>

				<div>
					<div className={styles.tripHeader}>
						<Text fw={700} className={styles.sectionLabel}>
							{t("home.myTrips")}
						</Text>
						{trips && trips.length > 0 && (
							<span className={styles.tripCount}>{trips.length}</span>
						)}
					</div>

					{isLoading ? (
						<div className={styles.tripGrid}>
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} height={100} radius={16} />
							))}
						</div>
					) : trips && trips.length > 0 ? (
						<div className={styles.tripGrid}>
							{trips.map((trip, i) => (
								<TripCard key={trip.id} trip={trip} index={i} />
							))}
						</div>
					) : (
						<div className={`animate-float-in ${styles.emptyState}`}>
							<p className={styles.emptyText}>{t("home.noTrips")}</p>
							<Button
								variant="subtle"
								size="xs"
								mt="sm"
								onClick={open}
								color="cyan"
							>
								{t("home.createFirstTrip")}
							</Button>
						</div>
					)}
				</div>
			</div>
		</>
	);
};
