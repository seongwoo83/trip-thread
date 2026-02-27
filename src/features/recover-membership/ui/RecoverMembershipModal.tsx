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
import { useRecoverMembership } from "@/features/recover-membership/model/useRecoverMembership";
import { formatRecoveryCode } from "@/shared/lib";
import type { RecoverResult } from "@/features/recover-membership/model/useRecoverMembership";

type Props = {
	opened: boolean;
	onClose: () => void;
};

const EMPTY_FORM = { inviteCode: "", recoveryCode: "" };

export const RecoverMembershipModal = ({ opened, onClose }: Props) => {
	const navigate = useNavigate();
	const [form, setForm] = useState(EMPTY_FORM);
	const [result, setResult] = useState<RecoverResult | null>(null);
	const { mutateAsync, isPending, error, reset } = useRecoverMembership();

	const handleClose = () => {
		setForm(EMPTY_FORM);
		setResult(null);
		reset();
		onClose();
	};

	const handleSubmit = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		const res = await mutateAsync({
			inviteCode: form.inviteCode.trim(),
			recoveryCode: form.recoveryCode.trim(),
		});
		setResult(res);
	};

	return (
		<Modal opened={opened} onClose={handleClose} title="접근권 복구" centered>
			{result ? (
				<Stack gap="md">
					<Text size="sm" c="gray.7">
						<strong>{result.trip.name}</strong> 여행의 접근권이 복구됐어요.
					</Text>
					<Alert color="yellow" title="새 복구 코드를 저장해두세요">
						<Text size="sm" mb="xs">
							기존 복구 코드는 더 이상 사용할 수 없어요.
						</Text>
						<Group gap="xs" align="center">
							<Text fw={700} ff="monospace" size="lg">
								{formatRecoveryCode(result.newRecoveryCode)}
							</Text>
							<CopyButton value={result.newRecoveryCode}>
								{({ copied, copy }) => (
									<Button
										size="xs"
										variant="light"
										color={copied ? "teal" : "yellow"}
										onClick={copy}
									>
										{copied ? "복사됨" : "복사"}
									</Button>
								)}
							</CopyButton>
						</Group>
					</Alert>
					<Button
						fullWidth
						onClick={() => {
							handleClose();
							navigate(`/trip/${result.trip.id}`);
						}}
					>
						여행으로 이동
					</Button>
				</Stack>
			) : (
				<form onSubmit={handleSubmit}>
					<Stack gap="md">
						<TextInput
							label="초대 코드"
							placeholder="ABC123"
							value={form.inviteCode}
							onChange={(e) => {
								reset();
								setForm((f) => ({
									...f,
									inviteCode: e.target.value.toUpperCase(),
								}));
							}}
							maxLength={6}
							styles={{
								input: {
									fontFamily: "monospace",
									letterSpacing: "0.15em",
									textTransform: "uppercase",
								},
							}}
						/>
						<TextInput
							label="복구 코드"
							placeholder="XXXX-XXXX-XXXX"
							value={form.recoveryCode}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									recoveryCode: e.target.value.toUpperCase(),
								}))
							}
							maxLength={14}
							error={error?.message}
							styles={{
								input: {
									fontFamily: "monospace",
									letterSpacing: "0.1em",
								},
							}}
						/>
						<Button
							type="submit"
							loading={isPending}
							disabled={!form.inviteCode.trim() || !form.recoveryCode.trim()}
							fullWidth
						>
							복구하기
						</Button>
					</Stack>
				</form>
			)}
		</Modal>
	);
};
