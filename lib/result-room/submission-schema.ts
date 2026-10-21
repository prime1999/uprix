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

export const updateSubmissionSchema = z
  .object({
    timezone: z.string().trim().min(1, "Participant timezone is required."),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters.")
      .default(""),

    // IDs of existing submission_files rows the participant wants to keep.
    retainedFileIds: z
      .array(z.string().uuid("Invalid submission file ID."))
      .max(5, "A maximum of 5 images is allowed.")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Duplicate retained file IDs are not allowed.",
      ),

    // Only newly uploaded images belong here.
    newFiles: z
      .array(submissionFileSchema)
      .max(5, "A maximum of 5 new images is allowed."),
  })
  .refine(
    (data) => data.retainedFileIds.length + data.newFiles.length >= 1,
    "At least one image is required.",
  )
  .refine(
    (data) => data.retainedFileIds.length + data.newFiles.length <= 5,
    "A maximum of 5 images is allowed.",
  );

export type UpdateSubmissionPayload = z.infer<typeof updateSubmissionSchema>;
