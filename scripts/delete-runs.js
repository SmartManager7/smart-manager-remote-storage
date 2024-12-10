const axios = require('axios');

const owner = 'SmartManager7';
const repo = 'smart-manager-remote-storage';
const token = 'token';

const api = axios.create({
    baseURL: `https://api.github.com/repos/${owner}/${repo}/actions/runs`,
    headers: { Authorization: `token ${token}` },
});

async function deleteWorkflowRuns() {
    try {
        const { data } = await api.get();
        const runIds = data.workflow_runs.map(run => run.id);

        for (const id of runIds) {
            console.log(`Deleting run ID: ${id}`);
            await api.delete(`/${id}`);
        }
        console.log('All workflow runs deleted!');
    } catch (error) {
        console.error(error);
    }
}

deleteWorkflowRuns();
