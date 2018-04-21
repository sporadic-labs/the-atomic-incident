const noop = () => {};
const LOG_LEVEL = {
  ALL: 3,
  WARN: 2,
  ERROR: 1,
  OFF: 0
};

class Logger {
  constructor(logLevel = LOG_LEVEL.ALL) {
    this.logLevel = logLevel;
  }

  setLevel(logLevel) {
    this.logLevel = logLevel;
  }

  getLevel() {
    return this.logLevel;
  }

  get error() {
    return this.logLevel >= LOG_LEVEL.ERROR ? console.error : noop;
  }

  get warn() {
    return this.logLevel >= LOG_LEVEL.WARN ? console.warn : noop;
  }

  get log() {
    return this.logLevel >= LOG_LEVEL.ALL ? console.log : noop;
  }
}

const globalLogger = new Logger();

export { globalLogger as default, LOG_LEVEL, Logger };
