module.exports = function(RED) {
    "use strict";
    const mqtt = require("mqtt");

    RED.httpAdmin.get('/mqtt-browse', function(req, res) {
        const brokerId = req.query.broker;
        const brokerNode = RED.nodes.getNode(brokerId);
        const creds = RED.nodes.getCredentials(brokerId) || {};

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

        // Ensure that the suffix starts with a slash
        let nameSuffix = req.query.nameSuffix || "/announce";
        if (!nameSuffix.startsWith('/')) nameSuffix = '/' + nameSuffix;

        const nameKeys = (req.query.nameKeys || "name,title,deviceName").split(',').map(k => k.trim());

        let idRegex;
        try {
            idRegex = new RegExp(idRegexPattern);
        } catch(_e) {
            idRegex = /^[a-zA-Z0-9\-_]{32}$/; // Fallback
        }

        if (!brokerNode) {
            return res.status(404).send("Broker not found");
        }

        const protocol = (brokerNode.broker && brokerNode.broker.includes("://")) ? "" : "mqtt://";
        const brokerUrl = protocol + brokerNode.broker + ":" + brokerNode.port;

        const options = { 
            connectTimeout: 5000,
            username: creds.user,
            password: creds.password,
            clientId: 'mqtt_browse_' + Math.random().toString(16).substr(2, 8)
        };

        const client = mqtt.connect(brokerUrl, options);
        const topics = new Set();
        const nameLookup = {};

        client.on('connect', () => {
            client.subscribe('#');
        });

        client.on('message', (topic, payload) => {
            const val = payload.toString().trim();
            topics.add(topic);
            
            // Generic comfort logic - BUGFIX
            if (topic.endsWith(nameSuffix)) {
                // Remove the info-topic at the end to get the pure base path
                // From 'iounits/12345/announce' becomes 'iounits/12345'
                const basePath = topic.slice(0, topic.length - nameSuffix.length);
                const parts = basePath.split('/');
                
                // The ID is always the last node of the base path (directly before the suffix!)
                const foundId = parts[parts.length - 1];

                if (foundId && idRegex.test(foundId)) {
                    try {
                        const data = JSON.parse(val);
                        for (let key of nameKeys) {
                            if (data[key]) {
                                nameLookup[foundId] = data[key];
                                console.log(`[MQTT-Browse] Mapping found: ${foundId} -> ${data[key]}`);
                                break;
                            }
                        }
                    } catch (_e) {
                        // Payload was not valid JSON
                    }
                }
            }
        });

        client.on('error', (err) => {
            console.error('[MQTT-Browse] Connection error:', err.message);
            client.end();
        });

        setTimeout(() => {
            client.end();
            res.json({
                topics: Array.from(topics).sort(),
                lookup: nameLookup
            });
        }, 2500);
    });

    // --- Node Definitions ---
    function MQTTInNode(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic;
        this.qos = n.qos || 0;
        this.brokerConn = RED.nodes.getNode(n.broker);
        const node = this;

        if (this.brokerConn) {
            const protocol = this.brokerConn.broker.includes("://") ? "" : "mqtt://";
            this.client = mqtt.connect(protocol + this.brokerConn.broker + ":" + this.brokerConn.port, {
                username: this.brokerConn.credentials?.user, 
                password: this.brokerConn.credentials?.password
            });
            this.client.on('connect', () => {
                node.status({fill:"green",shape:"dot",text:"connected"});
                if (node.topic) node.client.subscribe(node.topic);
            });
            this.client.on('message', (t, p) => node.send({topic:t, payload:p.toString()}));
            this.client.on('error', (err) => {
                node.status({fill:"red",shape:"ring",text:"error: " + err.message});
            });
            this.on('close', (done) => this.client.end(true, done));
        } else {
            this.status({fill:"red", shape:"ring", text:"no broker"});
        }
    }
    RED.nodes.registerType("mqtt-topic-selector-in", MQTTInNode);

    function MQTTOutNode(n) {
        RED.nodes.createNode(this, n);
        this.topic = n.topic;
        this.qos = n.qos || 0;
        this.retain = n.retain === "true" || n.retain === true;
        this.brokerConn = RED.nodes.getNode(n.broker);
        const node = this;

        if (this.brokerConn) {
            const protocol = this.brokerConn.broker.includes("://") ? "" : "mqtt://";
            this.client = mqtt.connect(protocol + this.brokerConn.broker + ":" + this.brokerConn.port, {
                username: this.brokerConn.credentials?.user, 
                password: this.brokerConn.credentials?.password
            });
            
            this.client.on('connect', () => {
                node.status({fill:"green",shape:"dot",text:"connected"});
            });

            this.client.on('error', (err) => {
                node.status({fill:"red",shape:"ring",text:"error: " + err.message});
            });

            this.on('input', (msg, send, done) => {
                const targetTopic = node.topic || msg.topic;
                if (targetTopic && node.client && node.client.connected) {
                    node.client.publish(targetTopic, String(msg.payload), { qos: parseInt(node.qos), retain: node.retain });
                }
                if(done) done();
            });
            this.on('close', (done) => this.client.end(true, done));
        } else {
            this.status({fill:"red", shape:"ring", text:"no broker"});
        }
    }
    RED.nodes.registerType("mqtt-topic-selector-out", MQTTOutNode);
};