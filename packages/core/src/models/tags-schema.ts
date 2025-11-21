import z from "zod";
import { BuildSHASchema, TagSlugSchema } from "./~shared-schema";

export { TagSlugSchema };

export const TagTypes = ["branch", "pr", "jira"] as const;
export type TagVariant = (typeof TagTypes)[number];

export type TagType = z.infer<typeof TagSchema>;
export const TagSchema = z
  .object({
    buildsCount: z.number().default(0),
    createdAt: z.iso.datetime().default(new Date().toISOString()),
    id: TagSlugSchema,
    latestBuildSHA: z.union([BuildSHASchema.optional(), z.literal("")]),
    slug: TagSlugSchema,
    type: z.enum(TagTypes),
    updatedAt: z.iso.datetime().default(new Date().toISOString()),
    value: z.string().meta({ description: "The value of the tag." }),
  })
  .meta({ id: "tag", title: "StoryBooker Tag" });

export type TagCreateType = z.infer<typeof TagCreateSchema>;
export const TagCreateSchema = TagSchema.omit({
  buildsCount: true,
  createdAt: true,
  id: true,
  slug: true,
  updatedAt: true,
});

export type TagUpdateType = z.infer<typeof TagUpdateSchema>;
export const TagUpdateSchema = TagSchema.omit({
  createdAt: true,
  id: true,
  slug: true,
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
