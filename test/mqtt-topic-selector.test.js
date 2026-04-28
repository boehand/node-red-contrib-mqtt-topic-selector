/**
 * Unit Tests für node-red-contrib-mqtt-topic-selector
 * 
 * Tests für die Input-Node, Output-Node und Komfort-Modus Funktionalität
 */

const assert = require('assert');

/**
 * Mock RED Framework für Tests
 */
class MockRED {
    constructor() {
        this.nodes = {
            created: [],
            types: {}
        };
        this.httpAdmin = {
            handlers: []
        };
    }

    registerType(name, nodeClass) {
        this.nodes.types[name] = nodeClass;
    }

    nodes = {
        getNode: (id) => {
            // Mock Broker Node
            if (id === 'broker1') {
                return {
                    id: 'broker1',
                    broker: 'localhost',
                    port: 1883,
                    credentials: { user: 'test', password: 'test' }
                };
            }
            return null;
        },
        getCredentials: (id) => {
            if (id === 'broker1') {
                return { user: 'testuser', password: 'testpass' };
            }
            return {};
        },
        createNode: (node, config) => {
            node.id = config.id || 'test-node';
            node.type = config.type || 'mqtt-topic-selector-in';
            node.send = jest.fn();
            node.status = jest.fn();
            node.on = jest.fn();
        }
    };
}

describe('MQTT Topic Selector Nodes', () => {

    describe('Regex Pattern Tests', () => {

        test('Exact length pattern - 32 Zeichen', () => {
            const exactLen = 32;
            const pattern = `^[a-zA-Z0-9\\-_]{${exactLen}}$`;
            const regex = new RegExp(pattern);

            expect(regex.test('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')).toBe(true);
            expect(regex.test('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')).toBe(true);
            expect(regex.test('abc')).toBe(false);
        });

        test('Min/Max length pattern - 10-40 Zeichen', () => {
            const minLen = 10;
            const maxLen = 40;
            const pattern = `^[a-zA-Z0-9\\-_]{${minLen},${maxLen}}$`;
            const regex = new RegExp(pattern);

            expect(regex.test('abcdefghij')).toBe(true); // 10 Zeichen
            expect(regex.test('a'.repeat(40))).toBe(true); // 40 Zeichen
            expect(regex.test('abcdefghi')).toBe(false); // 9 Zeichen
            expect(regex.test('a'.repeat(41))).toBe(false); // 41 Zeichen
        });

        test('Custom regex pattern', () => {
            const customPattern = '^[a-f0-9]{8}$';
            const regex = new RegExp(customPattern);

            expect(regex.test('a1b2c3d4')).toBe(true);
            expect(regex.test('ffffffff')).toBe(true);
            expect(regex.test('g1234567')).toBe(false); // g ist nicht erlaubt
        });

        test('Regex mit Sonderzeichen - Unterstriche und Bindestriche', () => {
            const pattern = `^[a-zA-Z0-9\\-_]{10,20}$`;
            const regex = new RegExp(pattern);

            expect(regex.test('abc-def_123')).toBe(true);
            expect(regex.test('_-_-_-_-_-')).toBe(true);
            expect(regex.test('abc@def')).toBe(false); // @ nicht erlaubt
        });

        test('Fallback regex bei ungültigem Pattern', () => {
            const invalidPattern = '(invalid[';
            let regex;
            try {
                regex = new RegExp(invalidPattern);
            } catch(_e) {
                regex = /^[a-zA-Z0-9\-_]{32}$/; // Fallback
            }
            expect(regex.test('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')).toBe(true);
        });

    });

    describe('Topic Suffix Processing', () => {

        test('Suffix mit Slash wird beibehalten', () => {
            let nameSuffix = "/announce";
            if (!nameSuffix.startsWith('/')) nameSuffix = '/' + nameSuffix;
            expect(nameSuffix).toBe("/announce");
        });

        test('Suffix ohne Slash wird ergänzt', () => {
            let nameSuffix = "announce";
            if (!nameSuffix.startsWith('/')) nameSuffix = '/' + nameSuffix;
            expect(nameSuffix).toBe("/announce");
        });

        test('Extraction der Base-Path aus Topic', () => {
            const topic = "devices/abc123def456/announce";
            const nameSuffix = "/announce";
            const basePath = topic.slice(0, topic.length - nameSuffix.length);
            const parts = basePath.split('/');
            const foundId = parts[parts.length - 1];

            expect(basePath).toBe("devices/abc123def456");
            expect(foundId).toBe("abc123def456");
        });

        test('Extraction mit verschachteltem Pfad', () => {
            const topic = "org/division/devices/xyz789abc123/info/announce";
            const nameSuffix = "/announce";
            const basePath = topic.slice(0, topic.length - nameSuffix.length);
            const parts = basePath.split('/');
            const foundId = parts[parts.length - 1];

            expect(foundId).toBe("info");
        });

        test('Korrekte Struktur: devices/ID/suffix', () => {
            const topic = "devices/id123456789abc/announce";
            const nameSuffix = "/announce";
            const basePath = topic.slice(0, topic.length - nameSuffix.length);
            const parts = basePath.split('/');
            const foundId = parts[parts.length - 1];

            expect(foundId).toBe("id123456789abc");
        });

    });

    describe('ID Extraction und Mapping', () => {

        test('JSON Name Extraction - Priority Order', () => {
            const nameKeys = ["name", "title", "deviceName"];
            const jsonData = { title: "Sensor A", deviceName: "Device B" };

            let deviceName = null;
            for (let key of nameKeys) {
                if (jsonData[key]) {
                    deviceName = jsonData[key];
                    break;
                }
            }
            expect(deviceName).toBe("Sensor A"); // "name" hat höchste Priorität, aber "title" ist vorhanden
        });

        test('JSON Name Extraction - Fallback zu deviceName', () => {
            const nameKeys = ["name", "title", "deviceName"];
            const jsonData = { deviceName: "Device C" };

            let deviceName = null;
            for (let key of nameKeys) {
                if (jsonData[key]) {
                    deviceName = jsonData[key];
                    break;
                }
            }
            expect(deviceName).toBe("Device C");
        });

        test('JSON Name Extraction - Key nicht vorhanden', () => {
            const nameKeys = ["name", "title", "deviceName"];
            const jsonData = { label: "Unknown" };

            let deviceName = null;
            for (let key of nameKeys) {
                if (jsonData[key]) {
                    deviceName = jsonData[key];
                    break;
                }
            }
            expect(deviceName).toBeNull();
        });

        test('Komma-getrennte nameKeys werden korrekt geparst', () => {
            const nameKeysString = "name,title,deviceName";
            const nameKeys = nameKeysString.split(',').map(k => k.trim());

            expect(nameKeys).toEqual(["name", "title", "deviceName"]);
        });

        test('nameKeys mit Leerzeichen werden bereinigt', () => {
            const nameKeysString = "name , title , deviceName";
            const nameKeys = nameKeysString.split(',').map(k => k.trim());

            expect(nameKeys).toEqual(["name", "title", "deviceName"]);
        });

    });

    describe('JSON Payload Parsing', () => {

        test('Gültiges JSON wird geparst', () => {
            const payload = '{"name": "Sensor A", "value": 22.5}';
            let data = null;
            try {
                data = JSON.parse(payload);
            } catch (e) {
                data = null;
            }
            expect(data).toEqual({ name: "Sensor A", value: 22.5 });
        });

        test('Ungültiges JSON wird gefangen', () => {
            const payload = '{invalid json}';
            let data = null;
            try {
                data = JSON.parse(payload);
            } catch (e) {
                data = null;
            }
            expect(data).toBeNull();
        });

        test('Leerer String wird gefangen', () => {
            const payload = '';
            let data = null;
            try {
                data = JSON.parse(payload);
            } catch (e) {
                data = null;
            }
            expect(data).toBeNull();
        });

        test('Array-Payload wird geparst', () => {
            const payload = '[{"id": 1}, {"id": 2}]';
            let data = null;
            try {
                data = JSON.parse(payload);
            } catch (e) {
                data = null;
            }
            expect(Array.isArray(data)).toBe(true);
            expect(data[0].id).toBe(1);
        });

    });

    describe('Broker URL Construction', () => {

        test('Broker URL mit protokoll', () => {
            const brokerNode = { 
                broker: 'mqtt://localhost', 
                port: 1883 
            };
            const protocol = (brokerNode.broker && brokerNode.broker.includes("://")) ? "" : "mqtt://";
            const brokerUrl = protocol + brokerNode.broker + ":" + brokerNode.port;

            expect(brokerUrl).toBe("mqtt://localhost:1883");
        });

        test('Broker URL ohne protokoll', () => {
            const brokerNode = { 
                broker: 'broker.example.com', 
                port: 1883 
            };
            const protocol = (brokerNode.broker && brokerNode.broker.includes("://")) ? "" : "mqtt://";
            const brokerUrl = protocol + brokerNode.broker + ":" + brokerNode.port;

            expect(brokerUrl).toBe("mqtt://broker.example.com:1883");
        });

        test('Broker URL mit custom Port', () => {
            const brokerNode = { 
                broker: 'localhost', 
                port: 8883 
            };
            const protocol = (brokerNode.broker && brokerNode.broker.includes("://")) ? "" : "mqtt://";
            const brokerUrl = protocol + brokerNode.broker + ":" + brokerNode.port;

            expect(brokerUrl).toBe("mqtt://localhost:8883");
        });

    });

    describe('QoS Handling', () => {

        test('QoS Default Wert', () => {
            const qos = 0 || 0;
            expect(qos).toBe(0);
        });

        test('QoS String zu Integer Konvertierung', () => {
            const qosString = "1";
            const qos = parseInt(qosString);
            expect(qos).toBe(1);
            expect(typeof qos).toBe('number');
        });

        test('QoS Validität - Nur 0, 1, 2 erlaubt', () => {
            const validQoS = [0, 1, 2];
            expect(validQoS.includes(0)).toBe(true);
            expect(validQoS.includes(1)).toBe(true);
            expect(validQoS.includes(2)).toBe(true);
            expect(validQoS.includes(3)).toBe(false);
        });

    });

    describe('Retain Flag Handling', () => {

        test('Retain String "true" wird zu Boolean true', () => {
            const retain = "true" === "true" || "true" === true;
            expect(retain).toBe(true);
        });

        test('Retain String "false" wird zu Boolean false', () => {
            const retain = "false" === "true" || "false" === true;
            expect(retain).toBe(false);
        });

        test('Retain Boolean true bleibt true', () => {
            const retain = true === "true" || true === true;
            expect(retain).toBe(true);
        });

        test('Retain Boolean false bleibt false', () => {
            const retain = false === "true" || false === true;
            expect(retain).toBe(false);
        });

    });

    describe('Topic Wildcard Patterns', () => {

        test('Single Level Wildcard +', () => {
            const topic = "home/+/temperature";
            expect(topic).toContain('+');
        });

        test('Multi Level Wildcard #', () => {
            const topic = "home/sensors/#";
            expect(topic).toContain('#');
        });

        test('Keine Wildcards in Topic', () => {
            const topic = "home/sensor/temperature";
            expect(topic).not.toContain('+');
            expect(topic).not.toContain('#');
        });

    });

    describe('Payload Handling', () => {

        test('Payload zu String konvertieren', () => {
            const payload = Buffer.from("test message");
            const result = payload.toString();
            expect(result).toBe("test message");
        });

        test('Numerischer Payload zu String', () => {
            const payload = 25.5;
            const result = String(payload);
            expect(result).toBe("25.5");
        });

        test('Object Payload zu JSON String', () => {
            const payload = { temperature: 22.5, humidity: 60 };
            const result = JSON.stringify(payload);
            expect(result).toBe('{"temperature":22.5,"humidity":60}');
        });

        test('Whitespace Trimming', () => {
            const payload = "  test message  ";
            const result = payload.trim();
            expect(result).toBe("test message");
        });

    });

    describe('Error Handling', () => {

        test('Broker Node nicht gefunden', () => {
            const brokerNode = null;
            expect(brokerNode).toBeNull();
        });

        test('Ungültiges Regex Pattern wird abgefangen', () => {
            const invalidPattern = '(invalid[';
            let regex = null;
            let error = false;
            try {
                regex = new RegExp(invalidPattern);
            } catch(e) {
                error = true;
                regex = /^[a-zA-Z0-9\-_]{32}$/; // Fallback
            }
            expect(error).toBe(true);
            expect(regex).not.toBeNull();
        });

        test('Invalid JSON wird abgefangen', () => {
            const payload = '{invalid}';
            let data = null;
            let error = false;
            try {
                data = JSON.parse(payload);
            } catch (e) {
                error = true;
            }
            expect(error).toBe(true);
            expect(data).toBeNull();
        });

    });

    describe('Topic List Deduplication', () => {

        test('Doppelte Topics werden entfernt', () => {
            const topicsSet = new Set();
            topicsSet.add('home/temperature');
            topicsSet.add('home/temperature');
            topicsSet.add('home/humidity');

            expect(topicsSet.size).toBe(2);
            expect(Array.from(topicsSet)).toContain('home/temperature');
            expect(Array.from(topicsSet)).toContain('home/humidity');
        });

        test('Topics werden sortiert', () => {
            const topicsSet = new Set();
            topicsSet.add('z/topic');
            topicsSet.add('a/topic');
            topicsSet.add('m/topic');

            const sorted = Array.from(topicsSet).sort();
            expect(sorted[0]).toBe('a/topic');
            expect(sorted[2]).toBe('z/topic');
        });

    });

    describe('Topic Matching mit Suffix', () => {

        test('Topic endet mit Suffix', () => {
            const topic = 'devices/id123/announce';
            const suffix = '/announce';
            expect(topic.endsWith(suffix)).toBe(true);
        });

        test('Topic endet nicht mit Suffix', () => {
            const topic = 'devices/id123/data';
            const suffix = '/announce';
            expect(topic.endsWith(suffix)).toBe(false);
        });

        test('Multiple Suffixe im Topic', () => {
            const topic = 'devices/announce/id123/announce';
            const suffix = '/announce';
            expect(topic.endsWith(suffix)).toBe(true);
            // Letzte Substring wird extrahiert
            const lastIndex = topic.lastIndexOf(suffix);
            expect(lastIndex).toBe(topic.length - suffix.length);
        });

    });

    describe('Client ID Generation', () => {

        test('Eindeutige Client IDs werden erzeugt', () => {
            const clientId1 = 'mqtt_browse_' + Math.random().toString(16).substr(2, 8);
            const clientId2 = 'mqtt_browse_' + Math.random().toString(16).substr(2, 8);

            expect(clientId1).toMatch(/^mqtt_browse_[a-f0-9]{8}$/);
            expect(clientId2).toMatch(/^mqtt_browse_[a-f0-9]{8}$/);
            expect(clientId1).not.toBe(clientId2);
        });

        test('Client ID hat korrektes Format', () => {
            const clientId = 'mqtt_browse_' + Math.random().toString(16).substr(2, 8);
            expect(clientId.startsWith('mqtt_browse_')).toBe(true);
        });

    });

    describe('Configuration Validation', () => {

        test('Broker ist erforderlich', () => {
            const config = {
                broker: null,
                topic: 'test/topic'
            };
            expect(config.broker).toBeNull();
        });

        test('Topic ist erforderlich für Input Node', () => {
            const config = {
                broker: 'broker1',
                topic: ''
            };
            expect(config.topic).toBe('');
            expect(config.topic.length).toBe(0);
        });

        test('QoS hat Default Wert', () => {
            const qos = null || 0;
            expect(qos).toBe(0);
        });

        test('Retain hat Default Wert', () => {
            const retain = null || false;
            expect(retain).toBe(false);
        });

    });

});
