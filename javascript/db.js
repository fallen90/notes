// Generated by CoffeeScript 1.6.3
(function() {
  var fs, noteddb, path;

  fs = require('fs');

  path = require('path');

  noteddb = (function() {
    function noteddb(notebookdir, client, queue, cursor) {
      this.notebookdir = notebookdir;
      this.client = client;
      this.queue = queue;
      this.cursor = cursor;
      if (this.queue == null) {
        this.queue = false;
      }
      if (this.client == null) {
        this.client = false;
      }
      if (this.cursor == null) {
        this.cursor = false;
      }
      this.queueArr = JSON.parse(window.localStorage.getItem(this.queue));
    }

    noteddb.prototype.generateUid = function() {
      var s4;
      s4 = function() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      };
      return (s4() + s4() + s4() + s4()).toLowerCase();
    };

    /*
    	# Finds the filename of a particular note id
    	# @param {String} id The note you're searching for
    	# @return {String} filename The found filename
    */


    noteddb.prototype.filenameNote = function(id) {
      var files, i;
      files = fs.readdirSync(this.notebookdir);
      i = 0;
      while (i >= 0) {
        if (files[i] === void 0 || files[i].match("." + id + ".note")) {
          return files[i];
        }
        i++;
      }
    };

    /*
    	# Creates a new notebook
    	# @param {String} name The notebook name
    	# @return {String} id The new notebook id
    */


    noteddb.prototype.createNotebook = function(name) {
      var data, filename, id;
      id = this.generateUid();
      while (fs.existsSync(path.join(this.notebookdir, id + ".list"))) {
        id = this.generateUid();
      }
      filename = id + ".list";
      data = {
        id: id,
        name: name
      };
      fs.writeFileSync(path.join(this.notebookdir, filename), JSON.stringify(data));
      this.addToQueue({
        "operation": "create",
        "file": filename
      });
      return id;
    };

    /*
    	# Creates a new note
    	# @param {String} name The new note name
    	# @param {String} notebook The id of the notebook
    	# @param {String} content The note content
    	# @return {String} id The new note id
    */


    noteddb.prototype.createNote = function(name, notebook, content) {
      var data, filename, id;
      id = this.generateUid();
      while (fs.existsSync(path.join(this.notebookdir, notebook + "." + id + ".note"))) {
        id = this.generateUid();
      }
      filename = notebook + "." + id + ".note";
      data = {
        id: id,
        name: name,
        notebook: notebook,
        content: content,
        date: Math.round(new Date() / 1000)
      };
      fs.writeFileSync(path.join(this.notebookdir, filename), JSON.stringify(data));
      this.addToQueue({
        "operation": "create",
        "file": filename
      });
      return id;
    };

    /*
    	# List notebooks
    	# @param {Boolean} [names=false] Whether to return names of notebook
    	# @return {Array} notebooks List of Notebooks
    */


    noteddb.prototype.readNotebooks = function(names) {
      var files, notebooks,
        _this = this;
      files = fs.readdirSync(this.notebookdir);
      notebooks = [];
      files.forEach(function(file) {
        if (file.substr(16, 5) === ".list") {
          if (names) {
            return notebooks.push({
              id: file.substr(0, 16),
              name: JSON.parse(fs.readFileSync(path.join(_this.notebookdir, file))).name
            });
          } else {
            return notebooks.push(file.substr(0, 16));
          }
        }
      });
      if (names) {
        notebooks.sort(function(a, b) {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });
      }
      return notebooks;
    };

    /*
    	# Read a notebook
    	# @param {String} id The notebook id
    	# @param {Boolean} [names=false] Whether to return names and excerpts of notes
    	# @return {Object} notebook Notebook metadata with list of notes
    */


    noteddb.prototype.readNotebook = function(id, names) {
      var files, notebook,
        _this = this;
      if (id === "all") {
        notebook = {
          name: "All Notes",
          id: "all"
        };
      } else {
        notebook = JSON.parse(fs.readFileSync(path.join(this.notebookdir, id + ".list")));
      }
      notebook.contents = [];
      files = fs.readdirSync(this.notebookdir);
      files.forEach(function(file) {
        var contents, e, filename;
        if (file.match(id) && file.substr(33, 5) === ".note" || id === "all" && file.substr(33, 5) === ".note") {
          filename = file.substr(17, 16);
          if (names) {
            try {
              contents = JSON.parse(fs.readFileSync(path.join(_this.notebookdir, file)));
              return notebook.contents.push({
                id: filename,
                name: contents.name,
                info: contents.content.substring(0, 100),
                date: parseInt(contents.date)
              });
            } catch (_error) {
              e = _error;
            }
          } else {
            return notebook.contents.push(filename);
          }
        }
      });
      if (names) {
        notebook.contents.sort(function(a, b) {
          if (a.date < b.date) {
            return -1;
          }
          if (a.date > b.date) {
            return 1;
          }
          return 0;
        });
      }
      return notebook;
    };

    /*
    	# Read a note
    	# @param {String} id The note id
    	# @return {Object} note Note metadata with content
    */


    noteddb.prototype.readNote = function(id) {
      var e, note;
      note = fs.readFileSync(path.join(this.notebookdir, this.filenameNote(id)));
      try {
        return JSON.parse(note.toString());
      } catch (_error) {
        e = _error;
        return "error in file.";
      }
    };

    /*
    	# Update Notebook Metadata
    	# @param {String} id The notebook id
    	# @param {Object} data The new notebook data
    	# @return {Object} data The updated notebook data
    */


    noteddb.prototype.updateNotebook = function(id, data) {
      var filename;
      data.id = id;
      filename = id + ".list";
      fs.writeFileSync(path.join(this.notebookdir, filename), JSON.stringify(data));
      this.addToQueue({
        "operation": "update",
        "file": filename
      });
      return data;
    };

    /*
    	# Update Note Data
    	# @param {String} id The note id
    	# @param {Object} data The new note data
    	# @return {Object} data The updated note data
    */


    noteddb.prototype.updateNote = function(id, data) {
      var filename;
      data.id = id;
      data.date = Math.round(new Date() / 1000);
      filename = data.notebook + "." + id + ".note";
      if (data.notebook !== this.readNote(id).notebook) {
        this.addToQueue({
          "operation": "remove",
          "file": this.filenameNote(id)
        });
        fs.renameSync(path.join(this.notebookdir, this.filenameNote(id)), path.join(this.notebookdir, data.notebook + "." + id + ".note"));
        this.addToQueue({
          "operation": "create",
          "file": filename
        });
      } else {
        this.addToQueue({
          "operation": "update",
          "file": filename
        });
      }
      fs.writeFileSync(path.join(this.notebookdir, filename), JSON.stringify(data));
      return data;
    };

    /*
    	# Search Notes
    	# @param {String} query The search query
    	# @return {Object} results The results of the query
    */


    noteddb.prototype.search = function(query) {
      var files, results,
        _this = this;
      results = [];
      files = fs.readdirSync(this.notebookdir);
      files.forEach(function(file) {
        var id, notedata;
        id = file.substr(17, 16);
        if (id !== "list") {
          notedata = _this.readNote(file.substr(17, 16));
          if (notedata.name.match(new RegExp(query, 'i')) || notedata.content.match(new RegExp(query, 'i'))) {
            return results.push(notedata);
          }
        }
      });
      return results;
    };

    /*
    	# Deletes a notebook
    	# @param {String} id The notebook id
    */


    noteddb.prototype.deleteNotebook = function(id) {
      var filename,
        _this = this;
      this.readNotebook(id).contents.forEach(function(file) {
        var filename;
        filename = id + "." + file + ".note";
        fs.unlink(path.join(_this.notebookdir, filename));
        return _this.addToQueue({
          "operation": "remove",
          "file": filename
        });
      });
      filename = id + ".list";
      fs.unlinkSync(path.join(this.notebookdir, filename));
      return this.addToQueue({
        "operation": "remove",
        "file": filename
      });
    };

    /*
    	# Deletes a note
    	# @param {String} id The note id
    */


    noteddb.prototype.deleteNote = function(id) {
      var filename;
      filename = this.filenameNote(id);
      fs.unlink(path.join(this.notebookdir, filename));
      return this.addToQueue({
        "operation": "remove",
        "file": filename
      });
    };

    noteddb.prototype.addToQueue = function(obj) {
      this.queueArr[obj.file] = obj;
      return window.localStorage.setItem(this.queue, JSON.stringify(this.queueArr));
    };

    /*
    	# Run when user first connects to Dropbox
    */


    noteddb.prototype.firstSync = function(callback) {
      return this.syncDelta(function(err) {
        var files, opcount,
          _this = this;
        if (err && callback) {
          callback(err);
        }
        files = fs.readdirSync(this.notebookdir);
        opcount = 0 - files.length;
        if (files.length === 0) {
          if (callback) {
            callback();
          }
        }
        files.forEach(function(file) {
          var data;
          data = fs.readFileSync(path.join(_this.notebookdir, file));
          return _this.client.writeFile(file, data.toString(), function(err, stat) {
            console.log(stat);
            opcount++;
            if (opcount === 0) {
              if (callback) {
                return callback();
              }
            }
          });
        });
        return window.localStorage.setItem("queue", "{}");
      });
    };

    /*
    	# Sync the current queue with Dropbox
    */


    noteddb.prototype.syncQueue = function(callback) {
      return this.syncDelta(function(err) {
        var file, filecallback, op, opcount,
          _this = this;
        if (err && callback) {
          callback(err);
        }
        opcount = 0 - Object.keys(this.queueArr).length;
        filecallback = function(err, stat) {
          opcount++;
          if (opcount === 0) {
            _this.client.delta(_this.cursor, function(err, data) {
              _this.cursor = data.cursorTag;
              window.localStorage.setItem("cursor", data.cursorTag);
              window.localStorage.setItem("queue", "{}");
              if (callback) {
                return callback();
              }
            });
          }
          if (err) {
            console.warn(err);
          }
          return delete _this.queueArr[file];
        };
        for (file in this.queueArr) {
          op = this.queueArr[file].operation;
          if (op === "create" || op === "update") {
            this.client.writeFile(file, fs.readFileSync(path.join(this.notebookdir, file)).toString(), filecallback);
          } else {
            this.client["delete"](file, filecallback);
          }
        }
        if (Object.keys(this.queueArr).length === 0) {
          console.log("nothing to sync");
          window.localStorage.setItem("queue", "{}");
          if (callback) {
            return callback();
          }
        }
      });
    };

    noteddb.prototype.syncDelta = function(callback) {
      var _this = this;
      this.callback = callback;
      return this.client.delta(this.cursor, function(err, data) {
        if (err) {
          return _this.callback(err);
        }
        console.log(data);
        data.changes.forEach(function(file) {
          console.log(file);
          if (file.wasRemoved) {
            return fs.unlink(path.join(_this.notebookdir, file.path));
          } else {
            return _this.client.readFile(file.path, null, function(err, data) {
              if (err) {
                return console.warn(err);
              }
              return fs.writeFile(path.join(_this.notebookdir, file.path), data);
            });
          }
        });
        _this.cursor = data.cursorTag;
        window.localStorage.setItem("cursor", data.cursorTag);
        if (_this.callback) {
          return _this.callback();
        }
      });
    };

    return noteddb;

  })();

  module.exports = noteddb;

}).call(this);
