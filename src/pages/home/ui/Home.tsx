import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Button, Skeleton, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { CreateTripModal } from "@/features/create-trip";
import { JoinTripForm } from "@/features/join-trip";
import { RecoverMembershipModal } from "@/features/recover-membership";
import { useMyTrips } from "@/entities/trip";
import type { Trip } from "@/entities/trip";

function formatDateRange(start: string, end: string): string {
	const fmt = (iso: string) => {
		const d = new Date(iso);
		return `${d.getMonth() + 1}/${d.getDate()}`;
	};
	return `${fmt(start)} ~ ${fmt(end)}`;
}

const TripCard = ({ trip }: { trip: Trip }) => {
	const navigate = useNavigate();
	const { t } = useTranslation();
	return (
		<button
			onClick={() => navigate(`/trip/${trip.id}`)}
			className="group text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]"
		>
			<p
				className="mb-1 truncate text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors"
				style={{ fontFamily: "Paperozi" }}
			>
				{trip.name}
			</p>
			<p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
				{trip.destination ?? t("home.destinationVoting")}
			</p>
			<p className="text-xs text-gray-400 dark:text-gray-500">
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

			<Stack gap={40} pt="xl">
				{/* Hero */}
				<div className="flex items-center justify-between">
					<div>
						<h1
							className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight"
							style={{ fontFamily: "Paperozi" }}
						>
							{t("home.hero.title")}
						</h1>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							{t("home.hero.subtitle")}
						</p>
					</div>
					<Button onClick={open} radius="xl" size="sm">
						{t("home.newTrip")}
					</Button>
				</div>

				{/* Join section */}
				<div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 px-5 py-4">
					<Text size="sm" fw={500} mb="sm" c="gray.7">
						{t("home.joinSection")}
					</Text>
					<JoinTripForm />
					<Text size="xs" c="gray.4" ta="center" mt="sm">
						{t("home.deviceChanged")}{" "}
						<button
							onClick={openRecover}
							className="text-indigo-400 hover:underline cursor-pointer"
						>
							{t("home.recoverAccess")}
						</button>
					</Text>
				</div>

				{/* My trips */}
				<div>
					<Text fw={600} size="sm" mb="md" c="gray.8">
						{t("home.myTrips")}
						{trips && trips.length > 0 ? ` (${trips.length})` : ""}
					</Text>

					{isLoading ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} height={100} radius="lg" />
							))}
						</div>
					) : trips && trips.length > 0 ? (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
							{trips.map((trip) => (
								<TripCard key={trip.id} trip={trip} />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 py-14 text-center">
							<p className="text-sm text-gray-400 dark:text-gray-500">
								{t("home.noTrips")}
							</p>
							<Button variant="subtle" size="xs" mt="sm" onClick={open}>
								{t("home.createFirstTrip")}
							</Button>
						</div>
					)}
				</div>
			</Stack>
		</>
	);
};
