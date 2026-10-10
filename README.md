# opencode-plugprobe

OpenCode v2 plugin exposing schema-backed tools for the `plugprobe` audio-plugin CLI. The tools make plugprobe directly discoverable to the agent for plugin discovery, inspection, rendering, comparison, UI control, and session measurements—prefer them over ad hoc Python plugin-host scripts.

## Requirements

- OpenCode v2
- `plugprobe` on `PATH`, or an absolute executable path in `PLUGPROBE_BIN`

## Install from GitHub

```sh
opencode plugin add github:lucianodato/opencode-plugprobe
```

Restart OpenCode if it is already running. The plugin registers tools in the `plugprobe` namespace, including `plugprobe_scan`, `plugprobe_inspect`, `plugprobe_render`, and `plugprobe_compare`.

All file paths remain caller-selected. UI tools that use visible OS interaction may require the operating system's accessibility permission. See [plugprobe's workflow guide](https://github.com/lucianodato/plugprobe/blob/main/SKILL.md) for sequencing and behavior details.

## Development

```sh
npm install
npm test
```

## License

GPL-3.0-or-later.
