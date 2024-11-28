import { Workflow } from "./lib/workflow.js";

/**
 * @typedef User
 * @property {string} id The user identifier.
 * @property {string} email The email address.
 * @property {string} password The password.
 * @property {string} image The image URL.
 */

/**
 * Delete the user.
 *
 * @param {Object} params The parameters.
 * @param {string} params.email The email address.
 * @returns {void}
 */
const deleteUser = async ({ email }) => {
    await timeout(1000);
    return;
};

/**
 * Save the user.
 *
 * @param {Object} params The parameters.
 * @param {string} params.email The email address.
 * @param {string} params.password The password.
 * @param {string} params.imageLink The image URL.
 * @returns {User} The user information.
 */
const saveUser = async ({ email, password, imageLink }) => {
    await timeout(1000);
    return {
        id: "1",
        email,
        password,
        image: imageLink,
    };
};

/**
 * Send a verification email.
 *
 * @param {Object} params The parameters.
 * @param {string} params.email The email address to send to.
 */
const sendVerificationEmail = async ({ email }) => {
    await timeout(1000);
    console.log("Email sent successfully to: ", email);
};

/**
 * Perform a timeout for a specified amount of time.
 *
 * @param {number} ms Milliseconds to wait.
 * @returns {Promise} A Promise to return.
 */
const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * @typedef Image
 * @property {string} imageLink The image URL.
 */

/**
 * Delete an image.
 *
 * @param {string} imageLink The image URL.
 * @returns {void}
 */
const deleteImage = async (imageLink) => {
    await timeout(1000);
    return;
};

/**
 * Upload an image.
 *
 * @param {Blob} _image The blob.
 * @returns {Image} The image information.
 */
const uploadImage = async (_image) => {
    await timeout(1000);
    return { imageLink: "image link" };
};

/**
 * Register a user.
 *
 * @param {string} email The email address.
 * @param {string} password The password.
 * @param {Blob} image The image blob.
 */
const register = async (email, password, image) => {
    /** @type {Array<Function>} */
    const undos = [];
    try {
        // Creating a workflow with a 3 retry limit.
        Workflow.createWorkflow(3, (workflow) => {
            workflow
                .create(async (image) => {
                    let imageLink = await uploadImage(image);
                    undos.push(async () => await deleteImage(imageLink));
                    console.log(`Image uploaded to: `, imageLink);
                    return { imageLink };
                })
                // The imageLink is the output of the first step passed to this second step.
                .create(async ({ imageLink }) => {
                    console.log(`Saving user with image at: `, imageLink);
                    const user = await saveUser({
                        email,
                        password,
                        imageLink,
                    });
                    undos.push(async () => await deleteUser({ email }));
                    return user; // { id, email, password, image }
                })
                // Only need the email destructured here but we could use all properties if needed.
                .finally(async ({ email }) => {
                    await sendVerificationEmail({ email });
                    // If you are using this workflow in an API, you can respond here:
                    // res.status(200).send("User has been created successfully")
                });
        }).run(image);
    } catch (error) {
        console.error("Error in workflow.", error);
        // Undo all steps up until the failure.
        for (const undo of undos.reverse()) {
            await undo();
        }
    }
};

register("kev.boutin@gmail.com", "password", new Blob());
