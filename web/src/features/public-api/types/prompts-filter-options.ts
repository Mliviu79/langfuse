import { z } from "zod";

const PromptFilterOption = z.object({ value: z.string() }).strict();

export const GetPromptsFilterOptionsV2Query = z.object({}).strict();

export const GetPromptsFilterOptionsV2Response = z
  .object({
    name: z.array(PromptFilterOption),
    tags: z.array(PromptFilterOption),
    labels: z.array(PromptFilterOption),
  })
  .strict();
