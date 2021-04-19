const crypto = require( 'crypto' );
const fs = require( 'fs-extra' );
const path = require( 'path' );

const visit = require( 'unist-util-visit' );
const { execSync } = require( 'child_process' );
const mmdc = require.resolve( '@mermaid-js/mermaid-cli/index.bundle.js' );

const PLUGIN_NAME = 'remark-mermaid-alt';

async function generateSVG( value, file, options ) {
	const { destination = './images', mermaidArgs = {} } = options;

	// Unique paths.
	const unique = crypto
		.createHmac( 'sha1', PLUGIN_NAME )
		.update( value )
		.digest( 'hex' );
	const inputFile = `${ unique }.mmd`;
	const mmdPath = path.join( destination, inputFile );
	const outputFile = `${ unique }.svg`;
	const svgPath = path.join( destination, outputFile );

	// Args for CLI.
	mermaidArgs.input = mmdPath;
	mermaidArgs.output = svgPath;
	const args = []
		.concat(
			...Object.keys( mermaidArgs ).map( ( k ) => [
				`--${ k }`,
				mermaidArgs[ k ],
			] )
		)
		.join( ' ' );

	// Write temp file.
	fs.outputFileSync( mmdPath, value, { encoding: 'utf8' } );

	// Execute mermaid.
	execSync( `${ mmdc } ${ args }` );

	// Clean up.
	fs.removeSync( mmdPath );

	return `${ outputFile }`;
}

async function transformMermaidNode( node, file, index, parent, options ) {
	const { lang, value, position } = node;

	try {
		const { linkRoot = './' } = options;
		const svgFile = await generateSVG( value, file, options );
		const message = `${ lang } code block replaced with rendered mermaid SVG`;
		file.info( message, position, PLUGIN_NAME );

		const newNode = {
			type: 'image',
			title: '`mermaid` image',
			url: `${ linkRoot }${ svgFile }`,
		};
		parent.children.splice( index, 1, newNode );
	} catch ( error ) {
		file.fail( error, position, PLUGIN_NAME );
	}

	return node;
}

/**
 * Remark plugin that converts mermaid codeblocks into SVG files.
 *
 * @param {Object} options
 */
function mermaid( options = {} ) {
	/**
	 * Look for all code nodes that have the language mermaid,
	 * generate SVGs and update the url.
	 *
	 * @param {Node} ast The Markdown Tree
	 * @param {Object} file The virtual file.
	 * @return {Promise<void>} The altered tree.
	 */
	return async function ( ast, file ) {
		const promises = []; // keep track of promises since visit isn't async
		visit( ast, 'code', ( node, index, parent ) => {
			// If this codeblock is not mermaid, bail.
			if ( node.lang !== 'mermaid' ) {
				return node;
			}
			promises.push(
				transformMermaidNode( node, file, index, parent, options )
			);
		} );
		await Promise.all( promises );
	};
}

module.exports = mermaid;