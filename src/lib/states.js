import * as jsonUtil from './json-util'

export default class States {

    constructor(settings) {
        this.fileManager = settings.fileManager;
        this.workingDir = settings.workingDir;

        this.statesFile = this.fileManager.joinPath(this.workingDir, "states.json");
    }

    async readJsonFromFile(fileManager, file) {       
        if (!fileManager.fileExists(file)) {
          return undefined;
        }
        
        await fileManager.downloadFileFromiCloud(file);

        return jsonUtil.loadFromFile(fileManager, file);
    }

    async readStatesFromFile(fileManager, file) {
        let contents = await this.readJsonFromFile(fileManager, file);
        
        return contents;
    }

    writeJsonToFile(fileManager, file, json) {
        jsonUtil.writeToFile(fileManager, file, json);
    }

    writeStatesToFile(fileManager, file, states) {
        this.writeJsonToFile(fileManager, file, states);
    }

    async getStates() {
        if (this.states) {
            return this.states;
        }
        this.states = await this.readStatesFromFile(this.fileManager, this.statesFile);
        return this.states
    }

    setStates(states) {
        this.states = states;
        this.writeStatesToFile(this.fileManager, this.statesFile, states);
    }

    async getStateFromProfile(profile) {
        let states = await this.getStates();
        if (!states) {
            return undefined;
        }

        let stateObj = states[profile];
        if (!stateObj) {
            return undefined;
        }

        if (new Date(stateObj.date) < new Date() - (10 * 60 * 1000)) {
            await this.removeProfileFromStates(profile);
            return undefined;
        }

        return stateObj.state;
    }

    async removeProfileFromStates(profile) {
        let states = await this.getStates();

        if (!states) {
            return;
        }

        if (!states[profile]) {
            return;
        }

        delete states[profile];

        this.setStates(states);
    }

    async setStateForProfile(profile, state) {
        let states = await this.getStates();

        if (!states) {
            states = {};
        }

        states[profile] = {
            "state": state, 
            "date": new Date()
        };

        this.setStates(states);
    }

    async getProfileFromState(state) {
        let states = await this.getStates();
        if (!states) {
            return undefined;
        }

        let profile = Object.keys(states).find(key => states[key]["state"] === state);

        if (!profile) {
            return undefined;
        }

        return profile;
    }

    generateState() {
        return UUID.string();
    }
}