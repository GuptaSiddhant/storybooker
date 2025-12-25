import type { BuildStoryType } from "storybooker/types";

type GroupedStories = Record<string, Record<string, BuildStoryType[]>>;

export function groupStoriesByTitle(stories: BuildStoryType[]): GroupedStories {
  const groupedStories: GroupedStories = {};

  for (const story of stories) {
    if (story.type === "docs") {
      continue;
    }

    const titleParts = story.title.split("/").map((part) => part.trim());

    if (titleParts.length === 1) {
      titleParts.unshift("Others");
    }

    const [groupTitle, ...storyTitleParts] = titleParts;
    const storyTitle = storyTitleParts.join("/");

    if (!groupTitle) {
      continue;
    }

    if (groupedStories[groupTitle]) {
      const group = groupedStories[groupTitle];

      if (group[storyTitle]) {
        group[storyTitle].push(story);
      } else {
        group[storyTitle] = [story];
      }
    } else {
      groupedStories[groupTitle] = {
        [storyTitle]: [story],
      };
    }
  }

  return groupedStories;
}
