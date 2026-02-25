import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Button,
	CopyButton,
	Group,
	Modal,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import { useCreateTrip } from "@/features/create-trip/model/useCreateTrip";
import type { CreateTripResult } from "@/features/create-trip/model/useCreateTrip";
import { formatRecoveryCode } from "@/shared/lib";

type Props = {
	opened: boolean;
	onClose: () => void;
};

const EMPTY_FORM = {
	name: "",
	destination: "",
	start_date: "",
	end_date: "",
	nickname: "",
};

export const CreateTripModal = ({ opened, onClose }: Props) => {
	const navigate = useNavigate();
	const { mutateAsync, isPending } = useCreateTrip();

	const [result, setResult] = useState<CreateTripResult | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const created = await mutateAsync(form);
		setResult(created);
	};

	const handleClose = () => {
		setResult(null);
		setForm(EMPTY_FORM);
		onClose();
	};

	if (result) {
		const displayRecovery = formatRecoveryCode(result.recoveryCode);

		return (
			<Modal
				opened={opened}
				onClose={handleClose}
				title={<Text fw={600}>여행이 만들어졌어요!</Text>}
				centered
			>
				<Stack gap="lg">
					<div>
						<Text size="sm" c="dimmed" mb="xs">
							초대 코드를 공유해서 친구들을 초대해보세요.
						</Text>
						<div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
							<span className="flex-1 text-center text-2xl tracking-[0.25em] font-bold">
								{result.trip.invite_code}
							</span>
							<CopyButton value={result.trip.invite_code}>
								{({ copied, copy }) => (
									<Button size="xs" variant="light" radius="xl" onClick={copy}>
										{copied ? "복사됨" : "복사"}
									</Button>
								)}
							</CopyButton>
						</div>
					</div>

					<Alert color="yellow" title="복구 코드를 저장해두세요" variant="light">
						<Text size="sm" mb="sm">
							기기를 바꾸거나 기록이 삭제되면 이 코드로 여행을 다시 찾을 수
							있어요. 지금만 보여드려요.
						</Text>
						<div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-white px-4 py-3">
							<span className="flex-1 text-center text-xl tracking-[0.2em] font-bold font-mono">
								{displayRecovery}
							</span>
							<CopyButton value={result.recoveryCode}>
								{({ copied, copy }) => (
									<Button
										size="xs"
										color="yellow"
										variant="light"
										radius="xl"
										onClick={copy}
									>
										{copied ? "복사됨" : "복사"}
									</Button>
								)}
							</CopyButton>
						</div>
					</Alert>

					<Group>
						<Button variant="subtle" onClick={handleClose} flex={1}>
							닫기
						</Button>
						<Button
							flex={2}
							onClick={() => {
								handleClose();
								navigate(`/trip/${result.trip.id}`);
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
					<DatePickerInput
						type="range"
						label="여행 기간"
						placeholder="날짜를 선택하세요"
						required
						allowSingleDateInRange
						value={[form.start_date || null, form.end_date || null]}
						onChange={(value) => {
							setForm((f) => ({
								...f,
								start_date: value[0] ?? "",
								end_date: value[1] ?? "",
							}));
						}}
						locale="ko"
					/>
					<TextInput
						label="내 닉네임"
						placeholder="여행에서 불릴 이름"
						required
						value={form.nickname}
						onChange={(e) =>
							setForm((f) => ({ ...f, nickname: e.target.value }))
						}
					/>
					<Button type="submit" loading={isPending} mt="xs">
						여행 만들기
					</Button>
				</Stack>
			</form>
		</Modal>
	);
};
