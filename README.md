# node-workflow

A Node.js workflow engine with retry capabilities.

## What is a workflow?

A workflow is a system for managing repetitive processes and tasks which occur in a particular order. They are the mechanism by which people and enterprises accomplish their work, whether manufacturing a product, providing a service, processing information or any other value-generating activity.

## Install

To install azure-middy, you can use NPM:

```bash
npm install --save @kevboutin/node-workflow
```

## Example

Please reference the example located in `index.js`.

## Why?

This provides a way to handle retrying various tasks in a sequence. Using a workflow improves code readability and reliability. If you have multiple functions to run sequentially or perhaps the return from one function is a required parameter to the next function, a workflow is a perfect solution.

## Usage

As you might have already seen from our example, using workflow is very simple and requires just few steps:

1.  Import `Workflow`.

```javascript
import { Workflow } from "./core/workflow.js";
```

2.  Write your functions as usual. In our example, we have `uploadImage`, `saveUser` and `sendVerificationEmail`.

```javascript
const saveUser = async ({ email, password, imageLink }) => {
    // ...
};
```

3.  Create your workflow inside of a try+catch block using `Workflow.createWorkflow()`.

```javascript
try {
    // Creating a workflow with a 4 retry limit.
    Workflow.createWorkflow(4, (workflow) => {
        // ...
    });
} catch (error) {
    console.error("Error in workflow.", error);
}
```

4.  Add each function as a workflow step using `create()`.

```javascript
workflow.create(async (image) => {
    // ...
});
```

5.  Optionally add a final workflow step using `finally()`. Note that `finally()` will not be retried. Use `create()` if retries are important.

```javascript
workflow.finally(async ({ email }) => {
    // ...
});
```

6.  Run your workflow using `run()`.

```javascript
Workflow.run(image);
```

> **NOTE:** Steps will be run in the order they are created.

### Handling errors

But, what happens when there is an error?

When there is an error, the step will be retried until the `retryLimit` is reached. Once the limit is reached, the error will be thrown to your try+catch block for handling.

If you have a finally function, it will always be called prior to terminating the workflow despite errors in prior steps.

## Publishing Releases

Use the following command to publish the various packages from this repository. Afterward, use GitHub to generate a new release based on the root package.json version.

```shell
npm publish
```
