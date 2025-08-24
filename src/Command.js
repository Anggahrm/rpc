class Command {
    constructor(data) {
        this.data = data;
        this.name = data.name;
        this.description = data.description;
        this.options = data.options || [];
        this.category = data.category || 'general';
        this.cooldown = data.cooldown || 3;
        this.permissions = data.permissions || [];
        this.voiceChannel = data.voiceChannel || false;
    }

    async execute(interaction) {
        throw new Error(`Command ${this.name} doesn't have an execute method.`);
    }

    toJSON() {
        return this.data;
    }
}

module.exports = Command;