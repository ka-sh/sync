/*Validate sync configurations.
 */
var validate = module.exports = function(config) {
  validateConfig(config);
}

/**
 * Validate configuration provided to the sync Module.
 *This is how it should be working.
 */
function validateConfig(configs) {
  return configs && configs.jsftp && configs.sync && validateFTPConfig(configs.jsftp) &&
    validateSyncConfig(configs.sync);
}
/**
 * Provided FTP configuration provided to jsftp.
 */
function validateFTPConfig(jsftpConfig) {
return jsftpConfig.host&&jsftpConfig.port;
}
/**
 * Validate configurations provided to Sync module.
 */
function validateSyncConfig(synConfig) {
return synConfig.local&&synConfig.remote;
}
