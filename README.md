# OpenSparkcode

OpenSparkcode agent installation website source.

## Platform plan

- iOS and Android: planned remote control and cloud modes. The agent does not run locally on mobile.
- Linux, macOS, and Windows: planned local, remote, and cloud modes.
- Remote mode: control an agent running on a computer or server you manage; distinct from a hosted cloud workspace.
- Cloud work is planned to happen in an isolated GitHub branch.
- Model connections are planned around BYOK (Bring Your Own Key).

Installation and integrations are not live yet. The interface uses “Coming soon” labels intentionally.

## Preview locally

Open `index.html` in a browser. The logo asset is stored in `assets/opensparkcode-logo.jpg`.

This repository contains source only. No Vercel project or deployment has been created.

## Mode explorer

The landing page includes an interactive Local / Remote / Cloud setup preview. Remote is selected initially. Select a card or tab to see how that mode is intended to work. Tabs support Left/Right, Home, and End keys. The original Chakra Petch and Hanken Grotesk font families are preserved.

Remote execution and pairing are **not implemented** in this source-only site. No host is contacted, no credentials are collected, and no connection is simulated. A future remote implementation needs an agent host service, authenticated pairing, explicit project access, and connection lifecycle handling.
