import { useNavigate } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Button, Skeleton, Stack, Text } from "@mantine/core";
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
	return (
		<button
			onClick={() => navigate(`/trip/${trip.id}`)}
			className="group text-left rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]"
		>
			<p
				className="mb-1 truncate text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors"
				style={{ fontFamily: "Paperozi" }}
			>
				{trip.name}
			</p>
			<p className="mb-3 text-xs text-gray-500">
				{trip.destination ?? "목적지 투표 중"}
			</p>
			<p className="text-xs text-gray-400">
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

	return (
		<>
			<CreateTripModal opened={modalOpened} onClose={close} />
			<RecoverMembershipModal opened={recoverOpened} onClose={closeRecover} />

			<Stack gap={40} pt="xl">
				{/* Hero */}
				<div className="flex items-center justify-between">
					<div>
						<h1
							className="text-2xl font-bold text-gray-900 tracking-tight"
							style={{ fontFamily: "Paperozi" }}
						>
							여행을 함께 기록하세요
						</h1>
						<p className="mt-1 text-sm text-gray-500">
							여행 스레드를 만들고 친구들과 순간을 공유해요
						</p>
					</div>
					<Button onClick={open} radius="xl" size="sm">
						+ 새 여행 만들기
					</Button>
				</div>

				{/* Join section */}
				<div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-5 py-4">
					<Text size="sm" fw={500} mb="sm" c="gray.7">
						초대 코드로 여행에 참여하기
					</Text>
					<JoinTripForm />
					<Text size="xs" c="gray.4" ta="center" mt="sm">
						기기를 바꿨나요?{" "}
						<button
							onClick={openRecover}
							className="text-indigo-400 hover:underline cursor-pointer"
						>
							복구 코드로 접근권 복구하기
						</button>
					</Text>
				</div>

				{/* My trips */}
				<div>
					<Text fw={600} size="sm" mb="md" c="gray.8">
						내 여행{trips && trips.length > 0 ? ` (${trips.length})` : ""}
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
						<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-14 text-center">
							<p className="text-sm text-gray-400">아직 참여한 여행이 없어요</p>
							<Button variant="subtle" size="xs" mt="sm" onClick={open}>
								첫 여행을 만들어볼까요?
							</Button>
						</div>
					)}
				</div>
			</Stack>
		</>
	);
};
