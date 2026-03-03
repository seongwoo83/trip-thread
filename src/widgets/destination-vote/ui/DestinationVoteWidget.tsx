import { useState } from "react";
import { Button, Progress, Stack, Text, TextInput } from "@mantine/core";
import { useDestinationProposals } from "@/entities/destination-proposal";
import { useProposeDestination } from "@/features/propose-destination";
import { useVoteDestination } from "@/features/vote-destination";
import { useConfirmDestination } from "@/features/confirm-destination";

type Props = {
	tripId: string;
	memberId: string;
	role: "host" | "member";
};

export const DestinationVoteWidget = ({ tripId, memberId, role }: Props) => {
	const [proposeInput, setProposeInput] = useState("");
	const [showProposeForm, setShowProposeForm] = useState(false);

	const { proposals, totalVotes, myVotedProposalId } = useDestinationProposals(
		tripId,
		memberId,
	);

	const propose = useProposeDestination();
	const vote = useVoteDestination();
	const confirm = useConfirmDestination();

	const handlePropose = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!proposeInput.trim()) return;
		await propose.mutateAsync({ tripId, memberId, name: proposeInput });
		setProposeInput("");
		setShowProposeForm(false);
	};

	const handleVote = (proposalId: string) => {
		vote.mutate({ tripId, memberId, proposalId });
	};

	const handleConfirm = () => {
		confirm.mutate({ tripId });
	};

	return (
		<Stack gap="xl">
			{/* 헤더 */}
			<div>
				<h2
					className="text-xl font-bold text-gray-900"
					style={{ fontFamily: "Paperozi" }}
				>
					어디로 떠날까요?
				</h2>
				<Text size="sm" c="gray.5" mt={4}>
					여행지를 제안하고 투표해보세요. 과반수가 선택한 곳으로 확정돼요.
				</Text>
			</div>

			{/* 제안 목록 */}
			{proposals.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-12 text-center">
					<Text size="sm" c="gray.4">
						아직 제안된 여행지가 없어요
					</Text>
					<Text size="xs" c="gray.4" mt={4}>
						첫 번째로 여행지를 제안해보세요!
					</Text>
				</div>
			) : (
				<Stack gap="sm">
					{proposals.map((p) => {
						const pct = totalVotes > 0 ? (p.voteCount / totalVotes) * 100 : 0;
						const isMyVote = p.hasMyVote;
						const canVote = !myVotedProposalId;

						return (
							<div
								key={p.id}
								className={`rounded-2xl border p-4 transition-all ${
									isMyVote
										? "border-indigo-300 bg-indigo-50/60"
										: "border-gray-200 bg-white"
								}`}
							>
								<div className="mb-2 flex items-center justify-between">
									<div className="flex items-center gap-2">
										{isMyVote && (
											<span className="text-xs font-medium text-indigo-500">
												✓ 내 투표
											</span>
										)}
										<Text fw={600} size="sm">
											{p.name}
										</Text>
									</div>
									<div className="flex items-center gap-2">
										<Text size="xs" c="gray.5">
											{p.voteCount}표
											{totalVotes > 0 && ` (${Math.round(pct)}%)`}
										</Text>
										{canVote && (
											<Button
												size="xs"
												variant="light"
												radius="xl"
												loading={
													vote.isPending && vote.variables?.proposalId === p.id
												}
												onClick={() => handleVote(p.id)}
											>
												투표
											</Button>
										)}
									</div>
								</div>
								<Progress
									value={pct}
									size="xs"
									radius="xl"
									color={isMyVote ? "indigo" : "gray"}
								/>
							</div>
						);
					})}
				</Stack>
			)}

			{/* 투표 현황 요약 */}
			{totalVotes > 0 && (
				<Text size="xs" c="gray.4" ta="center">
					총 {totalVotes}명 투표 완료
				</Text>
			)}

			{/* 여행지 제안 폼 */}
			{showProposeForm ? (
				<form onSubmit={handlePropose}>
					<Stack gap="xs">
						<TextInput
							placeholder="예: 일본 오사카, 베트남 다낭..."
							value={proposeInput}
							onChange={(e) => setProposeInput(e.target.value)}
							autoFocus
						/>
						<div className="flex gap-2">
							<Button
								type="submit"
								size="sm"
								loading={propose.isPending}
								disabled={!proposeInput.trim()}
								flex={1}
							>
								제안하기
							</Button>
							<Button
								size="sm"
								variant="subtle"
								color="gray"
								onClick={() => {
									setShowProposeForm(false);
									setProposeInput("");
								}}
							>
								취소
							</Button>
						</div>
					</Stack>
				</form>
			) : (
				<Button
					variant="light"
					radius="xl"
					onClick={() => setShowProposeForm(true)}
				>
					+ 여행지 제안하기
				</Button>
			)}

			{/* 호스트 전용: 투표 마감 */}
			{role === "host" && proposals.length > 0 && (
				<div className="border-t border-gray-100 pt-4">
					<Text size="xs" c="gray.4" mb="xs" ta="center">
						충분히 투표가 이뤄졌다면 투표를 마감할 수 있어요.
					</Text>
					<Button
						fullWidth
						variant="outline"
						color="gray"
						radius="xl"
						size="sm"
						loading={confirm.isPending}
						onClick={handleConfirm}
					>
						투표 마감 (최다 득표 여행지로 확정)
					</Button>
				</div>
			)}
		</Stack>
	);
};
