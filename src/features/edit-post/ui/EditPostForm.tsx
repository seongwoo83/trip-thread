import { useRef, useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { useEditPost } from "../model/useEditPost";

type Props = {
	postId: string;
	tripId: string;
	initialContent: string;
	initialImageUrl?: string | null;
	onCancel: () => void;
	onSuccess: () => void;
};

export const EditPostForm = ({
	postId,
	tripId,
	initialContent,
	initialImageUrl,
	onCancel,
	onSuccess,
}: Props) => {
	const [content, setContent] = useState(initialContent);
	const [newImageFile, setNewImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [currentImageUrl, setCurrentImageUrl] = useState(
		initialImageUrl ?? null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const editPost = useEditPost();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setNewImageFile(file);
		setImagePreview(URL.createObjectURL(file));
		setCurrentImageUrl(null);
	};

	const removeImage = () => {
		setNewImageFile(null);
		setImagePreview(null);
		setCurrentImageUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e: { preventDefault(): void }) => {
		e.preventDefault();
		if (!content.trim() && !newImageFile && !currentImageUrl) return;

		await editPost.mutateAsync({
			postId,
			tripId,
			content,
			newImageFile,
			oldImageUrl: initialImageUrl,
			removeImage: !newImageFile && !currentImageUrl && !!initialImageUrl,
		});
		onSuccess();
	};

	const displayImage = imagePreview ?? currentImageUrl;
	const canSubmit = !editPost.isPending && (!!content.trim() || !!displayImage);

	return (
		<form onSubmit={handleSubmit}>
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				minRows={3}
				autosize
				styles={{
					input: { fontSize: "0.9rem", resize: "none" },
				}}
			/>

			{displayImage && (
				<div className="relative mt-3">
					<img
						src={displayImage}
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
					사진
				</button>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
				/>

				<div className="flex gap-2">
					<Button
						type="button"
						variant="subtle"
						size="sm"
						radius="xl"
						color="gray"
						onClick={onCancel}
					>
						취소
					</Button>
					<Button
						type="submit"
						size="sm"
						radius="xl"
						loading={editPost.isPending}
						disabled={!canSubmit}
					>
						저장
					</Button>
				</div>
			</div>
		</form>
	);
};
