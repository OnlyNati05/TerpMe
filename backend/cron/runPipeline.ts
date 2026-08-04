import { runPipeline } from "./pipelineCron";

console.log("Starting runPipeline test...");

export const handler = async () => {
  console.log("Handler triggered");

  await runPipeline();
  console.log("Handler Finished");
};

if (require.main === module) {
  console.time("myFunctionTimer");
  handler().then(() => {
    console.log("All done ✅");
    console.timeEnd("myFunctionTimer");
    process.exit(0);
  });
}
