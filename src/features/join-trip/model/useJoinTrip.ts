import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { addLocalTripId } from "@/entities/trip";
import type { Trip } from "@/entities/trip";
import {
	getDeviceId,
	generateRecoveryCode,
	generateToken,
	hashToken,
	setMemberToken,
} from "@/shared/lib";

type JoinTripInput = {
	code: string;
	nickname: string;
};

export type JoinTripResult = {
	trip: Trip;
	recoveryCode: string;
};

export function useJoinTrip() {
	const qc = useQueryClient();

	return useMutation<JoinTripResult, Error, JoinTripInput>({
		mutationFn: async ({ code, nickname }) => {
			// 초대 코드로 여행 찾기
			const { data: trip, error } = await supabase
				.from("trips")
				.select("*")
				.eq("invite_code", code.toUpperCase())
				.single();

			if (error || !trip) throw new Error("유효하지 않은 초대 코드예요");

			// 이미 참여한 여행인지 확인
			const { data: existing } = await supabase
				.from("trip_members")
				.select("id")
				.eq("trip_id", trip.id)
				.eq("device_id", getDeviceId())
				.maybeSingle();

			if (existing) throw new Error("이미 참여한 여행이에요");

			// 멤버 자격증명 생성 (클라이언트 생성, DB에는 hash만 저장)
			const memberToken = generateToken();
			const recoveryCode = generateRecoveryCode();
			const [memberTokenHash, recoveryCodeHash] = await Promise.all([
				hashToken(memberToken),
				hashToken(recoveryCode),
			]);

			const { error: memberError } = await supabase
				.from("trip_members")
				.insert({
					trip_id: trip.id,
					device_id: getDeviceId(),
					nickname,
					role: "member",
					member_token_hash: memberTokenHash,
					recovery_code_hash: recoveryCodeHash,
				});

			if (memberError) throw new Error(memberError.message);

			setMemberToken(trip.id, memberToken);
			addLocalTripId(trip.id);

			return { trip: trip as Trip, recoveryCode };
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-trips"] });
		},
	});
}
