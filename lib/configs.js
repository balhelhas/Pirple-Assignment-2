/*
*
* Create and export configuration variables
* 
*/

//Container for enviromments
let enviroments = {};

//Staging (default) enviroment
enviroments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'secret',
    'acceptMethods': ['get','post','put','delete'],
    'stripe': {
        'pubKey': 'pk_test',
        'secKey': 'sk_test'
    },
    'mailgun': {
        'apiKey': 'api_key',
        'domain': 'sandbox.mailgun.org',
        'from': 'postmaster@sandbox.mailgun.org'
    }
};

//Production enviroment
enviroments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'secret',
    'acceptMethods': ['get','post','put','delete'],
    'stripe': {
        'pubKey': 'pk_test_zo5vB3IZikHgAFsAZYvtCDN9',
        'secKey': 'sk_test_FFGONLGxOiSEoPx0lCbNA2su'
    },
    'mailgun': {
        'apiKey': '9caf33a781854321b043232f68fd910a-c9270c97-7ffa5f5c',
        'domain': 'sandbox712ebb565561452398de83be241302f4.mailgun.org',
        'from': 'postmaster@sandbox712ebb565561452398de83be241302f4.mailgun.org'
    }
};

//Deternime wich enviroment was passed as a command-line argument
let currentEnviroment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that the current enviroment is one of the enviroments above, if not, default to staging
let enviromentToExport = typeof(enviroments[currentEnviroment]) == 'object' ? enviroments[currentEnviroment] : enviroments.staging;

//Export the module
module.exports = enviromentToExport;
