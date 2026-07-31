import { prisma } from "@langfuse/shared/src/db";
import { makeZodVerifiedAPICall } from "@/src/__tests__/test-utils";
import { GetPromptsFilterOptionsV2Response } from "@/src/features/public-api/types/prompts-filter-options";
import { createOrgProjectAndApiKey } from "@langfuse/shared/src/server";
import { PromptType } from "@langfuse/shared";
import { v4 as uuidv4 } from "uuid";

const seedPrompt = async (params: {
  projectId: string;
  name: string;
  version: number;
  labels: string[];
  tags: string[];
}) =>
  prisma.prompt.create({
    data: {
      id: uuidv4(),
      name: params.name,
      prompt: "hello",
      labels: params.labels,
      tags: params.tags,
      version: params.version,
      config: {},
      type: PromptType.Text,
      project: { connect: { id: params.projectId } },
      createdBy: "test",
    },
  });

describe("GET /api/public/v2/prompts/filterOptions", () => {
  let auth: string;
  let projectId: string;

  beforeEach(async () => {
    const created = await createOrgProjectAndApiKey();
    auth = created.auth;
    projectId = created.projectId;
  });

  it("returns empty arrays when no prompts exist", async () => {
    const response = await makeZodVerifiedAPICall(
      GetPromptsFilterOptionsV2Response,
      "GET",
      "/api/public/v2/prompts/filterOptions",
      undefined,
      auth,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: [], tags: [], labels: [] });
  });

  it("returns distinct names, tags, and labels sorted ascending", async () => {
    await seedPrompt({
      projectId,
      name: "beta",
      version: 1,
      labels: ["production", "staging"],
      tags: ["nlp", "vision"],
    });
    await seedPrompt({
      projectId,
      name: "alpha",
      version: 1,
      labels: ["production"],
      tags: ["nlp"],
    });
    await seedPrompt({
      projectId,
      name: "alpha",
      version: 2,
      labels: ["latest"],
      tags: ["nlp"],
    });

    const response = await makeZodVerifiedAPICall(
      GetPromptsFilterOptionsV2Response,
      "GET",
      "/api/public/v2/prompts/filterOptions",
      undefined,
      auth,
    );

    expect(response.status).toBe(200);
    expect(response.body.name).toEqual([{ value: "alpha" }, { value: "beta" }]);
    expect(response.body.tags).toEqual([{ value: "nlp" }, { value: "vision" }]);
    expect(response.body.labels).toEqual([
      { value: "latest" },
      { value: "production" },
      { value: "staging" },
    ]);
  });

  it("scopes results to the caller's project", async () => {
    const other = await createOrgProjectAndApiKey();
    await seedPrompt({
      projectId: other.projectId,
      name: "not-mine",
      version: 1,
      labels: ["production"],
      tags: ["other-tag"],
    });

    const response = await makeZodVerifiedAPICall(
      GetPromptsFilterOptionsV2Response,
      "GET",
      "/api/public/v2/prompts/filterOptions",
      undefined,
      auth,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: [], tags: [], labels: [] });
  });
});
