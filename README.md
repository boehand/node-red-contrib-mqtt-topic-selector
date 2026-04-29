# node-red-contrib-mqtt-topic-selector

A Node-RED node for selecting and listening to MQTT topics from a broker with advanced device mapping features.

## Features

- **MQTT Input Node** - Subscribe to MQTT messages
- **MQTT Output Node** - Publish MQTT messages  
- **Device Mapping** - Automatic device ID to name recognition
- **Topic Browser** - Live connection to browse available topics
- **Custom ID Recognition** - Exact length, min/max length, or regex patterns

## Installation

```bash
npm install node-red-contrib-mqtt-topic-selector
```

## Requirements

- Node-RED >= 1.0.0
- Node.js >= 14.0.0
- MQTT Broker

## Quick Start

1. Drag a MQTT Input or Output node into your Node-RED flow
2. Configure the broker connection
3. Specify the topic to subscribe/publish to
4. (Optional) Enable device mapping for automatic device name recognition

## License

Apache-2.0
- `devices/a1b2c3d4e5f6/temp` → `22.5`

Will display:
- **Factory Temperature** instead of `a1b2c3d4e5f6` in the dropdown list

### Publishing with Retain

```
[Inject (msg.payload={"status":"active"})] --> [MQTT Output]
```

Configure:
- Topic: `devices/controller/status`
- Retain: true
- QoS: 1

### Multiple Topic Wildcards

with Topic "sensors/#" subscribes to all topics under `sensors/`, e.g.:
- `sensors/room1/temp`
- `sensors/room1/humidity`
- `sensors/room2/temp`

## Error Handling

### Status Display

The node displays its status:

| Status | Meaning |
|--------|---------|
| 🟢 connected | Successfully connected to broker |
| 🔴 error: ... | Connection error - message will be displayed |
| 🔴 no broker | Broker configuration not found |

### Common Errors

**"Broker not found"**
- Check if the broker is configured correctly
- Make sure the broker is deployed

**"Connection refused"**
- Check broker address and port
- Verify username/password (if required)
- Ensure the broker is running

**"QoS not supported"**
- The broker only supports QoS 0
- Change QoS to 0

## API

### Input Node Output

```javascript
{
  topic: "home/sensor/temperature",
  payload: "22.5"
}
```

### Output Node Input

```javascript
{
  topic: "home/actuator/light",  // Optional, overrides configured topic
  payload: "on"
}
```

## Test Example with Node-RED

1. **Set up broker:** Configure an MQTT Broker node
2. **Input Node:** 
   - Topic: `test/#`
   - Connect with broker
3. **Output Node:**
   - Topic: `test/output`
   - Connect with broker
4. **Inject Node:** Creates test payload
5. **Debug Node:** Shows input messages

```
[Inject] --> [MQTT Output] --> [MQTT Input] --> [Debug]
```

## License

Apache-2.0

## Author

Created by boehand using Gemini Pro 3.1 and Claude Haiku 4.5

## Changelog

### Version 1.0.0

- ✅ Input and Output Nodes implemented
- ✅ Comfort Mode with device ID recognition
- ✅ Topic Browser with live listening
- ✅ Flexible ID recognition (exact, min/max, regex)
- ✅ Error handling and status display
- ✅ Memory leak fixes
- ✅ Unique HTML element IDs for both node types

## Support

For bugs and feature requests visit:
https://github.com/boehand/node-red-contrib-mqtt-topic-selector

## Related Packages

- [node-red-contrib-mqtt-broker](https://flows.nodered.org/node/@stfi/node-red-contrib-mqtt-broker)
- [node-red](https://nodered.org/)
- [mqtt.js](https://github.com/mqttjs/MQTT.js)



