import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes/index.js";

export default defineConfig({
  name: "cbsim",
  title: "Central Bank Simulator",
  projectId: "6z32sa7p",
  dataset: "production",
  schema: {
    types: schemaTypes,
    // Người chơi và lượt chơi do server tạo, không tạo tay trong Studio
    templates: (prev) =>
      prev.filter((t) => !["run", "player"].includes(t.schemaType)),
  },
  document: {
    actions: (prev, ctx) =>
      ctx.schemaType === "run"
        ? prev.filter((a) => a.action === "publish" || a.action === "unpublish")
        : prev,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Nội dung")
          .items([
            S.documentTypeListItem("scenario").title("Kịch bản"),
            S.documentTypeListItem("learnTopic").title("Bài học"),
            S.divider(),
            S.listItem()
              .title("Lượt chơi")
              .child(
                S.list()
                  .title("Lượt chơi")
                  .items([
                    S.listItem()
                      .title("Đang chơi")
                      .child(
                        S.documentList()
                          .title("Đang chơi")
                          .filter(
                            '_type == "run" && kind == "player" && status == "in_progress"',
                          ),
                      ),
                    S.listItem()
                      .title("Đã hoàn thành")
                      .child(
                        S.documentList()
                          .title("Đã hoàn thành")
                          .filter(
                            '_type == "run" && kind == "player" && status == "completed"',
                          )
                          .defaultOrdering([
                            { field: "score.total", direction: "desc" },
                          ]),
                      ),
                    S.listItem()
                      .title("Chiến lược đã lưu")
                      .child(
                        S.documentList()
                          .title("Chiến lược đã lưu")
                          .filter('_type == "run" && saved == true'),
                      ),
                    S.listItem()
                      .title("Benchmark")
                      .child(
                        S.documentList()
                          .title("Benchmark")
                          .filter(
                            '_type == "run" && kind in ["taylor", "hold"]',
                          ),
                      ),
                  ]),
              ),
            S.documentTypeListItem("player").title("Người chơi"),
          ]),
    }),
    visionTool(),
  ],
});
