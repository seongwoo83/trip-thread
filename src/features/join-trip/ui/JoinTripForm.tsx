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
import { useJoinTrip } from "@/features/join-trip/model/useJoinTrip";
import { formatRecoveryCode } from "@/shared/lib";
import type { JoinTripResult } from "@/features/join-trip/model/useJoinTrip";

export const JoinTripForm = () => {
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const [nickname, setNickname] = useState("");
	const [result, setResult] = useState<JoinTripResult | null>(null);
	const { mutateAsync, isPending, error, reset } = useJoinTrip();

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
				<Alert color="yellow" title="복구 코드를 저장해두세요">
					<Text size="sm" mb="xs">
						기기를 바꾸거나 데이터가 초기화되면 이 코드로 여행 접근권을 복구할
						수 있어요.
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
									{copied ? "복사됨" : "복사"}
								</Button>
							)}
						</CopyButton>
					</Group>
				</Alert>
				<Button fullWidth onClick={() => navigate(`/trip/${result.trip.id}`)}>
					여행으로 이동
				</Button>
			</Stack>
		);
	}

	return (
		<form onSubmit={handleSubmit}>
			<Stack gap="sm">
				<TextInput
					placeholder="초대 코드 입력 (예: ABC123)"
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
							placeholder="여행에서 불릴 닉네임"
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
							참여하기
						</Button>
					</Group>
				)}
			</Stack>
		</form>
	);
};
