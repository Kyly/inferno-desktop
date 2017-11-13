(function() {

    const runningMessage = 'Inferno Service is running.';
    const {ipcRenderer} = require('electron');
    const indicatorContainer = document.querySelector('footer .service-running-indicator-container');
    const indicatorIcon = indicatorContainer.querySelector('.service-running-indicator');
    const indicatorText = indicatorContainer.querySelector('.service-running-indicator-text');
    const serviceInfoText = indicatorContainer.querySelector('.service-info-text');
    const $modal = jQuery('.change-schema-location-modal');
    const schemaPathInput = document.getElementById('schemaPathForm').getElementsByTagName('input');

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

    indicatorText.innerText = 'Attempting to reach Inferno Service.';
    indicatorContainer.addEventListener('click', () => {

        if(!indicatorIcon.classList.contains('running')) {
            return;
        }

        $modal.modal('show');

    });

    ipcRenderer.on('setSchemaPath.start', (event, path) => {
        serviceInfoText.innerText = `Attempting to set schema path too ${path}.`;
    });

    ipcRenderer.on('setSchemaPath.failure', (event, {path, reason}) => {
        serviceInfoText.innerText = `Failed to set schema path too ${path}. ${reason}.`;
    });

    ipcRenderer.on('setSchemaPath.success',(event, {path}) => {
        serviceInfoText.innerText = `Using schema at ${path}.`;
    });

    ipcRenderer.on('serviceInfo.schemaPath', (event, {path}) => {
        serviceInfoText.innerText = `Using schema at ${path}.`;
        schemaPathInput.value = path;
    });

})();