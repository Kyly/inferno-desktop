const spawn = require('child_process').spawn;
const path = require('path');
const settings = require('electron-settings');
const {isUndefined} = require('lodash');
const pathToService = path.normalize(`${process.resourcesPath}/sources/inferno-service/`);
const configParam = `--spring.config.location=classpath:/application.yml,${pathToService}/config/application.yml`;
const schemaConfigurableParam = `--schema.configurable=true`;
const defaultSchemaPath = `${pathToService}/config/SAMPLE-Return1040.xsd`;
const defaultParams = [
    '-jar',
    path.normalize(`${pathToService}/inferno-service.jar`),
    configParam,
    schemaConfigurableParam
];

function startService(...opts) {

    // const remote = require('electron').remote;
    // const appPath = remote.app.getAppPath();
    // console.log('appPath: ', appPath);

    let schemaPath = settings.get('schema.path') || defaultSchemaPath;

    if (isUndefined(schemaPath)) {
        schemaPath = defaultSchemaPath;
        settings.set('schema.path', schemaPath);
    }

    const schemaPathParam = `--schema.path=${schemaPath}`;
    const params = [...defaultParams, schemaPathParam, ...opts];

    return () => {

        const service = spawn('java', params);

        service.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        service.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        service.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });


        return service;

    };

}

module.exports = startService;