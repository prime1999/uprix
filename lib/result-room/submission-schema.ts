import { z } from "zod";

export const submissionFileSchema = z.object({
  publicId: z.string().trim().min(1, "Cloudinary public ID is required."),

  secureUrl: z
    .string()
    .trim()
    .url("A valid Cloudinary secure URL is required."),
});

export const submissionSchema = z.object({
  timezone: z.string().trim().min(1, "Participant timezone is required."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .default(""),

  files: z
    .array(submissionFileSchema)
    .min(1, "At least one image is required.")
    .max(5, "A maximum of 5 images is allowed."),
});

export type SubmissionPayload = z.infer<typeof submissionSchema>;
