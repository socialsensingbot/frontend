/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const glob = require("glob-promise")

const {initPlugin} = require('cypress-plugin-snapshots/plugin');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
    require('cypress-terminal-report/src/installLogsPrinter')(on);
    on('task', {  // a task to find one file matching the given mask
        // returns just the first matching file
        async findFiles(mask) {
            if (!mask) {
                throw new Error('Missing a file mask to search')
            }

            console.log('searching for files %s', mask)

            const list = await glob(mask);
            if (!list.length) {
                console.log('found no files')

                return null
            }

            console.log('found %d files, first one %s', list.length, list[0])

            return list[0]
        }
    });

    on('before:browser:launch', (browser) => {
        if (browser.name === 'electron') {
            return {
                width:  1920,
                height: 1080,
            }
        }
    })
    initPlugin(on, config);
    return config;
};
