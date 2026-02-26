import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { addLocalTripId } from "@/entities/trip";
import type { Trip } from "@/entities/trip";
import {
	generateRecoveryCode,
	generateToken,
	hashToken,
	setMemberToken,
} from "@/shared/lib";

type RecoverInput = {
	inviteCode: string;
	recoveryCode: string;
};

export type RecoverResult = {
	trip: Trip;
	newRecoveryCode: string;
};

export function useRecoverMembership() {
	const qc = useQueryClient();

	return useMutation<RecoverResult, Error, RecoverInput>({
		mutationFn: async ({ inviteCode, recoveryCode }) => {
			// 1. 초대 코드로 여행 찾기
			const { data: trip, error: tripError } = await supabase
				.from("trips")
				.select("*")
				.eq("invite_code", inviteCode.toUpperCase())
				.single();

			if (tripError || !trip) throw new Error("유효하지 않은 초대 코드예요");

			// 2. 복구 코드 해시 후 매칭 멤버 찾기
			const normalized = recoveryCode.replace(/-/g, "").toUpperCase();
			const recoveryCodeHash = await hashToken(normalized);

			const { data: member, error: memberError } = await supabase
				.from("trip_members")
				.select("id")
				.eq("trip_id", trip.id)
				.eq("recovery_code_hash", recoveryCodeHash)
				.single();

			if (memberError || !member) throw new Error("복구 코드가 일치하지 않아요");

			// 3. 새 토큰 + 복구 코드 발급 (rotation)
			const newMemberToken = generateToken();
			const newRecoveryCode = generateRecoveryCode();
			const [newMemberTokenHash, newRecoveryCodeHash] = await Promise.all([
				hashToken(newMemberToken),
				hashToken(newRecoveryCode),
			]);

			// 4. DB 업데이트
			const { error: updateError } = await supabase
				.from("trip_members")
				.update({
					member_token_hash: newMemberTokenHash,
					recovery_code_hash: newRecoveryCodeHash,
				})
				.eq("id", member.id);

			if (updateError) throw new Error(updateError.message);

			// 5. 로컬 저장
			setMemberToken(trip.id, newMemberToken);
			addLocalTripId(trip.id);

			return { trip: trip as Trip, newRecoveryCode };
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-trips"] });
		},
	});
}
