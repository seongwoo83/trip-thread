import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	commentId: string;
	postId: string;
	tripId: string;
};

export function useDeleteComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ commentId, postId, tripId }: Input) => {
			const { error } = await supabase
				.from("comments")
				.delete()
				.eq("id", commentId);
			if (error) throw new Error(error.message);

			return { postId, tripId };
		},
		onSuccess: ({ postId, tripId }) => {
			queryClient.invalidateQueries({ queryKey: ["comments", postId] });
			queryClient.invalidateQueries({ queryKey: ["posts", tripId] });
		},
	});
}
