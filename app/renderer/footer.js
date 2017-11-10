(function() {

    const runningMessage = 'Inferno Service is running.';
    const {ipcRenderer} = require('electron');
    const indicatorIcon = document.querySelector('footer .service-running-indicator');
    const indicatorText = document.querySelector('footer .service-running-indicator-text');

    indicatorText.innerText = 'Attempting to reach Inferno Service.';
    const intervalId = setInterval(() => {
        fetch('http://localhost:8080/health')
            .then(response => {
                if (response.status) {
                    clearInterval(intervalId);
                    indicatorIcon.classList.add('running');
                    indicatorText.innerText = runningMessage;
                    return response.json();
                }
            }).then(console.log);
    }, 5000);

    ipcRenderer.on('setSchemaPath.start', (event, path) => {
        indicatorText.innerText = `${runningMessage}. Attempting to set schema path too ${path}.`;
    });

    ipcRenderer.on('setSchemaPath.failure', (event, {path, reason}) => {
        indicatorText.innerText = `${runningMessage}. Failed to set schema path too ${path}. ${reason}.`;
    });

    ipcRenderer.on('setSchemaPath.success',(event, {path}) => {
        indicatorText.innerText = `${runningMessage}. Using schema at ${path}.`
    });

})();