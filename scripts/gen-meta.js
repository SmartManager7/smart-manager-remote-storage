const fs = require('fs');
const path = require('path');

// Resolve tools path dynamically
const localToolsPath = path.resolve(__dirname, '../node_modules/@smart-manager/tools');
const clonedToolsPath = path.resolve(__dirname, '../@smart-manager/tools');

// Check which path exists
const toolsBasePath = fs.existsSync(localToolsPath) ? localToolsPath : clonedToolsPath;

// Import utilities using the resolved tools path
const handleMultiplePromises = require(`${toolsBasePath}/scripts/handle-multiple-promises`);
const readZipArchive = require(`${toolsBasePath}/scripts/read-zip-archive`);
const generateUUIDFromWord = require(`${toolsBasePath}/scripts/uuid`);

const getPackMeta = (zipPath, zipFileName) => {
    return readZipArchive(zipPath).then(async readResult => {
        const entries = readResult.entries;
        const dataEntry = entries.find(entry => entry.fileName === 'data.json');
        if (dataEntry) {
            let groupsInfo, itemsInfo;
            let { groupsData, itemsData, id, version, remoteBaseUrl, remotePath } = JSON.parse((dataEntry.buffer || (await dataEntry.readFile())).toString());

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

                return {groupsInfo, itemsInfo, remoteBaseUrl, remotePath, id: id || generateUUIDFromWord(zipFileName), version };
            }
            return null;
        }
    });
}

const generateContentMeta = (type) => {
    const META_FILE_PATH = `packs/${type}/meta.json`;
    const PACKS_PATH = `packs/${type}`;
    if (fs.existsSync(PACKS_PATH)) {
        fs.readdir(PACKS_PATH,  async (err, files) => {
            if (err) {
                reject('Unable to scan directory: ' + err);
                return console.log('Unable to scan directory: ' + err);
            }
            const res = (await handleMultiplePromises(files.filter(file => file.endsWith('.zip')), file => getPackMeta(path.join(PACKS_PATH, file), file))).filter(Boolean);
            fs.writeFileSync(META_FILE_PATH, JSON.stringify(res, null, 4), { encoding: 'utf-8' });
        });
    }
}

generateContentMeta('tags');
generateContentMeta('meta-options');
generateContentMeta('labels');
generateContentMeta('data-buckets');
generateContentMeta('extensions');
