import { SyntheticEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Button,
	CopyButton,
	Group,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useJoinTrip } from "@/features/join-trip/model/useJoinTrip";
import { formatRecoveryCode } from "@/shared/lib";
import type { JoinTripResult } from "@/features/join-trip/model/useJoinTrip";

export const JoinTripForm = () => {
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const [nickname, setNickname] = useState("");
	const [result, setResult] = useState<JoinTripResult | null>(null);
	const { mutateAsync, isPending, error, reset } = useJoinTrip();
	const { t } = useTranslation();

	const handleSubmit = async (e: SyntheticEvent) => {
		e.preventDefault();
		const res = await mutateAsync({
			code: code.trim(),
			nickname: nickname.trim(),
		});
		setResult(res);
	};

	if (result) {
		return (
			<Stack gap="sm">
				<Alert color="yellow" title={t("joinTrip.recoveryTitle")}>
					<Text size="sm" mb="xs">
						{t("joinTrip.recoveryExplanation")}
					</Text>
					<Group gap="xs" align="center">
						<Text fw={700} ff="monospace" size="lg">
							{formatRecoveryCode(result.recoveryCode)}
						</Text>
						<CopyButton value={result.recoveryCode}>
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
				<Button fullWidth onClick={() => navigate(`/trip/${result.trip.id}`)}>
					{t("joinTrip.goToTrip")}
				</Button>
			</Stack>
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="sm">
				<TextInput
					placeholder={t("joinTrip.inviteCodePlaceholder")}
					value={code}
					onChange={(e) => {
						reset();
						setCode(e.target.value.toUpperCase());
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
				{code.length === 6 && (
					<Group gap="sm" align="flex-start">
						<TextInput
							placeholder={t("joinTrip.nicknamePlaceholder")}
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							error={error?.message}
							className="flex-1"
						/>
						<Button
							type="submit"
							loading={isPending}
							disabled={!nickname.trim()}
						>
							{t("joinTrip.submit")}
						</Button>
					</Group>
				)}
			</Stack>
		</form>
	);
};
