import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { getDeviceId } from "@/shared/lib";
import { getLocalTripIds, syncLocalTripIds } from "./localStorage";
import type { Trip } from "./types";

export function useMyTrips() {
	return useQuery<Trip[]>({
		queryKey: ["my-trips"],
		// localStorage IDs가 있으면 즉시 렌더링 (로딩 스피너 없이)
		// 서버 응답이 오면 TanStack Query가 자동으로 교체
		placeholderData: () => {
			const ids = getLocalTripIds();
			// ID만 알고 있어서 빈 배열 반환 → Skeleton 표시
			// 데이터가 캐시에 있으면 TanStack Query가 캐시를 우선 사용
			return ids.length > 0 ? undefined : [];
		},
		queryFn: async () => {
			const deviceId = getDeviceId();

			// 서버가 소스 오브 트루스: trip_members WHERE device_id = ?
			const { data, error } = await supabase
				.from("trip_members")
				.select("trips(*)")
				.eq("device_id", deviceId)
				.order("created_at", { ascending: false });

			if (error) throw new Error(error.message);

			const trips = (data ?? [])
				.map((row) => (row as unknown as { trips: Trip }).trips)
				.filter(Boolean)
				.filter(
					(trip) =>
						localStorage.getItem(`trip-thread:token:${trip.id}`) !== null,
				);

			// localStorage를 서버 기준으로 동기화 (추가·삭제 모두 반영)
			syncLocalTripIds(trips.map((t) => t.id));

			return trips;
		},
	});
}
