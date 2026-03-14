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
	await supabase.storage.from("trip-photos").remove([path]);
}

export function useDeletePost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ postId, tripId, imageUrl }: Input) => {
			await supabase.from("comments").delete().eq("post_id", postId);

			if (imageUrl) await deleteStorageImage(imageUrl);

			const { error } = await supabase.from("posts").delete().eq("id", postId);
			if (error) throw new Error(error.message);

			return tripId;
		},
		onSuccess: (tripId) => {
			queryClient.invalidateQueries({ queryKey: ["posts", tripId] });
		},
	});
}
