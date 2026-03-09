import { supabase } from "@/shared/api";

export async function uploadTripPhoto(
	tripId: string,
	file: File,
): Promise<string> {
	const ext = file.name.split(".").pop() ?? "jpg";
	const path = `${tripId}/${crypto.randomUUID()}.${ext}`;

	const { error } = await supabase.storage
		.from("trip-photos")
		.upload(path, file);
	if (error) throw new Error(error.message);

	const { data } = supabase.storage.from("trip-photos").getPublicUrl(path);
	return data.publicUrl;
}
