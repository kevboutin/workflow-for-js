/**
 * @typedef {Object} StepFunction
 * @property {*} input Any input.
 */

/**
 * @typedef {Object} FinallyFunction
 * @property {*} input Any input.
 */

/**
 * Represents a workflow.
 * @class
 */
export class Workflow {
    /** @type {number} */
    #retryLimit;

    /** @type {Array<StepFunction>} */
    #steps = [];

    /** @type {FinallyFunction} */
    #finallyCallback;

    /**
     * Constructor.
     *
     * @param {number} retryLimit The number of retries before giving up with an error.
     */
    constructor(retryLimit = 3) {
        this.#retryLimit = retryLimit;
    }

    /**
     * Create a workflow.
     *
     * @param {number} retryLimit The number of retries before giving up with an error.
     * @param {Workflow} callback The Workflow.
     * @returns {Workflow} The created Workflow.
     */
    static createWorkflow(retryLimit, callback) {
        const workflow = new Workflow(retryLimit);
        callback(workflow);
        return workflow;
    }

    /**
     * Create a step and allow for chaining by returning this.
     *
     * @param {StepFunction} stepFunction The StepFunction.
     * @returns {Workflow} This Workflow.
     */
    create(stepFunction) {
        this.#steps.push(stepFunction);
        return this;
    }

    /**
     * Finish the workflow.
     *
     * @param {FinallyFunction} callback The last step.
     */
    finally(callback) {
        this.#finallyCallback = callback;
    }

    toString() {
        return { retryLimit: this.#retryLimit };
    }

    /**
     * Run this workflow.
     *
     * @param {*} initialInput The input.
     * @returns {Promise<void>}
     * @throws {Error} On any error after all retries have been exhausted.
     */
    async run(initialInput) {
        // Providing an initial input to the first step.
        let input = initialInput;
        /** @type {number} */
        let attempts = 0;
        /** @type {boolean} */
        let success = false;
        /** @type {Error} */
        let failure;

        for (let i = 0; i < this.#steps.length; i++) {
            const step = this.#steps[i];
            success = false;

            // Retrying the step as long as it is not successful and retry limit is not reached yet.
            // This also makes sure we re-run the workflow starting from the failed step.
            while (attempts < this.#retryLimit && !success) {
                try {
                    // Passing step's input to the next step.
                    input = await step(input);
                    success = true;
                } catch (error) {
                    console.log(
                        `Step ${i + 1} failed on attempt ${attempts + 1}/${this.#retryLimit}.`,
                        error,
                    );
                    attempts++;
                    if (attempts === this.#retryLimit) {
                        console.error(
                            `Step ${i + 1} failed after ${attempts} attempts.`,
                            error,
                        );
                        failure = error;
                    }
                }
            }
        }

        if (this.#finallyCallback) {
            await this.#finallyCallback(input);
            if (!success && failure) throw failure;
        }
    }
}
