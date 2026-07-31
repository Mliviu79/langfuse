import { prisma } from "@langfuse/shared/src/db";

export type GetPromptsFilterOptionsParams = {
  projectId: string;
};

export type PromptsFilterOptionsResponse = {
  name: { value: string }[];
  tags: { value: string }[];
  labels: { value: string }[];
};

export const getPromptsFilterOptions = async (
  params: GetPromptsFilterOptionsParams,
): Promise<PromptsFilterOptionsResponse> => {
  const { projectId } = params;

  const [names, tags, labels] = await Promise.all([
    prisma.prompt.groupBy({
      where: { projectId },
      by: ["name"],
      // limiting to 1k prompt names to avoid performance issues.
      // some users have unique names for large amounts of prompts
      // sending all prompt names to the FE exceeds the cloud function return size limit
      take: 1000,
      orderBy: { name: "asc" },
    }),
    prisma.$queryRaw<{ value: string }[]>`
      SELECT tags.tag as value
      FROM prompts, UNNEST(prompts.tags) AS tags(tag)
      WHERE prompts.project_id = ${projectId}
      GROUP BY tags.tag
      ORDER BY tags.tag ASC;
    `,
    prisma.$queryRaw<{ value: string }[]>`
      SELECT labels.label as value
      FROM prompts, UNNEST(prompts.labels) AS labels(label)
      WHERE prompts.project_id = ${projectId}
      GROUP BY labels.label
      ORDER BY labels.label ASC;
    `,
  ]);

  return {
    name: names
      .filter((n) => n.name !== null)
      .map((name) => ({ value: name.name ?? "undefined" })),
    tags,
    labels,
  };
};
