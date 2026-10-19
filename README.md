# OpenSparkcode

OpenSparkcode agent installation website source.

## Platform plan

- Web, iOS, and Android: planned remote control, managed cloud, and Cloud VPS control. The agent does not run locally on mobile or in the browser.
- Linux, macOS, and Windows: planned local, remote, managed cloud, and Cloud VPS modes.
- Remote mode: control an agent running on a computer or server you manage.
- Cloud VPS mode: bring an existing Linux virtual private server (VPS) from a provider you choose, install the future agent host there, and control it from any supported device. This is a dedicated, user-managed VPS path, **not** a managed cloud workspace. VPS provider charges and server maintenance are yours.
- Managed Cloud mode: a planned hosted, isolated cloud workspace. This is distinct from connecting your own VPS.
- Cloud work is planned to happen in an isolated GitHub branch.
- Model connections are planned around BYOK (Bring Your Own Key).

Installation and integrations are not live yet. The interface uses “Coming soon” labels intentionally.

## Preview locally

Open `index.html` in a browser. The logo asset is stored in `assets/opensparkcode-logo.jpg`.

Live website: https://opensparkcode.vercel.app/ (hosted on Vercel). The agent itself is still a product preview.

## Mode explorer

The landing page includes an interactive Local / Remote / Cloud / Cloud VPS setup preview and a Web platform row. Remote is selected initially. Select a card or tab to see how that mode is intended to work. Tabs support Left/Right, Home, and End keys. The original Chakra Petch and Hanken Grotesk font families are preserved.

Remote execution and pairing are **not implemented** in this source-only site. The Cloud VPS option is an honest setup preview: it does **not** provision a paid server, connect over SSH, ask for credentials, or claim that an agent is running. A future implementation needs an installable Linux agent host, key-based authentication and pairing, explicit project access, encrypted communications, and connection lifecycle handling. Vercel deploys the installation website; it is **not** itself an always-on VPS.

## Website updates

The live website deploys from its default GitHub branch. Open tabs check for a new deployment every 60 seconds and on focus/reconnect, offering a reload when ready. This updates the website preview; agent execution and remote pairing are still planned features.
