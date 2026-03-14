import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	commentId: string;
	postId: string;
};

export function useDeleteComment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ commentId, postId }: Input) => {
			const { error } = await supabase
				.from("comments")
				.delete()
				.eq("id", commentId);
			if (error) throw new Error(error.message);

			return postId;
		},
		onSuccess: (postId) => {
			queryClient.invalidateQueries({ queryKey: ["comments", postId] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
		},
	});
}
