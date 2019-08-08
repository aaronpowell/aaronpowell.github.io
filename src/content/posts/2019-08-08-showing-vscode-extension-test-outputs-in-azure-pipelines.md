+++
title = "Showing VS Code Extension Test Outputs in Azure Pipelines"
date = 2019-08-08T10:26:12+10:00
description = "A guide on how to display test outputs from VS Code Extension tests in Azure Pipelines"
draft = false
tags = ["vscode", "testing", "azure-devops"]
+++

I've been working on my [VS Code](https://code.visualstudio.com?{{<cda>}}) [Profile Switching Extension](https://marketplace.visualstudio.com/items?itemName=aaronpowell.vscode-profile-switcher&{{<cda>}}) and one thing that I wanted to ensure I was doing in it was writing tests. There's a [good guide on writing tests](https://code.visualstudio.com/api/working-with-extensions/testing-extension?{{<cda>}}) from the VS Code team which I recommend you read if you're an extension author.

In this post, I want to look at how we can combine the output of our test runs in a Continuous Integration pipeline, for which I'll be using Azure Pipelines (which is free for open source projects!).

## Generating Test Output for Azure Pipelines

Azure Pipelines supports a number of different test result formats in the [Publish Test Results task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/test/publish-test-results?view=azure-devops&tabs=yaml&{{<cda>}}) that we'll need to use and one of those is Xunit [which Mocha supports out of the box](https://mochajs.org/#xunit).

Great, we can set the reporter to `xunit` by updating the [test runner script](https://code.visualstudio.com/api/working-with-extensions/testing-extension?{{<cda>}}#the-test-runner-script):

```ts
import * as path from "path";
import * as Mocha from "mocha";
import * as glob from "glob";

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: "tdd",
        reporter: "xunit" //change the reporter to xunit
    });
    mocha.useColors(true);

    const testsRoot = path.resolve(__dirname, "..");

    return new Promise((c, e) => {
        glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                e(err);
            }
        });
    });
}
```

And this works nicely... except the `xunit` output is an XML file which, might be readable by a computer but it's not ideal for local testing, I'd much prefer to use [Spec](https://mochajs.org/#spec) (or [Nyan](https://mochajs.org/#nyan)!), but Mocha only supports a single reporter as the output.

## Using Multiple Reports

Thankfully, someone in the community has created a reporter for Mocha which is a pass-through that allows you to output to multiple reporters!

Start by installing [`mocha-multi-reporters`](https://www.npmjs.com/package/mocha-multi-reporters):

```bash
npm install --save-dev mocha-multi-reporters
```

Now we can change the way we configure Mocha to use as many output reporters as we want:

```ts
import * as path from "path";
import * as Mocha from "mocha";
import * as glob from "glob";
import { createReport } from "../coverage";

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: "tdd",
        timeout: 7500,
        reporter: "mocha-multi-reporters",
        reporterOptions: {
            reporterEnabled: "spec, xunit",
            xunitReporterOptions: {
                output: path.join(__dirname, "..", "..", "test-results.xml")
            }
        }
    });

    mocha.useColors(true);

    // snip
}
```

Once combined with the Azure Pipeline task for publishing test results we'll now see the output in Azure Pipelines!

![Test Results in Azure Pipelines](/images/vscode-testing-reports-azure-pipelines.png)

You can check out my extensions [Azure Pipelines](https://dev.azure.com/aaronpowell/VS%20Code%20Profile%20Switcher/_build/results?buildId=724&view=ms.vss-test-web.build-test-results-tab).
