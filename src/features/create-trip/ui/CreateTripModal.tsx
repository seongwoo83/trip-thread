import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	CopyButton,
	Group,
	Modal,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useCreateTrip } from "../model/useCreateTrip";
import type { Trip } from "@/entities/trip";

type Props = {
	opened: boolean;
	onClose: () => void;
};

const EMPTY_FORM = { name: "", destination: "", start_date: "", end_date: "" };

export const CreateTripModal = ({ opened, onClose }: Props) => {
	const navigate = useNavigate();
	const { mutateAsync, isPending } = useCreateTrip();

	const [createdTrip, setCreatedTrip] = useState<Trip | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trip = await mutateAsync(form);
		setCreatedTrip(trip);
	};

	const handleClose = () => {
		setCreatedTrip(null);
		setForm(EMPTY_FORM);
		onClose();
	};

	if (createdTrip) {
		return (
			<Modal
				opened={opened}
				onClose={handleClose}
				title={
					<Text fw={600}>
						여행이 만들어졌어요!
					</Text>
				}
				centered
			>
				<Stack gap="lg">
					<Text size="sm" c="dimmed">
						아래 초대 코드를 공유해서 친구들을 초대해보세요.
					</Text>

					<div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
						<span
							className="flex-1 text-center text-2xl tracking-[0.25em] font-bold"
							style={{ fontFamily: "monospace" }}
						>
							{createdTrip.invite_code}
						</span>
						<CopyButton value={createdTrip.invite_code}>
							{({ copied, copy }) => (
								<Button size="xs" variant="light" radius="xl" onClick={copy}>
									{copied ? "복사됨" : "복사"}
								</Button>
							)}
						</CopyButton>
					</div>

					<Group>
						<Button variant="subtle" onClick={handleClose} flex={1}>
							닫기
						</Button>
						<Button
							flex={2}
							onClick={() => {
								handleClose();
								navigate(`/trip/${createdTrip.id}`);
							}}
						>
							여행 스레드 바로가기
						</Button>
					</Group>
				</Stack>
			</Modal>
		);
	}

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={<Text fw={600}>새 여행 만들기</Text>}
			centered
		>
			<form onSubmit={handleSubmit}>
				<Stack gap="md">
					<TextInput
						label="여행 이름"
						placeholder="오사카 여름 여행"
						required
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
					/>
					<TextInput
						label="목적지"
						placeholder="일본, 오사카"
						required
						value={form.destination}
						onChange={(e) =>
							setForm((f) => ({ ...f, destination: e.target.value }))
						}
					/>
					<Group grow>
						<TextInput
							label="출발일"
							type="date"
							required
							value={form.start_date}
							onChange={(e) =>
								setForm((f) => ({ ...f, start_date: e.target.value }))
							}
						/>
						<TextInput
							label="귀국일"
							type="date"
							required
							value={form.end_date}
							onChange={(e) =>
								setForm((f) => ({ ...f, end_date: e.target.value }))
							}
						/>
					</Group>
					<Button type="submit" loading={isPending} mt="xs">
						여행 만들기
					</Button>
				</Stack>
			</form>
		</Modal>
	);
};
