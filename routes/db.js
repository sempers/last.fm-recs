var util = require('util');
var sqlite3 = require('sqlite3');

var db = new sqlite3.Database("tags.db", (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE), function(err) {
	if (err)
		console.log('FAIL on creating database ' + err);
});

db.run("CREATE TABLE IF NOT EXISTS artist (name TEXT, image TEXT, tags TEXT, playcount INTEGER, listeners INTEGER, UNIQUE (name));", function(err) {
	if (err) {
		console.log('FAIL on creating table ' + err);
	}
});

module.exports = {

    insert : function(rec) {
	    db.run("INSERT INTO artist (name, image, tags, playcount, listeners) VALUES (?,?,?,?,?);", [ rec.name, rec.image, rec.tags, rec.playcount,
	            rec.listeners ], function(err) {
		    if (err) {
			    console.log("FAIL to add " + err);
		    }
	    });
    },

    deleteAll : function(callback) {
	    db.run("DELETE FROM artist;", [], function(err) {
		    if (err) {
			    util.log("FAIL to delete all " + err);
			    callback(err);
		    } else
			    callback(null);
	    });
    },

    readAll : function(callback) {
	    db.all("SELECT * FROM artist", callback);
    },

    readOne : function(artist, callback) {
	    db.get("SELECT * FROM artist WHERE name = ?", [ artist ], function(err, row) {
		    if (!err) {
			    callback(row);
		    } else
			    callback(null);
	    });
    }
};
