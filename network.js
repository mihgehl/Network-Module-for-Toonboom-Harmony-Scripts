/**
 * @file Networking Library for Toonboom Harmony
 * @version 23.5.30
 * @copyright mihgehl < github.com/mihgehl >
 * @author mihgehl < github.com/mihgehl >
 * @license
 * Copyright 2023 Miguel Brito
 * The current script (the "Script") is the exclusive property of Miguel Brito and is protected by copyright laws and international treaty provisions. The Script is licensed, not sold.
 * Subject to the terms and conditions of this license, Miguel Brito grants to the purchaser of the Script (the "Licensee") a non-exclusive, non-transferable license to use the Script for the Licensee's own internal business or personal purposes. Any use of the Script beyond the scope of this license is strictly prohibited.
 * The Licensee is not allowed to copy, modify, distribute, sell, transfer, sublicense, or reverse engineer the Script without the prior written consent of Miguel Brito.
 * The Script is provided "as is" without warranty of any kind, either expressed or implied, including, but not limited to, the implied warranties of merchantability and fitness for a particular purpose. In no event shall Miguel Brito be liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with the use or inability to use the Script.
 * This license is effective until terminated. This license will terminate automatically without notice from Miguel Brito if the Licensee fails to comply with any provision of this license. Upon termination, the Licensee must immediately cease all use of the Script.
 * This license shall be governed by and construed in accordance with the laws of Ecuador. Any disputes arising under or in connection with this license shall be resolved by the courts located in Ecuador.
 * By using the Script, the Licensee agrees to be bound by the terms and conditions of this license. If the Licensee does not agree to these terms, they must not use the Script.
 */

function Connection() {
    this.timeout = 50000; // 50 seconds timeout

    this.curlPath = this.bin.split("/").slice(0, -1).join("\\"); // Curl binary full path
    this.curlBin = this.bin.split("/").pop(); // Curl binary file (without path)

    this.process = new QProcess();
    // this.process.setWorkingDirectory(this.curlPath); // Set process working directory to curl folder
    // this.process.waitForFinished(this.timeout);

    this.command = [];

    if (this.curlPath.indexOf("bin_3rdParty") !== -1) {
        this.command = ["--insecure"].concat(this.command);
    }
}

Connection.prototype.get = function (url) {
    this.process.start(this.bin, ["-L", url].concat(this.command));
    this.process.waitForFinished(this.timeout);
    var result = new QTextStream(this.process.readAllStandardOutput()).readAll();
    return JSON.parse(result);
};

Connection.prototype.asyncGet = function (context, url, callbackFunction) {
    this.process.start(this.bin, ["-L", url].concat(this.command));
    this.process["finished(int)"].connect(this, function (code) {
        var stdout = this.process.readAllStandardOutput();
        callbackFunction.call(context, JSON.parse(stdout));
    });
};

Connection.prototype.download = function (url, destinationPath) {
    var file = new QFile(destinationPath);
    if (file.exists) file.remove();

    this.process.start(this.bin, ["-L", "-o", destinationPath, url].concat(this.command));
    this.process.waitForFinished(this.timeout);
    if (file.exists) {
        return file;
    } else {
        throw new Error("File download Failed");
    }
};

Connection.prototype.asyncDownload = function (context, url, destinationPath, onFinishFunction) {
    try {
        var file = new QFile(destinationPath);
        if (file.exists) file.remove();

        this.process.start(this.bin, ["-L", "-o", destinationPath, url].concat(this.command));

        // this.process.readyRead.connect(this, function (something) {
        //     try {
        //         MessageLog.trace("Something: " + something);
        //     } catch (error) {
        //         MessageLog.trace(error);
        //     }
        // });

        // this.process.readyReadStandardOutput.connect(this, function () {
        //     try {
        //         MessageLog.trace(new QTextStream(this.process.readAllStandardOutput()).readAll());
        //     } catch (error) {
        //         MessageLog.trace(error);
        //     }
        // });

        this.process["finished(int)"].connect(this, function (code) {
            if (file.exists) {
                onFinishFunction.call(context, file);
            } else {
                throw new Error("File download Failed");
            }
        });
    } catch (error) {
        MessageLog.trace(error);
    }
};

Object.defineProperty(Connection.prototype, "bin", {
    get: function () {
        if (typeof Connection.__proto__.bin === "undefined") {
            if (about.isWindowsArch()) {
                var curls = [
                    specialFolders.bin + "/bin_3rdParty/curl.exe",
                    System.getenv("ProgramFiles") + "/Git/mingw64/bin/curl.exe",
                    System.getenv("windir") + "/system32/curl.exe",
                ];
            } else {
                var curls = ["/usr/bin/curl", "/usr/local/bin/curl", specialFolders.bin + "/bin_3rdParty/curl"];
            }

            for (var curl in curls) {
                if (new File(curls[curl]).exists) {
                    Connection.__proto__.bin = curls[curl];
                    return curls[curl];
                }
            }

            throw new Error("Please Install CURL");
        } else {
            return Connection.__proto__.bin;
        }
    },
});

exports.Connection = Connection;
