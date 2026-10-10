// SPDX-License-Identifier: MIT
import assert from "node:assert/strict"
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { createRunner } from "../cli.js"
import { definitions, registerTools } from "../index.js"

test("registers schema-backed plugprobe tools under one namespace", async () => {
  const tools = []
  const ctx = { tool: { transform: async (callback) => callback({
    namespace: (value) => assert.equal(value.name, "plugprobe"),
    add: (tool) => tools.push(tool),
  }) } }
  await registerTools(ctx, async (command, args) => ({ content: JSON.stringify({ command, args }) }))

  assert.equal(tools.length, definitions.length)
  assert.ok(tools.every((tool) => tool.input.type === "object" && tool.execute))
  const render = tools.find((tool) => tool.name === "render")
  assert.deepEqual(JSON.parse((await render.execute({ plugin: "P", in: "a.wav", out: "b.wav" }, {})).content), {
    command: "render", args: { plugin: "P", in: "a.wav", out: "b.wav" },
  })
})

test("sends JSON on stdin and returns the CLI JSON response", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "opencode-plugprobe-"))
  try {
    const executable = path.join(dir, "fake-plugprobe")
    await writeFile(executable, "#!/bin/sh\ncat | sed 's/.*/&/' >/dev/null\nprintf '{\"ok\":true,\"data\":{\"received\":true}}\\n'\n")
    await chmod(executable, 0o755)
    const result = await createRunner(executable)("render", { out: "take with spaces.wav" })
    assert.deepEqual(JSON.parse(result.content), { ok: true, data: { received: true } })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("reports a missing plugprobe executable as structured output", async () => {
  const result = await createRunner("/no/such/plugprobe")("scan", {})
  assert.equal(JSON.parse(result.content).error.code, "PLUGPROBE_NOT_FOUND")
})
