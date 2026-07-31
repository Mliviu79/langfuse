import { withMiddlewares } from "@/src/features/public-api/server/withMiddlewares";
import { createAuthedProjectAPIRoute } from "@/src/features/public-api/server/createAuthedProjectAPIRoute";
import {
  GetPromptsFilterOptionsV2Query,
  GetPromptsFilterOptionsV2Response,
} from "@/src/features/public-api/types/prompts-filter-options";
import { getPromptsFilterOptions } from "@/src/features/prompts/server/actions/getPromptsFilterOptions";

export default withMiddlewares({
  GET: createAuthedProjectAPIRoute({
    name: "Get Prompts Filter Options",
    querySchema: GetPromptsFilterOptionsV2Query,
    responseSchema: GetPromptsFilterOptionsV2Response,
    isAdminApiKeyAuthAllowed: true,
    fn: async ({ auth }) => {
      return getPromptsFilterOptions({ projectId: auth.scope.projectId });
    },
  }),
});
