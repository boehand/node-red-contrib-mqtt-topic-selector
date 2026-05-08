# node-red-contrib-mqtt-topic-selector

A Node-RED node for selecting and listening to MQTT topics from a broker with advanced device mapping features.

![Demo](docs/video_node-red-contrib-mqtt-topic-selector.webp)

## Features

- **MQTT Input/Output** - Subscribe to and publish MQTT messages.
- **Device Mapping** - Automatic device ID to name recognition.
- **Topic Browser** - Live connection to browse available topics.
- **Custom ID Recognition** - Support for exact lengths, min/max lengths, or regex patterns.

## Installation

```bash
npm install node-red-contrib-mqtt-topic-selector
```

## Quick Start

1. Drag an MQTT Input or Output node into your Node-RED flow.
2. Configure the broker connection.
3. Specify the topic to subscribe/publish to, or use the Topic Browser.
4. (Optional) Enable device mapping for automatic device name recognition.

## Error Handling

Node status displays current state (🟢 connected, 🔴 error/no broker).
Common issues like "Broker not found" or "Connection refused" are typically resolved by checking broker configuration and connectivity.

## Author

Created by boehand using Gemini Pro 3.1 and Claude Haiku 4.5

## Support

For bugs and feature requests visit:
https://github.com/boehand/node-red-contrib-mqtt-topic-selector

## Related Packages

- [node-red-contrib-mqtt-broker](https://flows.nodered.org/node/@stfi/node-red-contrib-mqtt-broker)
- [node-red](https://nodered.org/)
- [mqtt.js](https://github.com/mqttjs/MQTT.js)

## License
Apache-2.0


