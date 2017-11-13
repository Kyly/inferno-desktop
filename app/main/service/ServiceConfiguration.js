const {isUndefined, create, map, get} = require('lodash');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const SERVER_PATH = 'target/inferno-service';
const CONFIG_PATH = 'config/application.yml';
const DEFAULT_SCHEMA_PATH = 'config/SAMPLE-Return1040.xsd';
const SERVER_EXECUTABLE = 'inferno-service.jar';
const HOST = 'localhost';
const PORT = 8080;

const readYmlConfig = configPath => new Promise((accept, reject) => {
    fs.readFile(configPath, 'utf8', (error, contents) => {

        if ( error ) {
            reject(error);
            return;
        }

        accept(contents);

    });
});

class ServiceConfiguration {

    static async create({isDev, settings}) {

        // Resolve path to server
        const pathToService = path
            .normalize(`${isDev ? `${__dirname}/../../../` : process.resourcesPath}/${SERVER_PATH}`);
        const configPath = `${pathToService}/${CONFIG_PATH}`;

        // Read config
        const ymlConfig = await readYmlConfig(configPath);
        const serverDefaults = yaml.safeLoad(ymlConfig);

        // Get defaults
        const serverPort = get(serverDefaults, 'server.port', PORT);
        const defaultSchemaPath =
            `${pathToService}/${get(serverDefaults, 'schema.path', DEFAULT_SCHEMA_PATH)}`;

        // Resolve schema path with local settings
        let schemaPath = settings.get('schema.path');
        if (isUndefined(schemaPath)) {
            schemaPath = defaultSchemaPath;
            settings.set('schema.path', schemaPath);
        }

        return create(ServiceConfiguration.prototype, {
            server: {
                type: '-jar',
                directory: pathToService,
                path: path.normalize(`${pathToService}/${SERVER_EXECUTABLE}`),
                port: serverPort,
                host: HOST
            },
            params: {
                configuration: {
                    path: configPath,
                    param: '--spring.config.location'
                },
                schema: {
                    path: schemaPath,
                    param: '--schema.path'
                }
            }
        });

    }

    buildParams() {
        return map(this.params, ({path, param}) => {
            return `${param}=${path}`;
        });
    }

    serverParams() {
        return [
            this.server.type,
            this.server.path,
        ];
    }

    get url() {
        return `http://${this.server.host}:${this.server.port}`;
    }

    get startParams() {
        return [
            ...this.serverParams(),
            ...this.buildParams()
        ];
    }

    get schemaPath() {
        return this.params.schema.path;
    }

    set schemaPath(path) {
        this.params.schema.path = path;
    }

}

module.exports = (ServiceConfiguration);