import denodify from "utils/node/denodify";
import {
	stat,
	isFile
} from "utils/node/fs/stat";
import PATH from "path";
import FS from "fs";


const fsReaddir = denodify( FS.readdir );
const fsUnlink  = denodify( FS.unlink );


/**
 * @param {String[]} list
 * @param {Function} fn
 * @returns {Promise}
 */
function execBatchAndIgnoreRejected( list, fn ) {
	// additional fn arguments
	var args = [].slice.call( arguments, 2 );

	// wait for all promises to resolve
	return Promise.all( list.map(function( elem ) {
		// do something with a list element
		return fn( elem, ...args )
			// always resolve
			.catch(function() { return null; });
	}) )
		// filter out elems that "didn't resolve"
		.then(function( list ) {
			return list.filter(function( elem ) {
				return elem !== null;
			});
		});
}


/**
 * Delete files in a directory optionally filtered by age
 * @param {String} dir
 * @param {Number?} threshold
 * @returns {Promise}
 */
function clearfolder( dir, threshold ) {
	return fsReaddir( dir )
		.then(function( files ) {
			// prepend dir path
			files = files.map(function( file ) {
				return PATH.join( dir, file );
			});

			// just return all files if there is no threshold set
			if ( !threshold ) { return files; }

			// ignore all files newer than X
			var now = new Date();
			return execBatchAndIgnoreRejected( files, stat, function( stat ) {
				return isFile( stat )
				    && now - stat.mtime > threshold;
			});
		})
		// delete all matched files
		.then(function( files ) {
			return execBatchAndIgnoreRejected( files, fsUnlink );
		});
}


export default clearfolder;
