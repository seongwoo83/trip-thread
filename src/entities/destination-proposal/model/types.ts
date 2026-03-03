export type DestinationProposal = {
	id: string;
	trip_id: string;
	proposed_by: string; // trip_members.id
	name: string;
	created_at: string;
};

export type DestinationVote = {
	id: string;
	proposal_id: string;
	member_id: string;
	trip_id: string;
	created_at: string;
};

export type ProposalWithVotes = DestinationProposal & {
	voteCount: number;
	hasMyVote: boolean;
};
