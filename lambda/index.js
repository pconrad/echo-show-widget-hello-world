'use strict';

exports.handler = async (event) => {
    const request = event.request;
    const response = {};
    let speech;

    if (!['LaunchRequest', 'IntentRequest', 'Alexa.Presentation.APL.UserEvent'].includes(request.type)) {
        return { version: '1.0', response };
    }

    const intent = request.intent?.name;
    if (request.type === 'LaunchRequest'
        || (request.type === 'Alexa.Presentation.APL.UserEvent'
            && request.arguments?.[0] === 'hello')
        || (request.type === 'IntentRequest' && intent === 'HelloWorldIntent')) {
        speech = 'Hello world! Greetings from your Echo Show widget.';
    } else if (request.type === 'IntentRequest'
        && (intent === 'AMAZON.StopIntent'
            || intent === 'AMAZON.CancelIntent'
            || intent === 'AMAZON.NavigateHomeIntent')) {
        speech = 'Goodbye!';
    } else {
        speech = 'Say Alexa, open hello widget, or add Hello World from the widget gallery.';
    }

    response.outputSpeech = { type: 'PlainText', text: speech };
    response.shouldEndSession = true;
    return { version: '1.0', response };
};
