(function () {

    const {ipcRenderer} = require('electron');
    const $modal = jQuery('.change-schema-location-modal');
    const form = document.getElementById("schemaPathForm");

    form.addEventListener('submit', (event) => {

        event.preventDefault();

        $modal.modal('hide');

        const { target } = event;
        const data = new FormData(target);
        const path = data.get('path');

        ipcRenderer.send('setSchemaPath', { path });

    });

})();