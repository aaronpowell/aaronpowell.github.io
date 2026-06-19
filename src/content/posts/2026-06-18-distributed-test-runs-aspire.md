+++
title = "Distributed Test Runs in the Aspire Community Toolkit"
date = 2026-06-18T16:59:16Z
description = "How we evolved from static test lists to intelligent test selection in GitHub Actions to make CI/CD faster and smarter."
draft = false
tags = ["aspire", "ci-cd", "github-actions", "testing", "devops"]
tracking_area = "aspire"
tracking_id = ""
+++

The [Aspire Community Toolkit](https://github.com/CommunityToolkit/Aspire) has grown into a comprehensive collection of integrations to expand how developers can build and orchestrate distributed applications with [Aspire](https://aspire.dev). As the project has expanded, so has its test suite. With over 50 integrations, each with their own tests, running the full test suite in CI can take a significant amount of time. In this post, I'll walk you through our journey of optimising test execution in GitHub Actions, from our initial approach to where we are today.

## The Problem: Tests Take Too Long

When you're shipping a PR, the last thing you want is to wait for CI/CD to finish. Every minute spent waiting is a minute you could be reviewing code, writing documentation, or, let's be honest, moving onto the next task.

Each integration in the Toolkit has unit tests for the API surface area, as well as integration tests that runs the Aspire app host, so it will start backends, containers, seed databases, whatever else is needed to validate the integration works end-to-end. With over 50 integrations we have over 1000 tests (I actually don't know the exact number, but it's a lot), and we want to run these tests on both Windows and Linux to ensure cross-platform compatibility.

Because of this, a simple `dotnet test` on the solution is just not practical, it can take up to an hour to run this, even with the parallelism that xUnit gives us as a testing framework, especially when we want to do this across two different OSes with a dozen of runtimes installed.

## Exploiting Parallelism with GitHub Actions

Our first optimisation was to distribute tests across multiple runners using GitHub Actions' matrix strategy. Instead of running all tests sequentially on a single machine, we could run them in parallel across multiple workers.

The workflow looked something like this:

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        test: [Integration1, Integration2, Integration3, ...]  # List of test projects
    runs-on: ${{ matrix.os }}
    steps:
      - name: Run tests
        run: dotnet test tests/CommunityToolkit.Aspire.${{ matrix.test }}/...
```

This was a solid improvement as we no longer needed to wait for one project to finish before the next one started. However, this had a different problem, and that's one of scale. When I originally implemented this we only had a handful of integrations, so the number of parallel runs was manageable, but as we got more and more integrations, this list would expand, and as a result, each PR would run well over 100 parallel jobs! At this point we started to see a different problem creep in, one of stability. We'd have some tests that would fail due to transient issues, maybe it'd timeout downloading a runtime, we'd be ratelimited by Docker Hub for pulling too many issues, or sometimes the Docker socket simply didn't start. Generally speaking, these issues weren't even related to the code changes in the PR, but they would cause the CI run to fail, and we'd have to re-run it, which was frustrating for everyone involved. 

## Smart Test Selection

To solve this, we needed a way to determine which tests were actually affected by a change. This required two key pieces:

### 1. Analyzing Changed Files

We created a C# script (`select-affected-tests.cs`) that:

1. **Gets the list of changed files** between the base branch and the PR head
2. **Builds a dependency map** of which projects depend on which packages
3. **Traces the impact** of changes through the codebase
4. **Determines affected tests** based on what changed

The script handles several scenarios:

- **Source code changes**: If you change `src/CommunityToolkit.Aspire.Hosting.Sqlite/`, it knows that `CommunityToolkit.Aspire.Hosting.Sqlite.Tests` is affected
- **Shared infrastructure changes**: If you change `Directory.Build.props` or `.github/workflows/`, it knows all tests need to run
- **Package changes**: If you bump a package version that affects multiple components, it selects all affected tests
- **Ignored changes**: Documentation-only changes (`.md` files) are safely ignored

Here's a simplified version of the logic:

```csharp
foreach (var filePath in diffFiles)
{
    // Ignore documentation changes
    if (filePath.EndsWith(".md")) continue;
    
    // Global changes = run everything
    if (IsGlobalFile(filePath)) {
        runAll = true;
        break;
    }
    
    // Find the project this file belongs to
    var project = NearestProject(filePath, projectPaths);
    if (project != null && nodeToTests.TryGetValue(project, out var tests))
    {
        selected.UnionWith(tests);
    }
}
```

### 2. Passing Selected Tests to the Matrix

The workflow now has two jobs:

**Job 1: Select Affected Tests** (runs on every PR)
```yaml
jobs:
  affected-tests:
    runs-on: ubuntu-latest
    outputs:
      selected-tests: ${{ steps.select.outputs.selected_tests }}
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0  # Need full history for diff
      - name: Select affected tests
        id: select
        run: dotnet run eng/testing/select-affected-tests.cs -- \
          --base-sha ${{ github.event.pull_request.base.sha }} \
          --head-sha ${{ github.event.pull_request.head.sha }}
```

**Job 2: Run Selected Tests** (uses the output from Job 1)
```yaml
jobs:
  run-tests:
    needs: affected-tests
    uses: ./.github/workflows/tests.yaml
    with:
      selected-tests: ${{ needs.affected-tests.outputs.selected-tests }}
```

The `tests.yaml` workflow checks if tests were selected. If yes, it uses only those tests. If not (or if the selection fell back to "run all"), it runs the full suite:

```yaml
jobs:
  resolve-test-matrix:
    steps:
      - name: Resolve test matrix
        run: |
          if [ -n "${SELECTED_TESTS}" ]; then
            TESTS_JSON="${SELECTED_TESTS}"
          else
            TESTS_JSON="$(bash ./eng/testing/generate-test-list-for-workflow.sh --json)"
          fi
          
          echo "tests=${TESTS_JSON}" >> "${GITHUB_OUTPUT}"
```

Then, you can provide a variable to the matrix when defining the strategy:

```yaml
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        name: ${{ fromJson(needs.resolve-test-matrix.outputs.tests) }}
```

I had no idea that you could do this dynamically, and it's really cool!

## The Results

With smart test selection, we've achieved:

- **Faster feedback**: A small change to a single component now runs only the affected tests, completing in 5-10 minutes instead of 30+.
- **Cost savings**: Fewer runner minutes means lower CI costs.
- **Better developer experience**: Developers get faster feedback and can iterate more quickly.
- **Safety nets**: The script falls back to running all tests if it's unsure (e.g., when core infrastructure changes), ensuring we never miss a test that should have run.

## Drawbacks and Trade-offs

The script is conservative by design as it can be difficult to perfectly determine which tests are affected by a change. To mitigate this, we have some fallback rules:

- **Unknown package changes**: If a package is referenced but the script can't determine which projects use it, run all tests.
- **Core infrastructure changes**: If `Directory.Build.props`, `.github/workflows/`, or other global files change, run all tests.
- **Shared test infrastructure**: Changes to test-specific utilities and helpers trigger the full suite.
- **Code coverage is inconsistent**: Sometimes we have tests that leverage multiple integrations (RavenDB is an example), so we may not run tests across both the client and hosting integration depending on the change, which means that the coverage report doesn't have the full picture. We've had to accept this as a trade-off for faster feedback, but it's something we may want to revisit in the future.

This means you might occasionally run more tests than strictly necessary, but you'll never run fewer tests than you should.

## The Code

All of this logic lives in the Aspire Community Toolkit repository:

- **Test selection script**: `eng/testing/select-affected-tests.cs`
- **Test list generation**: `eng/testing/generate-test-list-for-workflow.sh`
- **Test execution workflow**: `.github/workflows/tests.yaml`
- **CI orchestration**: `.github/workflows/dotnet-ci.yml`

This approach was introduced in [PR #1355](https://github.com/CommunityToolkit/Aspire/pull/1355), which refined the test execution strategy significantly.

## Conclusion

Admittedly, this was something that I should have tackled a long time ago. For months I'd been getting frustrated at the PR feedback loop and the sheer number of tests that were running, transient failures, needing to restart CI runs, but it was just one of those "urgh, I'll get to it eventually" things.

Most of the implementation work was done by GitHub Copilot, I iterated on a session with it outlining the problem and the approach, and there's been a bunch of tweaks along the way to improve the logic on detecting tests. I also had no idea that you can provide a variable to the matrix strategy, so that was a really cool discovery that Copilot brought to the table.

Overall, this has been a great learning experience in how to optimise CI/CD workflows, and it's made a significant difference in our development process. Here's some final takeaways:

1. **Not all tests are equally important for every PR**: Just because you have tests doesn't mean they all need to run on every change
2. **Conservative fallbacks are your friend**: It's better to run too many tests occasionally than to miss a broken test
3. **Visibility matters**: Logging which tests were selected and why helps developers understand what's running
4. **Build on existing tools**: GitHub Actions and standard shell/C# scripting were enough to implement this without adding new dependencies
