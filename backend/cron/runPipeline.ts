import { runPipeline } from "./pipelineCron";

console.log("Starting runPipeline test...");

export const handler = async () => {
  console.log("Handler triggered");

  await runPipeline();
  console.log("Handler Finished");
};

if (require.main === module) {
  handler().then(() => {
    console.log("All done ✅");
    process.exit(0);
  });
}
