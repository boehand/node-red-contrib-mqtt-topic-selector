# Testing Quick Start Guide

## Installation

```bash
# Dependencies installieren
npm install

# Dev Dependencies installieren (für Tests)
npm install --save-dev jest
```

## Tests ausführen

### Schnellstart
```bash
# Alle Tests einmal ausführen
npm test
```

### Mit Coverage Report
```bash
# Tests mit Coverage-Bericht
npm test -- --coverage

# Nur HTML Coverage Report öffnen
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Watch Mode (für Entwicklung)
```bash
# Tests automatisch bei Änderungen ausführen
npm run test:watch
```

### Verbose Output
```bash
# Detaillierter Output für jeden Test
npm run test:verbose
```

## Test-Struktur

```
test/
├── mqtt-topic-selector.test.js    # Unit Tests
├── integration.test.js             # Integration Tests
└── README.md                        # Test-Dokumentation
```

## Test-Suites

### Unit Tests (mqtt-topic-selector.test.js)
- **Regex Patterns**: ID-Erkennungsmuster testen
- **Topic Processing**: Topic-Verarbeitung
- **ID Extraction**: Geräte-ID-Erkennung
- **JSON Parsing**: Payload-Verarbeitung
- **Configuration**: Konfigurationsvalidierung
- **Error Handling**: Fehlerbehandlung

### Integration Tests (integration.test.js)
- **Komfort-Modus Workflow**: Komplette Funktionalität
- **MQTT Message Flow**: Nachrichtenfluss
- **Topic Browser**: Browse-Funktionalität
- **Error Recovery**: Fehler-Recovery
- **Broker Connections**: Verbindungsaufbau

## Spezifische Tests ausführen

```bash
# Nur Regex Pattern Tests
npm test -- --testNamePattern="Regex Pattern Tests"

# Nur Integration Tests
npm test -- test/integration.test.js

# Nur ein bestimmter Test
npm test -- --testNamePattern="Exact length pattern"
```

## Coverage-Ziele

Mindest-Coverage zum Merge:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Coverage anzeigen:
```bash
npm test -- --coverage
```

## Häufige Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm test` | Alle Tests ausführen |
| `npm run test:watch` | Watch-Modus |
| `npm run test:verbose` | Detaillierter Output |
| `npm test -- --coverage` | Mit Coverage-Report |
| `npm test -- --updateSnapshot` | Snapshots aktualisieren |
| `npm test -- test/file.test.js` | Nur eine Datei testen |

## Debugging

### VS Code Debugging
```json
{
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Command Line Debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Beispiel: Neuen Test hinzufügen

1. **Test-Datei öffnen**: `test/mqtt-topic-selector.test.js`
2. **Neue Test-Suite**: 
```javascript
describe('Mein Feature', () => {
    test('sollte XYZ tun', () => {
        const result = myFunction();
        expect(result).toBe('erwartet');
    });
});
```
3. **Tests ausführen**: `npm test`

## CI/CD Integration

Tests werden automatisch ausgeführt bei:
- Push auf `main` oder `develop`
- Pull Requests auf `main` oder `develop`

GitHub Actions Workflow: `.github/workflows/test.yml`

Getestete Node-Versionen:
- Node.js 14.x
- Node.js 16.x
- Node.js 18.x

## Troubleshooting

### "Jest not found"
```bash
npm install --save-dev jest
```

### Tests hängen
Erhöhen Sie das Timeout:
```bash
npm test -- --testTimeout=20000
```

### Coverage zu niedrig
- Öffnen Sie `coverage/lcov-report/index.html`
- Überprüfen Sie untestete Zeilen
- Fügen Sie mehr Tests hinzu

### Snapshot Fehler
```bash
npm test -- --updateSnapshot
```

## Best Practices

1. **Beschreibende Test-Namen verwenden**
   ```javascript
   test('sollte Topic-Suffix korrekt entfernen', () => {
   ```

2. **Arrange-Act-Assert Pattern**
   ```javascript
   // Arrange
   const input = "test";
   
   // Act
   const result = myFunction(input);
   
   // Assert
   expect(result).toBe("expected");
   ```

3. **One assertion pro Test**
   - Testet eine Sache
   - Einfacher zu debuggen

4. **Mock externe Dependencies**
   - Verwende `jest.fn()`
   - Simuliere MQTT-Clients

## Resources

- [Jest Dokumentation](https://jestjs.io/docs/getting-started)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)
- [Expect Matchers](https://jestjs.io/docs/expect)

## Support

Für Fragen zu Tests:
1. Überprüfen Sie `test/README.md`
2. Schau in die existierenden Tests
3. Öffne ein Issue auf GitHub
