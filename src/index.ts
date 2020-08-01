import { setupServer as mswSetupServer } from "msw/node";
import { getEndpointsFor } from "./getEndpoints";
import {MswServerConfig} from "./types";

export function setupServer(options: MswServerConfig) {
  const server = mswSetupServer(...getEndpointsFor(options));

  return {
    listen: server.listen,
    resetHandlers() {
      server.resetHandlers(...getEndpointsFor(options));
    },
    close: server.close,
  };
}
