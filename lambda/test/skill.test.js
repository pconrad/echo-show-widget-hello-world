'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { handler } = require('../index');

const skillPackage = path.resolve(__dirname, '../../skill-package');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

for (const request of [
    { type: 'LaunchRequest' },
    { type: 'IntentRequest', intent: { name: 'HelloWorldIntent' } },
    { type: 'Alexa.Presentation.APL.UserEvent', arguments: ['hello'] }
]) {
    test(`greets and ends the session for ${request.type}`, async () => {
        const result = await handler({ request });
        assert.equal(result.version, '1.0');
        assert.equal(result.response.outputSpeech.type, 'PlainText');
        assert.match(result.response.outputSpeech.text, /^Hello world!/);
        assert.equal(result.response.shouldEndSession, true);
    });
}

for (const name of ['AMAZON.StopIntent', 'AMAZON.CancelIntent', 'AMAZON.NavigateHomeIntent']) {
    test(`${name} exits`, async () => {
        const { response } = await handler({ request: { type: 'IntentRequest', intent: { name } } });
        assert.equal(response.outputSpeech.text, 'Goodbye!');
        assert.equal(response.shouldEndSession, true);
    });
}

for (const request of [
    { type: 'IntentRequest', intent: { name: 'AMAZON.HelpIntent' } },
    { type: 'IntentRequest', intent: { name: 'AMAZON.FallbackIntent' } },
    { type: 'Alexa.Presentation.APL.UserEvent', arguments: ['unexpected'] },
    { type: 'Alexa.Presentation.APL.UserEvent' }
]) {
    test(`offers help for ${JSON.stringify(request)}`, async () => {
        const { response } = await handler({ request });
        assert.match(response.outputSpeech.text, /open hello widget/);
        assert.equal(response.shouldEndSession, true);
    });
}

for (const type of [
    'SessionEndedRequest',
    'Alexa.DataStore.PackageManager.UsagesInstalled',
    'Alexa.DataStore.PackageManager.UsagesRemoved',
    'Alexa.DataStore.PackageManager.UpdateRequest',
    'Alexa.DataStore.PackageManager.InstallationError'
]) {
    test(`acknowledges ${type} without speaking or starting a session`, async () => {
        assert.deepEqual(await handler({ request: { type } }), { version: '1.0', response: {} });
    });
}

test('skill registration, package, presentation, data, and tap handler agree', async () => {
    const skill = readJson(path.join(skillPackage, 'skill.json'));
    const interfaces = skill.manifest.apis.custom.interfaces;
    const registration = interfaces.find((item) => item.type === 'ALEXA_DATASTORE_PACKAGEMANAGER');
    assert.equal(registration.packages.length, 1);
    const id = registration.packages[0].id;
    const packagePath = path.join(skillPackage, 'dataStorePackages', id);
    const widget = readJson(path.join(packagePath, 'manifest.json'));
    assert.equal(widget.manifest.id, id);
    assert.equal(widget.packageType, 'APL_PACKAGE');
    assert.equal(widget.publishingInformation.locales['en-US'][0].targetViewport, 'WIDGET_M');

    for (const definition of widget.manifest.presentationDefinitions) {
        const presentation = readJson(path.join(packagePath, definition.url));
        assert.equal(presentation.type, 'APL_PRESENTATION');
        const document = readJson(path.join(packagePath, presentation.documentUrl));
        const data = readJson(path.join(packagePath, presentation.datasourceUrl));
        assert.equal(document.type, 'APL');
        for (const parameter of document.mainTemplate.parameters) {
            assert.ok(data[parameter], `missing datasource ${parameter}`);
        }
        assert.equal(data.helloData.title, 'Hello world!');
        const tap = document.mainTemplate.items[0].onPress;
        assert.equal(tap.type, 'SendEvent');
        assert.equal(tap.flags.interactionMode, 'STANDARD');
        const { response } = await handler({
            request: { type: 'Alexa.Presentation.APL.UserEvent', arguments: tap.arguments }
        });
        assert.match(response.outputSpeech.text, /^Hello world!/);
    }

    const model = readJson(path.join(skillPackage, 'interactionModels/custom/en-US.json'));
    assert.equal(model.interactionModel.languageModel.invocationName, 'hello widget');
    assert.ok(model.interactionModel.languageModel.intents.some((intent) => intent.name === 'HelloWorldIntent'));
});
