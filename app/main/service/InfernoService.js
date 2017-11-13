const fetch = require('node-fetch');
const spawn = require('child_process').spawn;

class InfernoService {

    static start(serviceConfiguration) {
        const service = new InfernoService(serviceConfiguration);
        service.start();
        return service;
    }

    constructor(serviceConfiguration) {
        this.configuration = serviceConfiguration;
    }

    stop() {
        return fetch(`${this.configuration.url}/shutdown`, { method: 'POST' });
    }

    start() {

        const serverProcess = spawn('java', this.configuration.startParams);

        serverProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        serverProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        this.serverProcess = serverProcess;

    }

    async setSchemaPath(path) {

        const result = await fetch(`${this.configuration.url}/data-model`, {
            method: 'POST',
            body: JSON.stringify({ path }),
            headers: { 'Content-Type': 'application/json' }
        });

        this.configuration.schemaPath = path;

        return result;

    }

}

module.exports = (InfernoService);