const fs = require('fs');
const path = require('path');
const handleMultiplePromises = require('@smart-manager/tools/scripts/handle-multiple-promises');
const readZipArchive = require('@smart-manager/tools/scripts/read-zip-archive');
const generateUUIDFromWord = require('@smart-manager/tools/scripts/uuid');

const GIT_REPO_URL = 'https://api.github.com/repos/SmartManager7/smart-manager-remote-storage';

const getPackMeta = (zip, zipFileName) => {
    return readZipArchive(zip).then(async readResult => {
        const entries = readResult.entries;
        const dataEntry = entries.find(entry => entry.fileName === 'data.json');
        if (dataEntry) {
            let groupsInfo, itemsInfo;
            let { groupsData, itemsData, uuid, version } = JSON.parse((dataEntry.buffer || (await dataEntry.readFile())).toString());

            if (itemsData) {
                groupsInfo = groupsData ? groupsData.map(group => ({
                    id: group.id,
                    name: group.name
                })) : [];
                itemsInfo = itemsData.map(mo => ({
                    id: mo.id,
                    group: mo.group,
                    name: mo.name,
                }));

                return {groupsInfo, itemsInfo, url: GIT_REPO_URL + PACKS_PATH + '/' + zipFileName, uuid: uuid || generateUUIDFromWord(zipFileName), version };
            }
            return null;
        }
    });
}

const rebuildContentMeta = (type) => {
    const META_FILE_PATH = `packs/${type}/meta.json`;
    const PACKS_PATH = `packs/${type}`;
    fs.readdir(PACKS_PATH,  async (err, files) => {
        if (err) {
            reject('Unable to scan directory: ' + err);
            return console.log('Unable to scan directory: ' + err);
        }
        const res = (await handleMultiplePromises(files.filter(file => file.endsWith('.zip')), file => getPackMeta(path.join(PACKS_PATH, file), file))).filter(Boolean);
        fs.writeFileSync(META_FILE_PATH, JSON.stringify(res, null, 4), { encoding: 'utf-8' });
    });
}

rebuildContentMeta('meta-options');
