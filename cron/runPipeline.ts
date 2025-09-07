import { runPipeline } from "./pipelineCron";

export const handler = async () => {
  await runPipeline();
};
