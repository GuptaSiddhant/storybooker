import { BuildSHASchema, LabelSlugSchema } from "#utils/shared-model";
import z from "zod";

export const labelTypes = ["branch", "pr", "jira"] as const;

export type LabelType = z.infer<typeof LabelSchema>;
/** @private */
export const LabelSchema = z
  .object({
    buildsCount: z.number().default(0),
    createdAt: z.iso.datetime().default(new Date().toISOString()),
    id: LabelSlugSchema,
    latestBuildSHA: z.union([BuildSHASchema.optional(), z.literal("")]),
    slug: LabelSlugSchema,
    type: z.enum(labelTypes),
    updatedAt: z.iso.datetime().default(new Date().toISOString()),
    value: z.string().meta({ description: "The value of the label." }),
  })
  .meta({ id: "label", title: "StoryBooker Label" });

export type LabelCreateType = z.infer<typeof LabelCreateSchema>;
export const LabelCreateSchema = LabelSchema.omit({
  buildsCount: true,
  createdAt: true,
  id: true,
  slug: true,
  updatedAt: true,
});

export type LabelUpdateType = z.infer<typeof LabelUpdateSchema>;
export const LabelUpdateSchema = LabelSchema.omit({
  createdAt: true,
  id: true,
  slug: true,
  updatedAt: true,
}).partial();

export type LabelsListResultType = z.infer<typeof LabelsListResultSchema>;
export const LabelsListResultSchema = z.object({
  labels: LabelSchema.array(),
});
export type LabelsGetResultType = z.infer<typeof LabelsGetResultSchema>;
export const LabelsGetResultSchema = z.object({
  label: LabelSchema,
});
