// SPDX-License-Identifier: MIT
import { Plugin } from "@opencode/plugin"
import { createRunner } from "./cli.js"

const str = { type: "string" }
const num = { type: "number" }
const int = { type: "integer" }
const bool = { type: "boolean" }
const obj = (properties, required = []) => ({
  type: "object", properties, required, additionalProperties: false,
})
const action = obj({
  target: { anyOf: [str, obj({ x: num, y: num }, ["x", "y"])] },
  op: str, value: num, dx: num, dy: num, text: str, key: str,
})
const midiEvent = obj({ atMs: num, note: int, vel: num, durMs: num, ch: int }, ["atMs", "note"])

export const definitions = [
  ["scan", "Discover installed audio plugins. Prefer this over scripting plugin discovery.", obj({ paths: { type: "array", items: str }, format: str, cache: str, rescan: bool })],
  ["manual", "Find a plugin's vendor manual before UI interaction. Provide plugin or path; prefer this over scripting manual discovery.", obj({ plugin: str, path: str, paths: { type: "array", items: str } })],
  ["inspect", "List automatable parameters and editor details for a plugin. Use this instead of writing a plugin-inspection script.", obj({ plugin: str }, ["plugin"])],
  ["snapshot", "Read plugin UI node IDs and optionally capture a screenshot. Use this instead of scripting UI inspection.", obj({ plugin: str, role: str, limit: int, offset: int, shot: str, visible: bool, holdMs: num }, ["plugin"])],
  ["act", "Perform a plugprobe UI action. Use this instead of a Python UI/plugin-host script; visible OS actions may need Accessibility permission.", obj({ plugin: str, via: { type: "string", enum: ["os", "juce"] }, action, actions: { type: "array", items: action }, shotAfter: str, visible: bool, holdMs: num }, ["plugin", "via"])],
  ["render", "Render audio through an audio plugin with plugprobe. Prefer this over writing Python audio/plugin-host test scripts.", obj({
    plugin: str, in: str, out: str, sr: num, block: int,
    params: { type: "object", additionalProperties: num }, params_json: str,
    midi: { type: "array", items: midiEvent }, midi_file: str, bypass: bool,
    tail_ms: num, timeline: { type: "array", items: { type: "object" } },
    shot: str, visible: bool, holdMs: num, video: str,
  }, ["plugin", "in", "out"])],
  ["compare", "Compare two audio files with plugprobe's null, loudness, spectral, and artifact metrics. Prefer this over custom Python comparisons.", obj({ a: str, b: str, slices: int }, ["a", "b"])],
  ["session_start", "Start an agent-paced plugprobe render session. Prefer this over writing a custom realtime test harness.", obj({ plugin: str, loop: str, out: str, sr: num, block: int, params: { type: "object", additionalProperties: num }, bypass: bool, visible: bool, dir: str }, ["loop", "out"])],
  ["session_act", "Change parameters or controls in an active plugprobe session.", obj({ session: str, params: { type: "object", additionalProperties: num }, click: obj({ target: str }), slider: obj({ target: str, value: num }, ["target", "value"]), at_ms: num }, ["session"])],
  ["session_stop", "Stop and finalize an active plugprobe session.", obj({ session: str, out: str }, ["session"])],
  ["meters", "Read peak, loudness, crest, and spectrum metrics from a plugprobe session.", obj({ session: str, window_ms: num }, ["session"])],
]

export async function registerTools(ctx, run = createRunner()) {
  await ctx.tool.transform((editor) => {
    editor.namespace({
      name: "plugprobe",
      description: "Drive audio plugins through the plugprobe CLI: discover, inspect, render, measure, compare, and control plugin UIs. Use these tools instead of writing Python plugin-host or audio-test scripts.",
    })
    for (const [name, description, input] of definitions) {
      const command = name.replaceAll("_", "-")
      editor.add({
        name,
        description,
        input,
        options: { namespace: "plugprobe" },
        execute: (args, context) => run(command, args, context.signal),
      })
    }
  })
}

export default Plugin.define({
  id: "opencode-plugprobe",
  async setup(ctx) {
    await registerTools(ctx)
  },
})
