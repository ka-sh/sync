'use strict';
// var validator = require("./validator");
var jsFtp = require("jsftp");
var fs = require("fs");
var Q = require("q");
var util = require("util");
var async = require("async");

var ftp;

/**
 * Sync library helps sync local and remote folder on remote ftp.
 *@param config JSON configurations.
 * {
 *  direciton:[upload,download],
 *  remote-host:hostIP
 * }
 */

var SyncFTP = module.exports = function(configs) {
  if (!validateConfig) {
    throw new Error("Invalid configurations. ", configs);
  }
  //TODO:Extract jsftp configurations
  //TODO:Extract SYNC configrurations
  initFtp(configs);
};

function validateConfig(configs) {
  return configs && configs.host && configs.port;
}
/**
 * {
 *  host: "myserver.com",
 *  port: 3331, // defaults to 21
 *  user: "user", // defaults to "anonymous"
 *  pass: "1234" // defaults to "@anonymous"
 * }
 **/

function initFtp(configs) {
  ftp = new jsFtp(configs);
  /**
   * Setting up the jsftp debug configurations.
   */
  ftp.on('jsftp_debug', function(eventType, data) {
    console.log('DEBUG: ', eventType);
    console.log(JSON.stringify(data, null, 2));
  });
}
/**
 * Sync local folder with remote folder through FTP.
 * Note:recursive sync is not supported for now.
 */
SyncFTP.prototype.sync = function(local, remote) {
  local = normalizePath(local);
  remote = normalizePath(remote);
  return getRemoteFiles(remote)
    .then(function(remoteFiles) {
      // var toDownload = getListOfFilesToDownload(local, remoteFiles);
      var toDownload = ["ASX-Corporate20151203.csv",
        "ASX-Corporate20151203.ric.csv",
        "ListingsHKG20151103174203.csv.notes.txt"
      ];
      return toDownload;
    })
    .then(function(toDownload) {
      return downloadFiles(toDownload, remote, local);
    })
    .then(function(toRemove) {
      return removeList(toRemove);
    });
};
/**
 * Normalize path by adding / at the end if it doesn't exist.
 */
function normalizePath(path) {
  if (!path.endsWith("/") && !path.endsWith("\\")) {
    return path + "/";
  }
  return path;
}


/**
 * Return list of files on the remote directory.
 *@param remote remote directory.
 *@return list of file object on the remote host, file object contain file information such as (name, permissions, size,creation date).
 */
function getRemoteFiles(remote) {
  var deferred = Q.defer();
  ftp.ls(remote, function(err, res) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(res);
    }
  });
  return deferred.promise;
}

/**
 * Return list of files on local directory.
 * @param local destination.
 * @return list of file on the local destination.
 */
function getLocalFiles(local) {
  return fs.readdirSync(local);
}
/**
 * Compare between the list of files on local and remote,
 * and return list of missing files on the local to be downloaded from remote.
 *@param desintation where the file will be downloaded to .
 *@param remoteFiles list of files on the remote host.
 *@return list of file names on the remote host to be downloaded.
 */
function getListOfFilesToDownload(destination, remoteFiles) {
  var filesToDownload = [];
  for (var rfi in remoteFiles) {
    if (!fileExistLocaly(destination + remoteFiles[rfi].name, remoteFiles[rfi])) {
      filesToDownload = filesToDownload.concat(remoteFiles[rfi].name);
    }
  }
  return filesToDownload;
}
/**
 * Check if the file exist on local or not, if not will return false.
 * also it deals with the case where file is found but with size 0B.
 *NOTE: this method will return false if this is a folder, currently recursive sync is not supported yet.
 *@param path path of the file on local.
 *@param remoteFile is an object hold the remote file stats (size,permissions...).
 *@return boolean indicate wither file exist on local or not.
 */
function fileExistLocaly(path, remoteFile) {
  try {
    var stats = fs.statSync(path);
    /**
     * Dealing with the case of having empty file.
     */
    if (stats.size === 0) {
      console.log("Warning Empty file with size 0 found on local: " +
        path);
      return remoteFile.size === 0 && stats.isFile();
    }
    return stats.isFile();
  } catch (err) {
    return false;
  }
}
/**
 * Download list of files from remote to local .
 *@param list list of file names to be downloaded.
 *@param remote remote root path.
 *@param destination where the files will be downloaded to.
 *@return combined Q promise.
 */
function downloadFiles(list, remote, destination) {
  var deferred = Q.defer();
  var downloaded = [];
  async.eachSeries(list, function iterator(item, cb) {
    download(remote + item, destination + item, cb, downloaded);
  }, function done() {
    deferred.resolve(downloaded);
  });
  return deferred.promise;

}


/**
 * Download single file and return Q promise.
 *@param file file to download.
 *@param desintaion path to Download the file to.
 *@return Q promise.
 */
function download(file, destination, cb, downloaded) {
  ftp.get(file, destination, function(err) {
    console.log("Downloading " + file);
    if (err) {
      console.log("==>>Error", err);
      cb();
    } else {
      downloaded.push(file);
      console.log(file + " Downloaded successfully.");
      cb();
    }
  });
}
/**
 * Remove list of successfully downloaed files from remote FTP.
 * @param files list of files to remove from remote FTP.
 * @return promise object indicating the success of failure of the ENTIRE
 * remove process.
 */
function removeList(files) {
  var deferred = Q.defer();
  async.eachSeries(files, function iterator(file, cb) {
    removeFile(file, cb, deferred);
  }, function done() {
    deferred.resolve(files);
  });
  return deferred.promise;
}

/**
 * Remove single file from remote FTP.
 *
 */
function removeFile(file, cb) {
  ftp.raw.dele(file, function(err, data) {
    if (err) {
      console.log("Remove==>>Error", err);
      cb();
    } else {
      console.log("Removed " + file);
      cb();
    }
  });
}
