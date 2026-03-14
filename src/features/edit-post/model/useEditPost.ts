import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api";
import { uploadTripPhoto } from "@/shared/lib";

type Input = {
	postId: string;
	tripId: string;
	content: string;
	newImageFile?: File | null;
	oldImageUrl?: string | null;
	removeImage?: boolean;
};

async function deleteStorageImage(imageUrl: string) {
	const path = imageUrl.split("/trip-photos/")[1];
	if (!path) return;
	await supabase.storage.from("trip-photos").remove([path]);
}

export function useEditPost() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			postId,
			tripId,
			content,
			newImageFile,
			oldImageUrl,
			removeImage,
		}: Input) => {
			let imageUrl: string | null | undefined = undefined;

			if (newImageFile) {
				if (oldImageUrl) await deleteStorageImage(oldImageUrl);
				imageUrl = await uploadTripPhoto(tripId, newImageFile);
			} else if (removeImage && oldImageUrl) {
				await deleteStorageImage(oldImageUrl);
				imageUrl = null;
			}

			const patch: Record<string, unknown> = { content };
			if (imageUrl !== undefined) patch.image_url = imageUrl;

			const { error } = await supabase
				.from("posts")
				.update(patch)
				.eq("id", postId);
			if (error) throw new Error(error.message);

			return { postId, tripId };
		},
		onSuccess: ({ postId, tripId }) => {
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
			queryClient.invalidateQueries({ queryKey: ["posts", tripId] });
		},
	});
}
