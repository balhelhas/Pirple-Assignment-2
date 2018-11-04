/*
*   Pizza-Delevery API
*   Assignment: 2
*   Author: Guilherme Ramalho
*   Date: 15-10-2018
*/

// Dependencies
const server = require('./lib/server');

// Declaring App
const app = {};

// Init
app.init = () => {
    // Start the server
    server.init();
}

// Execute
app.init();

// Export the app
module.exports = app;