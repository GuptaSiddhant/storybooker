import z from "zod";
import { BuildSHASchema, LabelSlugSchema } from "#utils/shared-model";

export const labelTypes = ["branch", "pr", "jira"] as const;

export type LabelType = z.infer<typeof LabelSchema>;
/** @private */
export const LabelSchema = z
  .object({
    id: LabelSlugSchema,
    latestBuildSHA: z.optional(BuildSHASchema),
    timestamp: z.string().optional(),
    type: z.enum(labelTypes),
    value: z.string().meta({ description: "The value of the label." }),
  })
  .meta({ description: "StoryBooker label.", id: "label" });

export type LabelCreateType = z.infer<typeof LabelCreateSchema>;
export const LabelCreateSchema = LabelSchema.omit({
  id: true,
  timestamp: true,
});

export type LabelUpdateType = z.infer<typeof LabelUpdateSchema>;
export const LabelUpdateSchema = LabelSchema.omit({
  id: true,
  timestamp: true,
}).partial();

export type LabelsListResultType = z.infer<typeof LabelsListResultSchema>;
export const LabelsListResultSchema = z.object({
  labels: LabelSchema.array(),
});
export type LabelsGetResultType = z.infer<typeof LabelsGetResultSchema>;
export const LabelsGetResultSchema = z.object({
  label: LabelSchema,
});
