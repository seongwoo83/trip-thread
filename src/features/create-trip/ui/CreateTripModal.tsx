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
import { useTranslation } from "react-i18next";
import { useCreateTrip } from "@/features/create-trip/model/useCreateTrip";
import type { CreateTripResult } from "@/features/create-trip/model/useCreateTrip";
import { formatRecoveryCode } from "@/shared/lib";
import styles from "./CreateTripModal.module.scss";

type Props = {
	opened: boolean;
	onClose: () => void;
};

const EMPTY_FORM = {
	name: "",
	start_date: "",
	end_date: "",
	nickname: "",
};

export const CreateTripModal = ({ opened, onClose }: Props) => {
	const navigate = useNavigate();
	const { mutateAsync, isPending } = useCreateTrip();
	const { t } = useTranslation();

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
				title={
					<Text fw={700} className={styles.modalTitle}>
						{t("createTrip.success.title")}
					</Text>
				}
				centered
			>
				<Stack gap="lg">
					<div>
						<Text size="sm" mb="xs" className={styles.subtitle}>
							{t("createTrip.success.subtitle")}
						</Text>
						<div className={styles.inviteCard}>
							<span className={styles.inviteCode}>
								{result.trip.invite_code}
							</span>
							<CopyButton value={result.trip.invite_code}>
								{({ copied, copy }) => (
									<Button size="xs" variant="light" radius="xl" onClick={copy}>
										{copied ? t("common.copied") : t("common.copy")}
									</Button>
								)}
							</CopyButton>
						</div>
					</div>

					<Alert
						color="yellow"
						title={t("createTrip.success.recoveryTitle")}
						variant="light"
					>
						<Text size="sm" mb="sm">
							{t("createTrip.success.recoveryDescription")}
						</Text>
						<div className={styles.recoveryCard}>
							<span className={styles.recoveryCode}>{displayRecovery}</span>
							<CopyButton value={result.recoveryCode}>
								{({ copied, copy }) => (
									<Button
										size="xs"
										color="yellow"
										variant="light"
										radius="xl"
										onClick={copy}
									>
										{copied ? t("common.copied") : t("common.copy")}
									</Button>
								)}
							</CopyButton>
						</div>
					</Alert>

					<Group>
						<Button variant="subtle" onClick={handleClose} flex={1}>
							{t("common.close")}
						</Button>
						<Button
							flex={2}
							onClick={() => {
								handleClose();
								navigate(`/trip/${result.trip.id}`);
							}}
							className={styles.primaryButton}
						>
							{t("createTrip.success.goToTrip")}
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
			title={
				<Text fw={700} className={styles.modalTitle}>
					{t("createTrip.title")}
				</Text>
			}
			centered
		>
			<form onSubmit={handleSubmit}>
				<Stack gap="md">
					<TextInput
						label={t("createTrip.form.tripName")}
						placeholder={t("createTrip.form.tripNamePlaceholder")}
						required
						value={form.name}
						onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
					/>

					<DatePickerInput
						type="range"
						label={t("createTrip.form.period")}
						placeholder={t("createTrip.form.periodPlaceholder")}
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
						label={t("createTrip.form.nickname")}
						placeholder={t("createTrip.form.nicknamePlaceholder")}
						required
						value={form.nickname}
						onChange={(e) =>
							setForm((f) => ({ ...f, nickname: e.target.value }))
						}
					/>
					<Button
						type="submit"
						loading={isPending}
						mt="xs"
						className={styles.primaryButton}
					>
						{t("createTrip.form.submit")}
					</Button>
				</Stack>
			</form>
		</Modal>
	);
};
