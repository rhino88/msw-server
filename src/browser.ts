import { setupWorker as mswSetupWorker } from "msw";
import { getEndpointsFor } from "./getEndpoints";
import { MswServerConfig } from "./types";

export function setupWorker(options: MswServerConfig) {
  const worker = mswSetupWorker(...getEndpointsFor(options));
  return {
    start: worker.start,
    resetHandlers(data: object) {},
  };
}
