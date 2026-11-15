import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "6z32sa7p",
    dataset: "production",
  },
  deployment: {
    autoUpdates: true,
  },
});
