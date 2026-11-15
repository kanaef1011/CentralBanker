import {decision, learnEntry, quarterState, runScore, scenarioEvent, scenarioParams} from './objects.js'
import {learnTopic, player, run, scenario} from './documents.js'

export const schemaTypes = [
  // objects
  scenarioParams,
  scenarioEvent,
  decision,
  quarterState,
  runScore,
  learnEntry,
  // documents
  scenario,
  learnTopic,
  player,
  run,
]
