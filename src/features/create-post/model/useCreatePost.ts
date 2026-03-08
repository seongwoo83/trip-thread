import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";

type Input = {
	tripId: string;
	authorId: string;
	content: string;
};

export function useCreatePost() {
	const qc = useQueryClient();

	return useMutation<void, Error, Input>({
		mutationFn: async ({ tripId, authorId, content }) => {
			const { error } = await supabase.from("posts").insert({
				trip_id: tripId,
				author_id: authorId,
				content: content.trim(),
			});
			if (error) throw new Error(error.message);
		},
		onSuccess: (_data, { tripId }) => {
			qc.invalidateQueries({ queryKey: ["posts", tripId] });
		},
	});
}
