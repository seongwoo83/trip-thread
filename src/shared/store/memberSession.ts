import { create } from "zustand";

type MemberRole = "host" | "member";

type MemberSessionState = {
	memberId: string | null;
	memberRole: MemberRole | null;
	setMember: (id: string, role: MemberRole) => void;
	clearMember: () => void;
};

export const useMemberSession = create<MemberSessionState>((set) => ({
	memberId: null,
	memberRole: null,
	setMember: (id, role) => set({ memberId: id, memberRole: role }),
	clearMember: () => set({ memberId: null, memberRole: null }),
}));
