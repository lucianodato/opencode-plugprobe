// SPDX-License-Identifier: MIT
import { spawn } from "node:child_process"

export function createRunner(binary = process.env.PLUGPROBE_BIN || "plugprobe") {
  return (command, input, signal) => new Promise((resolve, reject) => {
    let stdout = ""
    let stderr = ""
    let settled = false
    const finish = (value, error) => {
      if (settled) return
      settled = true
      if (error) reject(error)
      else resolve(value)
    }
    const child = spawn(binary, [command, "--json", "-"], {
      signal,
      stdio: ["pipe", "pipe", "pipe"],
    })
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => { stdout += chunk })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.on("error", (error) => {
      if (signal?.aborted) return finish(undefined, error)
      finish({ content: JSON.stringify({
        ok: false,
        error: { code: error.code === "ENOENT" ? "PLUGPROBE_NOT_FOUND" : "PLUGPROBE_START", message: error.message },
      }) })
    })
    child.on("close", (code) => {
      const line = stdout.trim().split(/\r?\n/).at(-1)
      try {
        finish({ content: JSON.stringify(JSON.parse(line)) })
      } catch {
        finish({ content: JSON.stringify({
          ok: false,
          error: {
            code: "PLUGPROBE_OUTPUT",
            message: `plugprobe exited ${code ?? "without a status"} and did not return JSON${stderr.trim() ? `: ${stderr.trim()}` : ""}`,
          },
        }) })
      }
    })
    child.stdin.end(JSON.stringify(input))
  })
}
