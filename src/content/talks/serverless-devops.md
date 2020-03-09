---
title: "Serverless DevOps"
hidden: true
tags: ["serverless", "devops"]
duration: 45 minutes
abstract: |
    Serverless components can sometimes feel a little cavalier in their creation, a single script file and little-to-no dependencies, so it can be quite tempting to just deploy them through a "right click -> publish" model.

    But we know we shouldn't do it that way, we know we should apply a proper DevOps model with Continuous Integration and Continuous Deployment.

    So let's take GitHub Actions for a spin to look at just how simply we can add CI/CD to our repository and get our components deployed into the cloud. We'll have a look at how we can do things like release promotion across environments, securely manage the credentials our app needs to ensure we are doing safe, secure and repeatable deployments.

audience:
    - People experienced in Serverless
    - People wanting to improve automation

notes: |
    While the talk covers off how to use GitHub Actions for CI/CD and Azure as the deployment target, the concepts will be described in a generalised fashion so that you could swap out the products for others that a person is using.

    We'll also look at some advanced patterns with automation like promoting across environment through approval.

resources:
    - name: Video - GitHub Actions + Azure Functions
      link: /posts/2020-02-28-using-github-actions-with-azure-functions
    - name: Blog post - Deploying Azure Functions with GitHub Actions
      link: /posts/2020-01-10-deploying-azure-functions-with-github-actions
---
