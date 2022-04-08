+++
title = "Accessing a Static Web Apps Url From GitHub Actions"
date = 2022-04-08T05:49:45Z
description = "Are you using Static Web Apps and wanting to know the URL of the app you deployed in GitHub Actions? Here's how to do it"
draft = false
tags = ["javascript", "azure", "devops"]
tracking_area = "javascript"
tracking_id = "63334"
+++

I was recently working on a project where I wanted to add some tests using [Playwright](https://playwright.dev) to perform headless browser tests during the CI/CD pipeline.

Thankfully, my colleague [Nitya](https://twitter.com/nitya) has already written a blog post on how to do that, [which you can read here](https://nitya.github.io/learn-playwright/003-aswa-demo-app/).

This works just fine when the tests are running on the `main` branch, but I hit a snag with pull requests, because with Static Web Apps we get [pre-production environments for pull requests](https://docs.microsoft.com/azure/static-web-apps/review-publish-pull-requests?{{<cda>}}) and those are deployed with their own URLs.

Now we have a problem because in my tests I can't just have:

```js
test("basic test", async ({ page }) => {
    await page.goto("https://bit.ly/recipes-for-aj");
    await expect(page).toHaveTitle("Recipes 4 AJ");

    await page.locator("text=Tags").click();
});
```

Because that will always navigate to the production site! So, how can we solve this?

## Finding the URL of a deployment

If you've looked into the logs of the deployment of a Static Web App you'll have noticed that the URL is output there, whether it's the URL with custom domain, or the pre-production environment URL on a PR, so this means that the GitHub Actions are aware of the URL.

Next stop, [`azure/static-web-apps-deploy`](https://github.com/azure/static-web-apps-deploy) to have a look at how the Action works. Alas it's a Docker Action, which means we can't see the internals of it, but that's not a _major_ problem because we can check out the [`actions.yaml`](https://github.com/Azure/static-web-apps-deploy/blob/v1/action.yml) and see the following:

```yaml
outputs:
    static_web_app_url:
        description: "Url of the application"
```

Awesome! The Action will actually output the URL for us.

## Using `output` across jobs

Following Nitya's pattern, we're going to create a new job in our workflow to run the Playwright tests:

```yaml
jobs:
    build_and_deploy_job:
        # snip

    test:
        name: "Test site using Playwright"
        timeout-minutes: 60
        needs: build_and_deploy_job
        runs-on: ubuntu-20.04
        steps:
        - uses: actions/checkout@master
        - uses: actions/setup-node@v2
            with:
            node-version: '14.x'

        - name: Install dependencies
            run: |
                cd testing
                npm ci
                npx playwright install-deps
                npx playwright install
        - name: Run Playwright Tests
            continue-on-error: false
            working-directory: testing
            run: |
                npx playwright test --reporter=html --config playwright.config.js
```

We'll also update our test to use an environment variable to provide the URL, rather than having it embedded:

```js
test("basic test", async ({ page }) => {
    await page.goto(process.env.SWA_URL);

    // Be assertive
});
```

To get that as an environment variable we have to first output it from the `build_and_deploy_job`:

```yaml
jobs:
    build_and_deploy_job:
        if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
        runs-on: ubuntu-latest
        name: Build and deploy website
        outputs:
            static_web_app_url: ${{ steps.swa.outputs.static_web_app_url }}
        steps:
        - uses: actions/checkout@v3
            with:
            submodules: true
        - name: Build And Deploy
            id: swa
            # snip
```

The important part is `static_web_app_url: ${{ steps.swa.outputs.static_web_app_url }}` in which were telling GitHub Actions that the `step` `swa` will have an output that we want to make an output of this `job`.

We can then use it in our `test` job like so:

```yaml
test:
    name: "Test site using Playwright"
    timeout-minutes: 60
    needs: build_and_deploy_job
    runs-on: ubuntu-20.04
    env:
        SWA_URL: ${{ needs.build_and_deploy_job.outputs.static_web_app_url }}
    steps:
    # snip
```

The snippet `${{ needs.build_and_deploy_job.outputs.static_web_app_url }}` tells GitHub Actions to look at the dependent job (`needs.build_and_deploy_job`) outputs and find the one we want and set it as an environment variable.

And just like that, you no longer need to have hard-coded URLs for your tests.

## Conclusion

By leveraging `output` variables from GitHub Action steps and jobs we're able to simplify our GitHub workflows when it comes to doing something like automated tests using Playwright.

To show this in action I've created a [PR for Nitya's sample application](https://github.com/nitya/aswa-hugo-recipes4aj/pull/1) so you can see the changes that I made and how the GitHub Actions run now looks.
