# Test-Dokumentation

## Overview

Die Test-Suite für `node-red-contrib-mqtt-topic-selector` deckt alle kritischen Funktionen und Logik des Nodes ab.

## Test-Kategorien

### 1. Regex Pattern Tests
Validiert die verschiedenen ID-Erkennungsmuster:
- **Exakte Länge**: Prüft auf IDs mit fester Zeichenlänge (z.B. 32 Zeichen)
- **Min/Max Länge**: Validiert variable Längenbereiche
- **Custom Regex**: Testet benutzerdefinierte Regex-Muster
- **Fallback**: Prüft Fehlerbehandlung bei ungültigen Patterns

```bash
npm test -- --testNamePattern="Regex Pattern Tests"
```

### 2. Topic Suffix Processing
Testet die Verarbeitung von Topic-Suffixen:
- Slash-Behandlung bei Suffixen
- Extraction der Base-Path aus Topics
- Handling verschachtelter Pfade
- Korrekte ID-Extraktion

```bash
npm test -- --testNamePattern="Topic Suffix Processing"
```

### 3. ID Extraction und Mapping
Validiert die Geräte-ID-Erkennung und das Mapping:
- JSON Name Extraction mit Prioritätsreihenfolge
- Fallback-Mechanismen
- Parsing von komma-getrennten Keys
- Bereinigung von Leerzeichen

```bash
npm test -- --testNamePattern="ID Extraction"
```

### 4. JSON Payload Parsing
Testet die Verarbeitung von JSON-Payloads:
- Gültiges JSON Parsing
- Fehlerbehandlung bei ungültigem JSON
- Leer-String Handling
- Array-Payload Verarbeitung

```bash
npm test -- --testNamePattern="JSON Payload Parsing"
```

### 5. Broker URL Construction
Validiert die URL-Konstruktion:
- Broker URLs mit Protokoll
- Broker URLs ohne Protokoll
- Custom Port-Handling
- Standard-Werte

```bash
npm test -- --testNamePattern="Broker URL Construction"
```

### 6. QoS Handling
Testet Quality of Service Parameter:
- Default-Werte
- String zu Integer Konvertierung
- Validität der QoS-Levels (0, 1, 2)

```bash
npm test -- --testNamePattern="QoS Handling"
```

### 7. Retain Flag Handling
Validiert Retain-Flag Verarbeitung:
- String zu Boolean Konvertierung
- Boolean Passthrough
- Default-Werte

### 8. Payload Handling
Testet verschiedene Payload-Typen:
- Buffer zu String Konvertierung
- Numerische Payloads
- Object zu JSON String
- Whitespace Trimming

### 9. Error Handling
Validiert die Fehlerbehandlung:
- Fehlende Broker-Knoten
- Ungültige Regex-Patterns
- Ungültiges JSON

### 10. Topic List Deduplication
Testet die Deduplication und Sortierung:
- Doppelte Topics entfernen
- Sortierung von Topics
- Set-Verarbeitung

## Ausführung

### Alle Tests ausführen
```bash
npm test
```

### Mit Coverage Report
```bash
npm test -- --coverage
```

### Watch-Modus (für Entwicklung)
```bash
npm run test:watch
```

### Verbose Output
```bash
npm run test:verbose
```

### Spezifische Test-Suite
```bash
npm test -- --testNamePattern="Regex Pattern Tests"
```

### Mit Debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage-Ziele

Die Mindest-Coverage-Ziele sind in `jest.config.js` definiert:

| Metrik | Ziel |
|--------|------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

## Test-Struktur

Alle Tests befinden sich in `test/mqtt-topic-selector.test.js`:

```
mqtt-topic-selector.test.js
├── Regex Pattern Tests
├── Topic Suffix Processing
├── ID Extraction und Mapping
├── JSON Payload Parsing
├── Broker URL Construction
├── QoS Handling
├── Retain Flag Handling
├── Topic Wildcard Patterns
├── Payload Handling
├── Error Handling
├── Topic List Deduplication
├── Topic Matching mit Suffix
├── Client ID Generation
└── Configuration Validation
```

## Mocking

Die Tests verwenden `jest.fn()` für folgende Funktionen:
- `node.send()`
- `node.status()`
- `node.on()`

## Beispiel: Einen neuen Test hinzufügen

```javascript
describe('Mein neuer Feature', () => {
    test('sollte etwas tun', () => {
        const input = "test";
        const result = myFunction(input);
        
        expect(result).toBe("expected");
    });
});
```

## Continuous Integration

Die Test-Suite kann in CI/CD-Pipelines integriert werden:

```yaml
# GitHub Actions Beispiel
- name: Run Tests
  run: npm test -- --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Bekannte Einschränkungen

1. **Keine echte MQTT-Verbindung**: Tests simulieren MQTT-Clients
2. **Keine Node-RED-Instanz**: Tests laufen isoliert
3. **Mock-Daten**: Verwenden vordefinierte Testwerte

## Troubleshooting

### Tests schlagen fehl mit "Cannot find module 'jest'"
```bash
npm install --save-dev jest
```

### Coverage ist zu niedrig
- Überprüfen Sie, ob alle Codepfade getestet werden
- Fügen Sie Edge-Cases hinzu
- Überprüfen Sie `jest.config.js` für Coverage-Konfiguration

### Tests hängen oder timeouts
- Erhöhen Sie `testTimeout` in `jest.config.js`
- Prüfen Sie auf infinite Loops im Code
- Verwenden Sie `test.only()` für Debugging

## Weitere Ressourcen

- [Jest Dokumentation](https://jestjs.io/)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
