import { useRef, useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useCreatePost } from "../model/useCreatePost";
import { uploadTripPhoto } from "@/shared/lib";

type Props = {
	tripId: string;
	authorId: string;
};

export const CreatePostForm = ({ tripId, authorId }: Props) => {
	const [content, setContent] = useState("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const createPost = useCreatePost();
	const { t } = useTranslation();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

	const removeImage = () => {
		setImageFile(null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		if (!content.trim() && !imageFile) return;

		let imageUrl: string | null = null;
		if (imageFile) {
			imageUrl = await uploadTripPhoto(tripId, imageFile);
		}

		await createPost.mutateAsync({ tripId, authorId, content, imageUrl });
		setContent("");
		setImageFile(null);
		setImagePreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const canSubmit = !createPost.isPending && (!!content.trim() || !!imageFile);

	return (
		<form onSubmit={handleSubmit}>
			<div className="rounded-2xl border border-gray-200 bg-white p-4">
				<Textarea
					placeholder={t("createPost.placeholder")}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					minRows={3}
					autosize
					styles={{
						input: {
							border: "none",
							padding: 0,
							fontSize: "0.9rem",
							resize: "none",
						},
					}}
				/>

				{/* 이미지 미리보기 */}
				{imagePreview && (
					<div className="relative mt-3">
						<img
							src={imagePreview}
							alt=""
							className="max-h-60 w-full rounded-xl object-cover"
						/>
						<button
							type="button"
							onClick={removeImage}
							className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70"
						>
							✕
						</button>
					</div>
				)}

				<div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
					{/* 사진 첨부 버튼 */}
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors"
					>
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<circle cx="8.5" cy="8.5" r="1.5" />
							<polyline points="21 15 16 10 5 21" />
						</svg>
						{t("createPost.photo")}
					</button>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleFileChange}
					/>

					<Button
						type="submit"
						size="sm"
						radius="xl"
						loading={createPost.isPending}
						disabled={!canSubmit}
					>
						{t("createPost.submit")}
					</Button>
				</div>
			</div>
		</form>
	);
};
