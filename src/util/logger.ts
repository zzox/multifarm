export enum LogLevel {
    Debug = 0,
    Log = 1,
    Info = 2,
    Error = 3,
    None = 99,
}

let logLevel = LogLevel.Debug

export const logger = {
    debug: (message?: any, ...optionalParams: any[]) => {
        logLevel <= LogLevel.Debug && console.log(message, ...optionalParams);
    },
    log: (message?: any, ...optionalParams: any[]) => {
        logLevel <= LogLevel.Log && console.log(message, ...optionalParams);
    },
    info: (message?: any, ...optionalParams: any[]) => {
        logLevel <= LogLevel.Info && console.log(message, ...optionalParams);
    },
    error: (message?: any, ...optionalParams: any[]) => {
        logLevel <= LogLevel.Error && console.log(message, ...optionalParams);
    }
}

export const setLogLevel = (level:LogLevel) => {
    logLevel = level
}
