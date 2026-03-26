import { useRef, useState } from "react";
import { Button, Textarea } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useCreatePost } from "../model/useCreatePost";
import { uploadTripPhoto } from "@/shared/lib";
import styles from "@/features/post-editor/ui/PostEditor.module.scss";

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
			<div className={styles.card}>
				<Textarea
					placeholder={t("createPost.placeholder")}
					value={content}
					onChange={(e) => setContent(e.target.value)}
					minRows={3}
					autosize
					classNames={{ input: styles.textareaInput }}
				/>

				{imagePreview && (
					<div className={styles.previewWrap}>
						<img src={imagePreview} alt="" className={styles.previewImage} />
						<button
							type="button"
							onClick={removeImage}
							className={styles.removeImageButton}
						>
							✕
						</button>
					</div>
				)}

				<div className={styles.footer}>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className={styles.uploadButton}
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
						className={canSubmit ? styles.submitButton : undefined}
					>
						{t("createPost.submit")}
					</Button>
				</div>
			</div>
		</form>
	);
};
