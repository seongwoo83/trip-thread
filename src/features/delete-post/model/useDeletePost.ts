import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	postId: string;
	tripId: string;
	imageUrl: string | null;
};

async function deleteStorageImage(imageUrl: string) {
	const path = imageUrl.split("/trip-photos/")[1];
	if (!path) return;
	const { error } = await supabase.storage.from("trip-photos").remove([path]);
	if (error) throw new Error(error.message);
}

export function useDeletePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ postId, tripId, imageUrl }: Input) => {
			if (imageUrl) await deleteStorageImage(imageUrl);

			// comments는 DB의 ON DELETE CASCADE로 자동 삭제됨
			const { error } = await supabase.from("posts").delete().eq("id", postId);
			if (error) throw new Error(error.message);

			return tripId;
		},
		onSuccess: (tripId) => {
			queryClient.invalidateQueries({ queryKey: ["posts", tripId] });
		},
	});
}
