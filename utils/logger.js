const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        console.log(logMessage);
        
        // Write to log file
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logMessage + '\n');
    }

    info(message) {
        this.log('info', message);
    }

    warn(message) {
        this.log('warn', message);
    }

    error(message) {
        this.log('error', message);
    }

    debug(message) {
        this.log('debug', message);
    }
}

module.exports = new Logger();