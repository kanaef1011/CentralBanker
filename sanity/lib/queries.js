import {defineQuery} from 'groq'

// ---------- Nội dung ----------

/** Danh sách kịch bản cho tab Briefing (thay Object.entries(SCENARIOS)). */
export const SCENARIO_LIST = defineQuery(`
  *[_type == "scenario" && !(_id in path("drafts.**"))] | order(order asc){
    _id, name, "key": slug.current, tag
  }
`)

/** Toàn bộ một kịch bản, đúng hình dạng engine cần. */
export const SCENARIO_FULL = defineQuery(`
  *[_type == "scenario" && _id == $id][0]{
    _id, name, "key": slug.current, tag, brief, challenge, params, events
  }
`)

/** Nội dung tab Learn và các hộp "What is this?" (thay object LEARN). */
export const LEARN_TOPICS = defineQuery(`*[_type == "learnTopic"] | order(order asc){ key, title, entries }`)

// ---------- Lượt chơi ----------

/** Lượt đang chơi dở để tiếp tục (thay APP.run sau khi tải lại trang). */
export const MY_ACTIVE_RUN = defineQuery(`
  *[_type == "run" && kind == "player" && player._ref == $playerId
    && scenario._ref == $scenarioId && status == "in_progress"] | order(startedAt desc)[0]{
    _id, seed, noise, quartersDone, decisions, states, score, notes
  }
`)

/** Tab Compare: chiến lược đã lưu (thay APP.saved lọc theo APP.key) + 2 benchmark cùng điều kiện. */
export const COMPARE_SET = defineQuery(`{
  "saved": *[_type == "run" && kind == "player" && player._ref == $playerId
             && scenario._ref == $scenarioId && saved == true] | order(startedAt asc){
    _id, name, seed, noise, notes, score, "H": states[]{t, pi, u, y, g, i, B, qe, fg, c, di, credit}
  },
  "bench": *[_type == "run" && kind in ["taylor", "hold"] && scenario._ref == $scenarioId
             && seed == $seed && noise == $noise]{
    kind, score, "H": states[]{t, pi, u, y, g, i, B, qe, fg, c, di, credit}
  }
}`)
