import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { addLocalTripId } from "@/entities/trip";
import type { Trip } from "@/entities/trip";
import {
	getDeviceId,
	generateInviteCode,
	generateRecoveryCode,
	generateToken,
	hashToken,
	setMemberToken,
} from "@/shared/lib";

type CreateTripInput = {
	name: string;
	start_date: string;
	end_date: string;
	nickname: string;
};

export type CreateTripResult = {
	trip: Trip;
	recoveryCode: string;
};

export function useCreateTrip() {
	const qc = useQueryClient();

	return useMutation<CreateTripResult, Error, CreateTripInput>({
		mutationFn: async ({ nickname, ...tripData }) => {
			// invite_code: 중복 시 최대 3회 재시도
			const trip = await (async () => {
				for (let attempt = 0; attempt < 3; attempt++) {
					const invite_code = generateInviteCode();
					const { data, error } = await supabase
						.from("trips")
						.insert({ ...tripData, invite_code })
						.select()
						.single();

					if (!error && data) return data as Trip;
					// 23505 = unique_violation (invite_code 중복)
					if (!error || error.code !== "23505") {
						throw new Error(error?.message ?? "여행 생성에 실패했어요");
					}
				}
				throw new Error("초대 코드 생성에 실패했어요. 다시 시도해주세요.");
			})();

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
					role: "host",
					member_token_hash: memberTokenHash,
					recovery_code_hash: recoveryCodeHash,
				});

			if (memberError) throw new Error(memberError.message);

			setMemberToken(trip.id, memberToken);
			addLocalTripId(trip.id);

			return { trip, recoveryCode };
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["my-trips"] });
		},
	});
}
