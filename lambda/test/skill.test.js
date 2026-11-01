'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { handler } = require('../index');

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
    'Alexa.DataStore.PackageManager.InstallationError',
    'Alexa.Presentation.APL.RuntimeError',
    'Alexa.DataStore.Error',
    'System.ExceptionEncountered',
    'UnknownSystemNotification'
]) {
    test(`acknowledges ${type} without speaking or starting a session`, async () => {
        assert.deepEqual(await handler({ request: { type } }), { version: '1.0', response: {} });
    });
}
