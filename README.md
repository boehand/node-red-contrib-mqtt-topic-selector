# node-red-contrib-mqtt-topic-selector

A Node-RED node for selecting and listening to topics from an MQTT broker with advanced comfort features based on the *node-red core-node for mqtt* ([Link1](https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/network/10-mqtt.html), [Link2](https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/network/10-mqtt.js)) and based on *node-red-contrib-opcua-item-selector* ([Link](https://github.com/boehand/node-red-contrib-opcua-item-selector)).


## Features

- **MQTT Input Node** - Subscribe and receive MQTT messages
- **MQTT Output Node** - Publish messages to MQTT topics
- **Comfort Mode** - Automatic device ID recognition and mapping to readable names
- **Topic Browser** - Live listening to the broker to browse available topics
- **Flexible ID Recognition** - Exact length, min/max length, or custom regex
- **Info Topics** - Automatic extraction of device information from special topics

## Installation

```bash
npm install node-red-contrib-mqtt-topic-selector
```

Or search for `mqtt-topic-selector` in the Node-RED Palette Manager and install.

## Requirements

- Node-RED >= 1.0.0
- Node.js >= 14.0.0
- MQTT Broker (e.g., Mosquitto)

## Configuration

### Input Node (mqtt-topic-selector-in)

Receives messages from MQTT topics.

**Properties:**

| Option | Description | Required |
|--------|-------------|----------|
| **Broker** | MQTT Broker connection | Yes |
| **Topic** | Topic to subscribe to (supports wildcards) | Yes |
| **QoS** | Quality of Service (0, 1, 2) | No |
| **Comfort** | Enables device name mapping | No |
| **Recognition** | Type of ID recognition | No |

### Output Node (mqtt-topic-selector-out)

Publishes messages to MQTT topics.

**Properties:**

| Option | Description | Required |
|--------|-------------|----------|
| **Broker** | MQTT Broker connection | Yes |
| **Topic** | Destination topic for publishing | Yes |
| **QoS** | Quality of Service (0, 1, 2) | No |
| **Retain** | Keep message (true/false) | No |
| **Comfort** | Enables device name mapping | No |

### Comfort Mode

With **Comfort Mode**, you can automatically create a mapping between cryptic device IDs and readable device names.

#### Advanced Settings

**Recognition (ID-Pattern):**
- **Exact Length** - IDs have a fixed character length (e.g., 32 characters)
- **Min/Max Length** - IDs have a variable length within the specified range
- **Regex (Pro)** - Use custom regular expression

**Info-Topic:**
- Default: `/announce`
- The node searches for topics that end with this suffix
- Example: `devices/abc123def456/announce`

**JSON Keys:**
- Comma-separated list of JSON field names
- The node tries to extract the name from these fields
- Default: `name,title,deviceName`
- Order determines priority

#### Topic Browser

Click the **"Listen"** button to:
1. Create a live connection to the broker
2. Collect all available topics
3. Analyze info-topics and extract device names
4. Create a searchable list of popular topics

## Examples

### Simple Receiving

Configure:
- Topic: `home/sensor/temperature`
- QoS: 1

### With Comfort Mode

If the following topics exist:
- `devices/a1b2c3d4e5f6/announce` → `{"name": "Factory Temperature"}`
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



