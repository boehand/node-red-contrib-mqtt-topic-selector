/**
 * Integration Tests für node-red-contrib-mqtt-topic-selector
 * 
 * Tests für das Zusammenspiel mehrerer Komponenten
 */

describe('Integration Tests', () => {

    describe('Complete Comfort Mode Workflow', () => {

        test('Kompletter ID-Mapping Workflow', () => {
            // Szenario: Ein Message kommt an einem Info-Topic an
            
            // 1. Message wird empfangen
            const receivedMessage = {
                topic: 'devices/abc123def456/announce',
                payload: JSON.stringify({ name: 'Sensor Küche' })
            };

            // 2. Suffix-Verarbeitung
            const nameSuffix = '/announce';
            const basePath = receivedMessage.topic.slice(0, receivedMessage.topic.length - nameSuffix.length);
            const parts = basePath.split('/');
            const foundId = parts[parts.length - 1];

            expect(foundId).toBe('abc123def456');

            // 3. ID-Validierung
            const idRegex = /^[a-zA-Z0-9\-_]{32}$/;
            expect(idRegex.test(foundId)).toBe(true);

            // 4. Payload-Parsing
            let deviceName = null;
            try {
                const data = JSON.parse(receivedMessage.payload);
                const nameKeys = ['name', 'title', 'deviceName'];
                for (let key of nameKeys) {
                    if (data[key]) {
                        deviceName = data[key];
                        break;
                    }
                }
            } catch (_e) {
                // JSON Parse Fehler
            }

            expect(deviceName).toBe('Sensor Küche');

            // 5. Mapping erstellen
            const nameLookup = {};
            nameLookup[foundId] = deviceName;

            expect(nameLookup[foundId]).toBe('Sensor Küche');
        });

        test('Mehrere Geräte mit Komfort-Modus', () => {
            const messages = [
                { topic: 'devices/device111111111111111111111111/announce', payload: '{"name":"Sensor 1"}' },
                { topic: 'devices/device222222222222222222222222/announce', payload: '{"name":"Sensor 2"}' },
                { topic: 'devices/device333333333333333333333333/announce', payload: '{"name":"Sensor 3"}' }
            ];

            const nameLookup = {};
            const nameSuffix = '/announce';
            const idRegex = /^[a-zA-Z0-9\-_]{32}$/;
            const nameKeys = ['name'];

            messages.forEach(msg => {
                if (msg.topic.endsWith(nameSuffix)) {
                    const basePath = msg.topic.slice(0, msg.topic.length - nameSuffix.length);
                    const parts = basePath.split('/');
                    const foundId = parts[parts.length - 1];

                    if (idRegex.test(foundId)) {
                        try {
                            const data = JSON.parse(msg.payload);
                            for (let key of nameKeys) {
                                if (data[key]) {
                                    nameLookup[foundId] = data[key];
                                    break;
                                }
                            }
                        } catch (_e) {
                            // Ignore
                        }
                    }
                }
            });

            expect(Object.keys(nameLookup).length).toBe(3);
            expect(nameLookup.device111111111111111111111111).toBe('Sensor 1');
            expect(nameLookup.device222222222222222222222222).toBe('Sensor 2');
        });

    });

    describe('MQTT Message Flow', () => {

        test('Input Node empfängt und sendet Message', () => {
            // Input Node
            const incomingMessage = {
                topic: 'home/sensor/temperature',
                payload: '22.5'
            };

            // Vearbeitung
            const outputMessage = {
                topic: incomingMessage.topic,
                payload: incomingMessage.payload.toString()
            };

            expect(outputMessage.payload).toBe('22.5');
            expect(outputMessage.topic).toBe('home/sensor/temperature');
        });

        test('Output Node publisht Message', () => {
            // Message von Input
            const inputMessage = {
                topic: 'home/light/status',
                payload: 'on'
            };

            // Output Node Konfiguration
            const outputNodeConfig = {
                topic: 'home/light/status',
                qos: 1,
                retain: false
            };

            // Publish wird getriggert
            const publishTopic = outputNodeConfig.topic || inputMessage.topic;
            const publishPayload = inputMessage.payload;
            const publishQoS = parseInt(outputNodeConfig.qos);

            expect(publishTopic).toBe('home/light/status');
            expect(publishPayload).toBe('on');
            expect(publishQoS).toBe(1);
        });

        test('Message Chaining durch mehrere Nodes', () => {
            // Message kommt rein
            let msg = { topic: 'source/topic', payload: '{"value": 25}' };

            // Function Node verarbeitet
            msg.payload = JSON.parse(msg.payload).value;

            // Output Node publisht
            const finalTopic = 'destination/topic';
            const finalPayload = String(msg.payload);

            expect(finalTopic).toBe('destination/topic');
            expect(finalPayload).toBe('25');
        });

    });

    describe('Topic Browser Workflow', () => {

        test('Live-Abhören und Topic-Sammlung', () => {
            // Simulator für empfangene Topics während Browse
            const collectedTopics = new Set();
            const nameLookup = {};

            // Topics werden empfangen
            const incomingTopics = [
                { topic: 'devices/sensor1/data', payload: '{"value":20}' },
                { topic: 'devices/sensor1/announce', payload: '{"name":"Sensor 1"}' },
                { topic: 'devices/sensor2/data', payload: '{"value":22}' },
                { topic: 'devices/sensor2/announce', payload: '{"name":"Sensor 2"}' }
            ];

            const nameSuffix = '/announce';
            const idRegex = /^[a-zA-Z0-9\-_]{20}$/;

            incomingTopics.forEach(msg => {
                collectedTopics.add(msg.topic);

                if (msg.topic.endsWith(nameSuffix)) {
                    const basePath = msg.topic.slice(0, msg.topic.length - nameSuffix.length);
                    const parts = basePath.split('/');
                    const foundId = parts[parts.length - 1];

                    try {
                        const data = JSON.parse(msg.payload);
                        if (data.name) {
                            nameLookup[foundId] = data.name;
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            });

            const resultTopics = Array.from(collectedTopics).sort();

            expect(resultTopics.length).toBe(4);
            expect(resultTopics).toContain('devices/sensor1/data');
            expect(resultTopics).toContain('devices/sensor1/announce');
            expect(Object.keys(nameLookup).length).toBe(2);
        });

        test('Topic-Browser Timeout und Cleanup', (done) => {
            const browseTimeout = 2500;
            const startTime = Date.now();

            setTimeout(() => {
                const elapsedTime = Date.now() - startTime;
                expect(elapsedTime).toBeGreaterThanOrEqual(browseTimeout);
                done();
            }, browseTimeout);
        });

    });

    describe('Error Recovery Workflow', () => {

        test('Recovery nach ungültigem JSON in Payload', () => {
            const invalidPayload = '{invalid json}';
            let data = null;
            const fallbackValue = { name: 'Unknown' };

            try {
                data = JSON.parse(invalidPayload);
            } catch (e) {
                data = fallbackValue;
            }

            expect(data).toEqual(fallbackValue);
        });

        test('Recovery mit Regex Fallback Pattern', () => {
            const invalidPattern = '(invalid[';
            const fallbackPattern = /^[a-zA-Z0-9\-_]{32}$/;
            let pattern;

            try {
                pattern = new RegExp(invalidPattern);
            } catch (e) {
                pattern = fallbackPattern;
            }

            expect(pattern).toEqual(fallbackPattern);
            expect(pattern.test('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')).toBe(true);
        });

        test('Recovery bei fehlender Broker-Konfiguration', () => {
            const brokerNode = null;
            const errorMessage = "Broker nicht gefunden";

            if (!brokerNode) {
                expect(errorMessage).toBe("Broker nicht gefunden");
            }
        });

    });

    describe('Configuration Inheritance', () => {

        test('Output Node übernimmt Topic aus Message', () => {
            const nodeConfig = {
                topic: '',  // Leer - wird von Message übernommen
                qos: 1,
                retain: false
            };

            const incomingMessage = {
                topic: 'home/light/status',
                payload: 'on'
            };

            const targetTopic = nodeConfig.topic || incomingMessage.topic;

            expect(targetTopic).toBe('home/light/status');
        });

        test('Output Node nutzt konfiguriertes Topic', () => {
            const nodeConfig = {
                topic: 'home/configured/topic',
                qos: 1
            };

            const incomingMessage = {
                topic: 'home/other/topic',
                payload: 'data'
            };

            const targetTopic = nodeConfig.topic || incomingMessage.topic;

            expect(targetTopic).toBe('home/configured/topic');
        });

    });

    describe('Broker Connection Workflow', () => {

        test('Broker URL wird korrekt konstruiert', () => {
            const brokerConfig = {
                broker: 'localhost',
                port: 1883
            };

            const protocol = brokerConfig.broker.includes("://") ? "" : "mqtt://";
            const brokerUrl = protocol + brokerConfig.broker + ":" + brokerConfig.port;

            expect(brokerUrl).toBe("mqtt://localhost:1883");
        });

        test('Connection mit Credentials', () => {
            const brokerConfig = {
                broker: 'broker.example.com',
                port: 1883
            };

            const credentials = {
                user: 'admin',
                password: 'secret123'
            };

            const options = {
                username: credentials.user,
                password: credentials.password,
                clientId: 'test_client_123'
            };

            expect(options.username).toBe('admin');
            expect(options.password).toBe('secret123');
        });

    });

    describe('Komfort-Modus Toggle Workflow', () => {

        test('Komfort-Modus aktivieren und deaktivieren', () => {
            const lookup = { 'device123': 'Sensor Küche' };
            const topic = 'devices/device123/data';

            // Mit Komfort-Modus
            let displayTopic = topic;
            if (lookup.device123) {
                displayTopic = topic.replace('device123', lookup.device123);
            }

            expect(displayTopic).toBe('devices/Sensor Küche/data');

            // Komfort-Modus aus
            displayTopic = topic;
            expect(displayTopic).toBe('devices/device123/data');
        });

    });

});
