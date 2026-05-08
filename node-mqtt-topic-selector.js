module.exports = function(RED) {
    "use strict";
    const mqtt = require("mqtt");

    // Temporary MQTT connection to browse topics — used by the editor UI.
    // Mirrors the broker config node's connection settings (TLS, credentials, protocol version).
    RED.httpAdmin.get('/mqtt-browse', function(req, res) {
        const brokerId = req.query.broker;
        const brokerNode = RED.nodes.getNode(brokerId);

        if (!brokerNode) {
            return res.status(404).json({ error: "Broker not found" });
        }

        const idPatternType = req.query.idPattern || "exact";
        const exactLen = parseInt(req.query.idLengthExact) || 32;
        const minLen = parseInt(req.query.idLengthMin) || 10;
        const maxLen = parseInt(req.query.idLengthMax) || 40;

        let idRegexPattern = req.query.idRegex;
        if (idPatternType === "exact") {
            idRegexPattern = `^[a-zA-Z0-9\\-_]{${exactLen}}$`;
        } else if (idPatternType === "minmax") {
            idRegexPattern = `^[a-zA-Z0-9\\-_]{${minLen},${maxLen}}$`;
        }

        let nameSuffix = req.query.nameSuffix || "/announce";
        if (!nameSuffix.startsWith('/')) nameSuffix = '/' + nameSuffix;

        const nameKeys = (req.query.nameKeys || "name,title,deviceName").split(',').map(k => k.trim());

        let idRegex;
        try {
            idRegex = new RegExp(idRegexPattern);
        } catch (_e) {
            idRegex = /^[a-zA-Z0-9\-_]{32}$/;
        }

        // Build broker URL, respecting TLS flag
        let brokerUrl;
        if (brokerNode.broker && brokerNode.broker.includes("://")) {
            brokerUrl = brokerNode.broker;
        } else {
            const protocol = brokerNode.usetls ? "mqtts://" : "mqtt://";
            brokerUrl = `${protocol}${brokerNode.broker}:${brokerNode.port || 1883}`;
        }

        // Replicate the broker config node's connection options
        const creds = RED.nodes.getCredentials(brokerId) || {};
        const options = {
            connectTimeout: 5000,
            reconnectPeriod: 0,
            clientId: 'mqtt_browse_' + Math.random().toString(16).substr(2, 8),
            keepalive: parseInt(brokerNode.keepalive) || 60,
            clean: brokerNode.cleansession !== undefined ? brokerNode.cleansession : true
        };

        if (creds.user) options.username = creds.user;
        if (creds.password) options.password = creds.password;

        const pv = parseInt(brokerNode.protocolVersion);
        options.protocolVersion = (pv === 3 || pv === 5) ? pv : 4;

        if (brokerNode.usetls) {
            if (brokerNode.tls) {
                const tlsNode = RED.nodes.getNode(brokerNode.tls);
                if (tlsNode) {
                    tlsNode.addTLSOptions(options);
                }
            } else {
                options.rejectUnauthorized = false;
            }
        }

        console.log("[MQTT-Browse] Connecting to:", brokerUrl);
        const client = mqtt.connect(brokerUrl, options);
        const topics = new Set();
        const nameLookup = {};
        let responded = false;
        let connected = false;
        let connectError = null;

        function finish() {
            if (responded) return;
            responded = true;
            client.end(true);
            res.json({
                topics: Array.from(topics).sort(),
                lookup: nameLookup,
                connected: connected,
                error: connectError
            });
        }

        client.on('connect', () => {
            connected = true;
            client.subscribe('#', { qos: 0 });
        });

        client.on('message', (topic, payload) => {
            topics.add(topic);
            if (topic.endsWith(nameSuffix)) {
                const basePath = topic.slice(0, topic.length - nameSuffix.length);
                const parts = basePath.split('/');
                const foundId = parts[parts.length - 1];
                if (foundId && idRegex.test(foundId)) {
                    try {
                        const data = JSON.parse(payload.toString().trim());
                        for (const key of nameKeys) {
                            if (data[key]) {
                                nameLookup[foundId] = data[key];
                                console.log(`[MQTT-Browse] Mapping: ${foundId} -> ${data[key]}`);
                                break;
                            }
                        }
                    } catch (_e) {}
                }
            }
        });

        client.on('error', (err) => {
            console.error('[MQTT-Browse] Error:', err.message);
            connectError = err.message;
            finish();
        });

        // 5 s total: enough for a TLS handshake (~500 ms) plus 4 s of live traffic
        setTimeout(finish, 5000);
    });

    // --- INPUT NODE ---
    // Uses the mqtt-broker config node for all connection management (TLS, protocol, keepalive, etc.).
    // Status updates are driven by the broker config node calling node.status() on all registered users.
    function MQTTInNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;
        node.topic = n.topic;
        node.qos = parseInt(n.qos) || 0;
        node.brokerConn = RED.nodes.getNode(n.broker);

        if (node.brokerConn) {
            node.status({ fill: "yellow", shape: "ring", text: "connecting" });

            if (node.topic) {
                node.brokerConn.subscribe(node.topic, { qos: node.qos }, function(topic, payload, packet) {
                    const msg = {
                        topic: topic,
                        payload: payload.toString(),
                        qos: packet.qos,
                        retain: packet.retain
                    };
                    if (packet.properties) {
                        const p = packet.properties;
                        if (p.responseTopic)              msg.responseTopic = p.responseTopic;
                        if (p.correlationData)            msg.correlationData = p.correlationData;
                        if (p.contentType)                msg.contentType = p.contentType;
                        if (p.userProperties)             msg.userProperties = p.userProperties;
                        if (p.messageExpiryInterval != null) msg.messageExpiryInterval = p.messageExpiryInterval;
                    }
                    node.send(msg);
                }, node.id);
            }

            node.brokerConn.register(node);

            node.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic, node.id);
                    node.brokerConn.deregister(node, done);
                } else {
                    done();
                }
            });
        } else {
            node.status({ fill: "red", shape: "ring", text: "no broker" });
        }
    }
    RED.nodes.registerType("mqtt-topic-selector-in", MQTTInNode);

    // --- OUTPUT NODE ---
    // Uses the mqtt-broker config node for publishing, which handles MQTT v5 properties,
    // topic alias, and all broker-level settings.
    function MQTTOutNode(n) {
        RED.nodes.createNode(this, n);
        const node = this;
        node.topic = n.topic;
        node.qos = n.qos || 0;
        node.retain = n.retain === "true" || n.retain === true;
        node.brokerConn = RED.nodes.getNode(n.broker);

        if (node.brokerConn) {
            node.status({ fill: "yellow", shape: "ring", text: "connecting" });

            node.brokerConn.register(node);

            node.on('input', function(msg, send, done) {
                const topic = node.topic || msg.topic;
                if (!topic) {
                    node.warn("No topic configured");
                    if (done) done();
                    return;
                }
                const publishMsg = {
                    topic: topic,
                    payload: msg.payload,
                    qos: parseInt(node.qos) || parseInt(msg.qos) || 0,
                    retain: node.retain != null ? node.retain : (msg.retain || false)
                };
                // Forward MQTT v5 properties when present
                if (msg.userProperties)             publishMsg.userProperties = msg.userProperties;
                if (msg.responseTopic)              publishMsg.responseTopic = msg.responseTopic;
                if (msg.correlationData)            publishMsg.correlationData = msg.correlationData;
                if (msg.contentType)                publishMsg.contentType = msg.contentType;
                if (msg.messageExpiryInterval != null) publishMsg.messageExpiryInterval = msg.messageExpiryInterval;
                if (msg.topicAlias != null)         publishMsg.topicAlias = msg.topicAlias;

                node.brokerConn.publish(publishMsg, done);
            });

            node.on('close', function(done) {
                node.brokerConn.deregister(node, done);
            });
        } else {
            node.status({ fill: "red", shape: "ring", text: "no broker" });
        }
    }
    RED.nodes.registerType("mqtt-topic-selector-out", MQTTOutNode);
};
