# Hello World — Echo Show widget

A small **Alexa Presentation Language (APL) home-screen widget**, intended for
widget-capable **Echo Show 21 and Echo Show 15** devices. It displays “Hello
world!”; tapping it opens the companion skill, which speaks a greeting and ends
the session. You can also say **“Alexa, open hello widget.”**

This is not an Android APK, Fire TV app, or a full-screen APL page masquerading
as a widget. The home-screen UI is an installable `APL_PACKAGE`.

## Starting point and license

An official example already exists:
[Amazon's Plant Care widget sample](https://github.com/alexa-samples/skill-sample-plant-care-widget).
This repository uses its skill/package layout and adapted manifests, simplified
to Hello World rather than copying the unrelated plant database and messaging
backend. The widget has no remote data bindings, database, external UI libraries,
or image downloads. Its companion Lambda has **no npm dependencies** and needs
no client secrets, API keys, account linking, or separately managed AWS account
when using Alexa-hosted skills.

See [NOTICE](NOTICE) for the upstream revision and changes. The adapted
`skill-package/` and `ask-resources.json` files use the
[Amazon Software License 1.0](licenses/Amazon-Software-License), including its
Amazon-platform-only use restriction. The original backend and tests use the
root [MIT license](LICENSE). The sample gallery icon/preview URLs in the widget
manifest are inherited Amazon placeholders; replace them with your own publicly
accessible HTTPS artwork before publishing to other people.

## Files

```text
ask-resources.json                       Alexa-hosted deployment type template
lambda/index.js                         Voice/tap endpoint (index.handler)
lambda/package.json                     Local check/test commands
lambda/test/skill.test.js                Built-in Node tests
lambda/test/package.test.js              Local widget/endpoint integration test
skill-package/skill.json                 Skill interfaces and widget registration
skill-package/interactionModels/custom/en-US.json
skill-package/dataStorePackages/hello-world/
  manifest.json                         Package ID, version, medium-widget metadata
  presentations/default.tpl             Links the APL document and datasource
  documents/document.json               Responsive, tappable greeting
  datasources/default.json              Text to customize
```

The package ID `hello-world` must agree in the skill manifest, directory name,
and package manifest. `WIDGET_M` describes the **widget**, not the entire
device display. Relative viewport units let the same UI fit landscape/portrait
widget placements without hard-coding the Show 21's physical pixel dimensions.

## Prerequisites and compatibility

- An [Amazon developer account](https://developer.amazon.com/alexa/console/ask)
  and an Echo Show registered to the **same Amazon account**.
- A current widget-capable Echo Show 21 or 15 firmware, an Internet connection,
  and access to the device's widget gallery. Use the Alexa home screen, not
  Fire TV mode.
- Start with **English (United States)** on the device and **en-US** in the
  developer console: this sample supplies only that locale. Other languages
  require interaction models and widget publishing metadata for those locales.
- Node.js 22 LTS (or a newer supported LTS), npm, Git, and the
  [ASK CLI](https://github.com/alexa/ask-cli). The JavaScript itself requires
  Node 18 or later; select a currently supported Node runtime offered by
  Alexa-hosted skills.

This targets the shared APL widget model, not an Echo Show 15-only API.
Actual gallery availability depends on firmware, marketplace, language, and
account experience (including Alexa experience changes). A
[community owner report](https://github.com/Gh0stbasta/tenner/blob/main/docs/backlog/maintenance/ticket004.md)
confirms a widget could be added on Show 21, but is not an Amazon compatibility
guarantee. **No physical Show 21
or 15 was available to verify this demo.** Check that your device exposes the
widget gallery and your development skill's widget before proceeding; simulator success
alone does not establish hardware support.

## 1. Configure the tools and create your own hosted skill

Install the CLI and sign in to the same developer account:

```sh
npm install -g ask-cli@2.30.7
ask configure
```

Use the `default` ASK profile for the commands below. With Alexa-hosted skills
you do not need to configure a personal AWS account. Do not commit the CLI's
credentials or generated `.ask/` directory.

**Create a fresh hosted skill in a separate directory** (not inside this
checkout):

```sh
cd /absolute/path/to/your/projects
ask new
```

Choose **Node.js**, **Alexa-hosted skills**, and a project name such as
`HelloWidgetHosted`; follow any remaining prompts. This provisions your own
skill, Lambda endpoint, and Amazon-hosted Git repository. Keep the generated
skill ID and endpoint settings.

Alternatively, create a **Custom / Alexa-hosted (Node.js)** skill named
**Hello World** in the developer console, then download it into a separate
directory with:

```sh
cd /absolute/path/to/your/projects
ask init --hosted-skill-id amzn1.ask.skill.YOUR-SKILL-ID
```

Do not run either creation command over an existing skill you care about.
The checked-in `ask-resources.json` only describes the deployment type;
it does **not** contain your skill ID or provision a skill by itself.

## 2. Copy the demo into the fresh hosted project

The commands below are for macOS/Linux (or WSL). Set both variables to
**absolute paths** on your own computer:

```sh
export DEMO_DIR=/absolute/path/to/echo-show-widget-hello-world
export HOSTED_DIR=/absolute/path/to/HelloWidgetHosted

cp -R "$DEMO_DIR/lambda/." "$HOSTED_DIR/lambda/"
mkdir -p "$HOSTED_DIR/skill-package/dataStorePackages"
cp -R "$DEMO_DIR/skill-package/dataStorePackages/hello-world" \
  "$HOSTED_DIR/skill-package/dataStorePackages/"
cp "$DEMO_DIR/skill-package/interactionModels/custom/en-US.json" \
  "$HOSTED_DIR/skill-package/interactionModels/custom/en-US.json"
cp "$DEMO_DIR/NOTICE" "$DEMO_DIR/LICENSE" "$HOSTED_DIR/"
cp -R "$DEMO_DIR/licenses" "$HOSTED_DIR/"
```

Merge the demo manifest while **retaining the hosted skill's generated endpoint
and regional endpoint configuration**. Run this exact command in the same shell:

```sh
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(process.env.HOSTED_DIR, 'skill-package', 'skill.json');
const hosted = JSON.parse(fs.readFileSync(file, 'utf8'));
const demo = JSON.parse(fs.readFileSync(
  path.join(process.env.DEMO_DIR, 'skill-package', 'skill.json'), 'utf8'));
demo.manifest.apis.custom = {
  ...hosted.manifest.apis.custom,
  ...demo.manifest.apis.custom
};
fs.writeFileSync(file, JSON.stringify(demo, null, 2) + '\n');
NODE
```

Keep the hosted project's generated `ask-resources.json`, `.ask/` state, Git
remote, and hooks; **do not overwrite these with this checkout's files**.
The manifest registers `ALEXA_DATASTORE_PACKAGEMANAGER`, `ALEXA_DATA_STORE`,
and `ALEXA_PRESENTATION_APL`, including the `hello-world` package.
Installation/update notifications are acknowledged by Lambda without speech.
There are no Data Store writes, so this demo needs no Skill Messaging credentials.

### Check gallery artwork before importing

The package manifest includes the official sample's `metadata.iconUri` and
`metadata.previews` URLs. These fields are required even for development imports.
Their availability could not be checked in the sandbox. Open both URLs from
`skill-package/dataStorePackages/hello-world/manifest.json` in your browser
before deploying. If either fails, host your own icon and widget preview at
public HTTPS URLs (no login or expiring links), then replace those values
in the hosted project's package manifest. Follow the
[widget reference](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-widgets-reference.html)
for current image requirements. A failed artwork fetch can block package import.

## 3. Check / “compile”

There is **no compilation step**: APL is JSON and Lambda runs JavaScript directly.
In your new hosted project, update any lockfile left by its scaffold, then check:

```sh
cd "$HOSTED_DIR/lambda"
npm install --package-lock-only --ignore-scripts
npm run check
npm test
```

The tests cover voice launch, taps, stop/help/fallback, silent lifecycle
acknowledgments, and links between the skill, widget manifest, presentation,
APL document, and data. For local checks in this repository instead, run
`npm run check` and `npm test` from its `lambda/` directory.
There is no separate linter or bundler.

### Automated testing

[Test widget demo](.github/workflows/test.yml) runs on pushes, pull requests, and
manual dispatch using Node.js **22 and 24**. It runs these separately from
`lambda/`:

```sh
npm run check             # Syntax-check the backend and test JavaScript
npm run test:unit         # Request/response behavior, including sessionless events
npm run test:integration  # Package -> presentation -> document/data -> tap handler
```

`npm test` runs both test files. No dependency installation, credentials,
deployment, or access to an Amazon account is required. Actions are pinned to
commit SHAs, with a read-only token and checkout credential persistence disabled.

The syntax check is not a full style linter; none is configured. A compilation
job would have nothing to compile. Cloud/device end-to-end testing is deliberately
**not** automated: the real deployment, gallery installation, rendering, and tap
checks in steps 4–5 require your account and hardware. The local integration test
does not validate Amazon's server-side schema or emulate an Echo Show renderer.

## 4. Deploy the development version

In the **new Amazon-hosted project**, inspect your changes, then commit and
push to its development deployment branch:

```sh
cd "$HOSTED_DIR"
git status
git add lambda skill-package NOTICE LICENSE licenses
git commit -m "Add Hello World home-screen widget"
git push origin master
```

These are commands for **your own hosted skill repository**, not this GitHub
repository. In ASK CLI v2, Alexa-hosted deployments use **Git push**, not
`ask deploy`. Amazon's hosted workflow uses `master` for the development
deployment and `prod` for live deployment; do not push this experiment to `prod`.
See the [official hosted CLI workflow](https://github.com/alexa/ask-cli/blob/develop/docs/concepts/Alexa-Hosted-Skill-Commands.md).

Wait for successful deployment/build in the
[developer console](https://developer.amazon.com/alexa/console/ask). In
**Build → Interfaces**, confirm APL/widget support and the imported widget
package are present; in the language model, confirm invocation name
**hello widget**. If the console requests **Build Model**, run it and wait for
completion. If the web code editor is disabled after a CLI deployment, use
the official hosted workflow's branch-sync instructions rather than deploying
an older editor copy over your changes.

## 5. Preview, enable testing, and add it to your Show

1. In the console's **Test** tab, enable testing for **Development** and choose
   **English (US)**. Try `open hello widget`; expect a spoken “Hello world!”
   This verifies the endpoint, **not** home-screen installation.
2. To preview the UI, open the console's
   [APL authoring tool](https://developer.amazon.com/alexa/console/ask) and load
   `documents/document.json` and `datasources/default.json` from the widget
   package. Choose a **medium widget** preview. Expect all three text lines,
   with no missing imports or images. A preview by itself cannot install it.
3. On the Echo Show, use the same signed-in account and matching device
   language. Say **“Alexa, open hello widget”** to confirm the development
   skill is accessible on the device.
4. Return to Home. Open the widgets panel by **swiping left from the right
   edge**, then select **“+”** / **Widget Gallery**. Another
   [community-documented route](https://github.com/Gh0stbasta/tenner/blob/main/alexa/README.md#echo-show-widgets-alexa-007-food-018)
   is **Settings → Widgets**. Find **Hello World**, select it, and choose
   **Add**. These device routes are community-documented, not verified here;
   menu labels and entry points vary by firmware.
5. Place the medium widget on the home screen/widget panel. Expect
   **Hello world!**, **Greetings from your Echo Show**, and the tap hint.
   Tap it: Alexa should speak the greeting, end the skill session, and leave
   the home-screen widget available.

**Do not submit for certification just to test on your own account.**
Development testing is the private-device workflow; certification and
publication are needed for general distribution to other customers. If you
want other people to install it, follow Amazon's widget certification guidance,
replace placeholder gallery artwork, complete the skill's distribution
metadata, and submit the skill and widget for review.

### If it does not appear

- Confirm the deployment and model build actually succeeded, testing is set to
  **Development**, and the device/account/language match. A Household's other
  adult account is not necessarily the developer account.
- If voice launch works but the gallery has no Hello World entry, inspect the
  registered package ID and package import status in the console. Merely
  enabling APL or uploading a full-screen document does not register a widget.
- Refresh the gallery after deployment. For subsequent package changes,
  increment `manifest.version` in the widget's `manifest.json` (for example
  `1.0.1`), redeploy, and remove/re-add the widget if necessary.
- If there is no widget gallery or your development widget is unavailable, check device
  software updates and Amazon's current support for your marketplace/account.
  Do not assume changing viewport dimensions can enable an unavailable service.
- Check the hosted skill's logs if taps or voice launch fail. This demo makes
  no outbound API calls and intentionally does not log request envelopes or
  user identifiers. Sessionless system notifications (including APL runtime
  and Data Store errors) are acknowledged silently rather than triggering
  unsolicited speech.

## Customize

Edit `skill-package/dataStorePackages/hello-world/datasources/default.json`
to change the displayed greeting. Edit `lambda/index.js` separately to change
what Alexa says. Keep the document's `SendEvent` argument `hello` aligned with
the Lambda tap handler. Add translated models and widget metadata before
switching away from en-US.

## Tutorials and reference

- [Official Plant Care widget sample](https://github.com/alexa-samples/skill-sample-plant-care-widget)
  — the source layout used here; expand to Data Store updates only when needed.
- [Alexa widgets documentation](https://alexa.design/widgets)
  — Amazon's official widgets documentation entry point and tutorials.
- [APL widgets reference / package format](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-widgets-reference.html)
  — package manifests, presentations, and widget behavior.
- [APL technical documentation](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-overview.html)
  — components, data binding, commands, and responsive layouts.
- [Build an Alexa-hosted skill](https://developer.amazon.com/en-US/docs/alexa/hosted-skills/build-a-skill-end-to-end-using-an-alexa-hosted-skill.html)
  — account setup and console deployment walkthrough.
- [ASK CLI quick start](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html)
  and [hosted-skill CLI commands](https://github.com/alexa/ask-cli/blob/develop/docs/concepts/Alexa-Hosted-Skill-Commands.md)
  — configuration, creation, and the hosted Git deployment workflow.
- [Skill Package API](https://developer.amazon.com/docs/smapi/skill-package-api-reference.html)
  — how packaged skill resources are imported/exported.
- [Official voice Hello World tutorial](https://github.com/alexa-samples/skill-sample-nodejs-hello-world)
  — background on the companion skill (not a widget example).

Amazon's developer documentation could not be fetched from the build sandbox.
The package format was checked against the official sample, and the hosted
deployment commands against the ASK CLI source/docs. Device-side UI and
availability still need verification on your Echo Show.
