import { Workflow } from "./workflow.js";

describe("Workflow", () => {
    let workflow;

    beforeEach(() => {
        workflow = new Workflow(3);
    });

    test("should create workflow with default retry limit", () => {
        const workflow = new Workflow();
        expect(workflow.toString()).toEqual({ retryLimit: 3 });
    });

    test("should create workflow with custom retry limit", () => {
        const workflow = new Workflow(5);
        expect(workflow.toString()).toEqual({ retryLimit: 5 });
    });

    test("should execute steps in order", async () => {
        const steps = [];

        workflow
            .create(async (input) => {
                steps.push(1);
                return input;
            })
            .create(async (input) => {
                steps.push(2);
                return input;
            })
            .finally(async (input) => {
                steps.push(3);
            });

        await workflow.run("test");
        expect(steps).toEqual([1, 2, 3]);
    });

    test("should pass data between steps", async () => {
        workflow
            .create(async (input) => input + 1)
            .create(async (input) => input * 2)
            .finally(async (input) => {
                expect(input).toBe(4);
            });

        await workflow.run(1);
    });

    test("should retry failed steps", async () => {
        let attempts = 0;

        workflow.create(async () => {
            attempts++;
            if (attempts < 2) throw new Error("Failing step");
            return "success";
        });

        await workflow.run();
        expect(attempts).toBe(2);
    });

    test("should throw error after retry limit is reached", async () => {
        let attempts = 0;
        workflow.create(async () => {
            attempts++;
            throw new Error("Failing step");
        });

        try {
            await workflow.run();
        } catch (error) {
            expect(error.message).toBe("Failing step");
        }
        expect(attempts).toBe(3); // Default retry limit is 3
    });

    test("should execute finally block even if steps fail", async () => {
        let finallyExecuted = false;

        workflow
            .create(async () => {
                throw new Error("Failing step");
            })
            .finally(async () => {
                finallyExecuted = true;
            });

        await expect(workflow.run()).rejects.toThrow("Failing step");
        expect(finallyExecuted).toBe(true);
    });

    test("static createWorkflow should return configured workflow", async () => {
        const result = [];

        const workflow = Workflow.createWorkflow(3, (w) => {
            w.create(async (input) => {
                result.push(input);
                return input + 1;
            }).finally(async (input) => {
                result.push(input);
            });
        });

        await workflow.run(1);
        expect(result).toEqual([1, 2]);
    });
});
