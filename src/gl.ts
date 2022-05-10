namespace Engine.Gfx {

export interface VaoInfo {
	/** VAO to draw */
	vao:WebGLVertexArrayObject;
	/** Number of elements */
	count:GLsizei;
	/** GL mode to use for drawing, default to gl.TRIANGLES */
	mode:GLenum;

	/** Information available when this is an indexed VAO, undefined otherwise */
	indexInfo?:{
		indexType: WebGLRenderingContextBase["UNSIGNED_BYTE"] | WebGLRenderingContextBase["UNSIGNED_SHORT"] | WebGLRenderingContextBase["UNSIGNED_INT"];
	}

	/** Function called for drawing this VAO.
	 * @param vaoInfo - This VaoInfo object.
	*/
	drawAction:(vaoInfo:VaoInfo)=>void;
};

type bufferDataArgs = {srcData:BufferSource, usage:GLenum} | {srcData:ArrayBufferView, usage:GLenum, srcOffset:GLuint, length?:GLuint};
type vertexAttribArgs = {index:GLuint, size:GLint, type:GLenum, normalized:GLboolean, stride:GLsizei, offset:GLintptr};
type dataAttribsGroupArgs = {dataArgs:bufferDataArgs, attribsArgs:[vertexAttribArgs, ...vertexAttribArgs[]]};
type indexBufferDataType = Uint8Array|Uint16Array|Uint32Array;
type indexBufferDataArgs = {srcData:indexBufferDataType, usage:GLenum} | {srcData:indexBufferDataType, usage:GLenum, srcOffset:GLuint, length?:GLuint};

export function bindAndDrawVao(vaoInfo:VaoInfo) {
	gl.bindVertexArray(vaoInfo.vao);

	const mode = vaoInfo.mode ?? gl.TRIANGLES;

	if (!vaoInfo.indexInfo) gl.drawArrays(mode, 0, vaoInfo.count);
	else gl.drawElements(mode, vaoInfo.count, vaoInfo.indexInfo.indexType, 0);
}

function formatFromInternalformat(internalformat:GLenum):GLenum {
	switch (internalformat) {
		case gl.RGB:
		case gl.RGB8:
		case gl.SRGB8:
		case gl.RGB565:
		case gl.R11F_G11F_B10F:
		case gl.RGB9_E5:
		case gl.RGB16F:
		case gl.RGB32F:
			return gl.RGB;
		case gl.RGBA:
		case gl.RGBA8:
		case gl.SRGB8_ALPHA8:
		case gl.RGB5_A1:
		case gl.RGB10_A2:
		case gl.RGBA4:
		case gl.RGBA16F:
		case gl.RGBA32F:
			return gl.RGBA;
		case gl.LUMINANCE_ALPHA:
			return gl.LUMINANCE_ALPHA;
		case gl.LUMINANCE:
			return gl.LUMINANCE;
		case gl.ALPHA:
			return gl.ALPHA;
		case gl.R8:
		case gl.R16F:
		case gl.R32F:
			return gl.RED;
		case gl.R8UI:
			return gl.RED_INTEGER;
		case gl.RG8:
		case gl.RG16F:
		case gl.RG32F:
			return gl.RG;
		case gl.RG8UI:
			return gl.RG_INTEGER;
		case gl.RGB8UI:
			return gl.RGB_INTEGER;
		case gl.RGBA8UI:
			return gl.RGBA_INTEGER;
	}
	throw ["Unknown internalformat", internalformat];
}

type textureOptions = {
	generateMipmap?:boolean
	, magFilter?:GLenum
	, minFilter?:GLenum
	, wrapS?:GLenum
	, wrapT?:GLenum
}

export async function loadImage(src:string):Promise<HTMLImageElement> {
	const image = new Image();
	image.src = src;
	await image.decode()
	return image;
}

export async function genAndBindTexture(src:ImageBitmapSource, internalformat:GLenum, type:GLenum, options?:textureOptions):Promise<WebGLTexture> {
	const bitmapPromise = createImageBitmap(src);

	const texture = gl.createTexture();

	const bitmap = await bitmapPromise;

	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(
		gl.TEXTURE_2D
		, 0
		, internalformat
		, formatFromInternalformat(internalformat)
		, type
		, bitmap
	);

	if (options) {
		// Go through each options without using a series of if statements

		handleOptions(options, {
			generateMipmap: (o => { if (o) gl.generateMipmap(gl.TEXTURE_2D); })
			, magFilter: (o => { if (o != gl.LINEAR) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, o); })
			, minFilter: (o => { if (o != gl.NEAREST_MIPMAP_LINEAR) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, o); })
			, wrapS: (o => { if (o != gl.REPEAT) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, o); })
			, wrapT: (o => { if (o != gl.REPEAT) gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o); })
		});
	}

	return texture;
}

export async function genAndBindTextureFrom2dArrayRGB(
array2d:Array<number>
, height:number
, options?:textureOptions
) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	if (ctx === null) throw ["Unable to get 2D context"];

	const rgbaArray:number[] = [];
	for (let i = 0; i < array2d.length; ++i) {
		rgbaArray.push(array2d[i]!);
		if (i % 3 === 2) rgbaArray.push(255);
	}

	const imageData = ctx.createImageData(Math.floor(array2d.length / height / 3), height);
	imageData.data.set(rgbaArray);

	return genAndBindTexture(imageData, gl.RGBA, gl.UNSIGNED_BYTE, options);
}

export async function loadAndBindTexture(src:string, internalformat:GLenum, type:GLenum, options?:textureOptions):Promise<WebGLTexture> {
	return genAndBindTexture(await loadImage(src), internalformat, type, options);
}

/** Creates a VAO and binds it.
 * @remarks Dirties the bound ARRAY_BUFFER and the bound ELEMENT_BUFFER. */
export function makeAndBindVao(
	dataAttribsGroups:[dataAttribsGroupArgs, ...dataAttribsGroupArgs[]]
	, indexBuffer:indexBufferDataArgs
	, mode:GLenum
):VaoInfo;
/** Creates a VAO and binds it.
 * @remarks Dirties the bound ARRAY_BUFFER. */
export function makeAndBindVao(
	dataAttribsGroups:[dataAttribsGroupArgs, ...dataAttribsGroupArgs[]]
	, count:number
	, mode:GLenum
):VaoInfo;
export function makeAndBindVao(
	dataAttribsGroups:[dataAttribsGroupArgs, ...dataAttribsGroupArgs[]]
	, indexBufferOrCount:indexBufferDataArgs|number
	, mode:GLenum
):VaoInfo {
	// Create VAO and bind it
	const vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	// Is this VAO indexed?
	const indexed = typeof indexBufferOrCount !== "number";

	// Get count of vertices
	let count:number;
	if (!indexed) count = indexBufferOrCount;
	else {
		if ('srcOffset' in indexBufferOrCount) {
			count = (indexBufferOrCount.length
				? indexBufferOrCount.length
				: indexBufferOrCount.srcData.length
			) - indexBufferOrCount.srcOffset;
		} else {
			count = indexBufferOrCount.srcData.length;
		}
	}

	// Setup all attributes
	for (const group of dataAttribsGroups) {
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);

		const dataArgs = group.dataArgs;
		if ('srcOffset' in dataArgs) {
			gl.bufferData(gl.ARRAY_BUFFER, dataArgs.srcData, dataArgs.usage, dataArgs.srcOffset, dataArgs.length);
		} else {
			gl.bufferData(gl.ARRAY_BUFFER, dataArgs.srcData, dataArgs.usage);
		}

		for (const attrib of group.attribsArgs) {
			gl.enableVertexAttribArray(attrib.index);
			gl.vertexAttribPointer(
				attrib.index
				, attrib.size
				, attrib.type
				, attrib.normalized
				, attrib.stride
				, attrib.offset
			);
		}
	}

	if (indexed) {
		// Setup element array buffer
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);

		if ('srcOffset' in indexBufferOrCount) {
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferOrCount.srcData, indexBufferOrCount.usage, indexBufferOrCount.srcOffset, indexBufferOrCount.length);
		} else {
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferOrCount.srcData, indexBufferOrCount.usage);
		}
	}

	return {
		vao
		, count
		, mode
		, indexInfo: indexed
			? { indexType: glTypeFromTypeArray(indexBufferOrCount.srcData) }
			: undefined
	};
}

export function makeGLProgram(vsSource:string, fsSource:string):WebGLProgram {
	const p = gl.createProgram();

	gl.attachShader(p, makeShader(gl.VERTEX_SHADER, vsSource));
	gl.attachShader(p, makeShader(gl.FRAGMENT_SHADER, fsSource));

	gl.linkProgram(p);
	gl.validateProgram(p);

	if (!gl.getProgramParameter(p, gl.VALIDATE_STATUS)) {
		throw ["GL Program validation failed", gl.getProgramInfoLog(p), vsSource, fsSource];
	}

	return p;
}

function makeShader(type:GLenum, source:string):WebGLShader {
	const s = gl.createShader(type);
	gl.shaderSource(s, source);
	gl.compileShader(s);

	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw ["Shader compilation failed", gl.getShaderInfoLog(s), type, source];

	return s;
}

export function glTypeFromTypeArray(typedArray:BasicTypedArray) {
	switch(typedArray.constructor) {
		case Int8Array:
			return gl.BYTE;
		case Uint8Array:
			return gl.UNSIGNED_BYTE;
		case Uint8ClampedArray:
			return gl.UNSIGNED_BYTE;
		case Int16Array:
			return gl.SHORT;
		case Uint16Array:
			return gl.UNSIGNED_SHORT;
		case Int32Array:
			return gl.INT;
		case Uint32Array:
			return gl.UNSIGNED_INT;
		case Float32Array:
			return gl.FLOAT
	}
	throw ["TypedArray is invalid gl type", Object.prototype.toString.call(typedArray)];
}

export function glWrapFromWrapping(wrapping:Wrapping):GLenum {
	switch (wrapping) {
		case Wrapping.repeat:
			return Gfx.gl.REPEAT;
		case Wrapping.clamp:
			return Gfx.gl.CLAMP_TO_EDGE;
	}
}

export function glSizeFromType(type:GLenum):GLsizei {
	switch(type) {
		case gl.BYTE:
		case gl.UNSIGNED_BYTE:
			return 1;
		case gl.HALF_FLOAT:
		case gl.SHORT:
		case gl.UNSIGNED_SHORT:
		case gl.UNSIGNED_SHORT_4_4_4_4:
		case gl.UNSIGNED_SHORT_5_5_5_1:
		case gl.UNSIGNED_SHORT_5_6_5:
			return 2;
		case gl.FLOAT:
		case gl.INT:
		case gl.UNSIGNED_INT:
		case gl.UNSIGNED_INT_24_8:
		case gl.UNSIGNED_INT_2_10_10_10_REV:
		case gl.UNSIGNED_INT_5_9_9_9_REV:
		case gl.UNSIGNED_INT_10F_11F_11F_REV:
			return 4;
	}
	throw ["Unknown type", type];
}

}
