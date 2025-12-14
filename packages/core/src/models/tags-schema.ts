import { z } from "zod";
import { TagTypes } from "../utils/constants.ts";
import { BuildIdSchema, TagIdSchema } from "./~shared-schema.ts";

export { TagIdSchema, TagTypes };

export type TagVariant = (typeof TagTypes)[number];

export type TagType = z.infer<typeof TagSchema>;
export const TagSchema = z
  .object({
    buildsCount: z.number().default(0),
    createdAt: z.iso.datetime().default(new Date().toISOString()),
    id: TagIdSchema,
    latestBuildId: z.union([BuildIdSchema.optional(), z.literal("")]),
    type: z.enum(TagTypes),
    updatedAt: z.iso.datetime().default(new Date().toISOString()),
    value: z.string().meta({ description: "The value of the tag." }),
  })
  .meta({ id: "Tag", title: "StoryBooker Tag" });

export type TagCreateType = z.infer<typeof TagCreateSchema>;
export const TagCreateSchema = TagSchema.omit({
  buildsCount: true,
  createdAt: true,
  id: true,

  updatedAt: true,
});

export type TagUpdateType = z.infer<typeof TagUpdateSchema>;
export const TagUpdateSchema = TagSchema.omit({
  createdAt: true,
  id: true,
  updatedAt: true,
}).partial();

export type TagsListResultType = z.infer<typeof TagsListResultSchema>;
export const TagsListResultSchema = z.object({
  tags: TagSchema.array(),
});
export type TagsGetResultType = z.infer<typeof TagsGetResultSchema>;
export const TagsGetResultSchema = z.object({
  tag: TagSchema,
});
