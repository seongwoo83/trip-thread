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
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();

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
		<Modal
			opened={opened}
			onClose={handleClose}
			title={t("recover.title")}
			centered
		>
			{result ? (
				<Stack gap="md">
					<Text size="sm" c="gray.7">
						{t("recover.successTitle", { tripName: result.trip.name })}
					</Text>
					<Alert color="yellow" title={t("recover.newRecoveryTitle")}>
						<Text size="sm" mb="xs">
							{t("recover.oldCodeInvalid")}
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
										{copied ? t("common.copied") : t("common.copy")}
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
						{t("recover.goToTrip")}
					</Button>
				</Stack>
			) : (
				<form onSubmit={handleSubmit}>
					<Stack gap="md">
						<TextInput
							label={t("recover.inviteCodeLabel")}
							placeholder={t("recover.inviteCodePlaceholder")}
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
							label={t("recover.recoveryCodeLabel")}
							placeholder={t("recover.recoveryCodePlaceholder")}
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
							{t("recover.submit")}
						</Button>
					</Stack>
				</form>
			)}
		</Modal>
	);
};
