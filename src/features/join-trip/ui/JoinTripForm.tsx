import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Group, TextInput } from "@mantine/core";
import { useJoinTrip } from "@/features/join-trip/model/useJoinTrip";

export const JoinTripForm = () => {
	const navigate = useNavigate();
	const [code, setCode] = useState("");
	const { mutateAsync, isPending, error, reset } = useJoinTrip();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trip = await mutateAsync(code.trim());
		navigate(`/trip/${trip.id}`);
	};

	return (
		<form onSubmit={handleSubmit}>
			<Group gap="sm" align="flex-start">
				<TextInput
					placeholder="초대 코드 입력 (예: ABC123)"
					value={code}
					onChange={(e) => {
						reset();
						setCode(e.target.value.toUpperCase());
					}}
					maxLength={6}
					error={error?.message}
					className="flex-1"
					styles={{
						input: {
							fontFamily: "monospace",
							letterSpacing: "0.15em",
							textTransform: "uppercase",
						},
					}}
				/>
				<Button
					type="submit"
					loading={isPending}
					disabled={code.length < 6}
					style={{ marginTop: error ? 0 : undefined }}
				>
					참여하기
				</Button>
			</Group>
		</form>
	);
};
