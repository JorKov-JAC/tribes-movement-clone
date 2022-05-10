namespace Engine.Gfx {

export let gl:WebGL2RenderingContext;
export let ctx2d:CanvasRenderingContext2D;

export const camPos:V3 = [0, 0, 0];
export const camRot:V3 = [0, 0, 0];
export let hFovRad = 110 * Math.PI / 180;
export let zNear = 1/(2**8); // Min sane value is 1 / (2**14)
export let zFar = 1024;

const groundProgPosAttribIdx = 0;
let groundProg:WebGLProgram;

export let screenShakeStrength = 0;
const screenShakeDec = 1;
export const jetpackScreenShake = 0;
export const landingSpeedScreenShakeMult = 1/32;
export const landingSpeedScreenShakeOffset = -.375;

export const sunNorm = [-.57735, -.57735, -.57735];
export const sunColor = [2/3, 2/3, .75*2/3];
export const ambientLight = [1/3, 1/3, 1/3];

let jetpackFuelBarFg = "#28F";
let jetpackFuelBarBg = "#114";
let jetpackFuelBarStroke = "#000";
let jetpackFuelBarLineWidth = 1/32;
let jetpackFuelBarRect:[number, number, number, number] = [-1, -1, .5, 1/8];

/** Time of last draw in ms, as determined by {@link requestAnimationFrame} */
let lastDrawTime:number;

export let vaoSets:{prog:WebGLProgram, vaoInfos:VaoInfo[]}[] = [];

export async function init() {
	groundProg  = makeGLProgram(
`#version 300 es

uniform mat4 view, proj;
uniform sampler2D heightMap;
uniform sampler2D swizzledNormalMap;
uniform vec4 xform; // x translation, z translation, xy size, total height

in vec2 pos;

out vec3 worldPos;
out vec4 vert_normal_height; // xyz: normal, w: height

void main() {
	// > Get samples
	float height = texture(heightMap, pos).r;
	vec3 norm = normalize(texture(swizzledNormalMap, pos).xyz * vec3(2.) - vec3(1.));

	// > Get position
	worldPos = vec3(pos.x * xform.z + xform.x, height * xform.w, pos.y * xform.z + xform.y);
	gl_Position = proj * view * vec4(worldPos, 1.);

	vert_normal_height = vec4(norm, height);
}`
, `#version 300 es
precision highp float;

in vec3 worldPos;
in vec4 vert_normal_height; // xyz: normal, w: height

uniform sampler2D topDiff;
uniform sampler2D topNorm;
uniform sampler2D sideDiff;
uniform sampler2D sideNorm;

uniform vec2 top_side_scaleRecips; // x: reciprocal of top texture scale, y: reciprocal of side texture scale

uniform vec3 sunNorm;
uniform vec3 sunColor;
uniform vec3 ambientLight;

out vec4 color;

void main() {
	vec3 norm = normalize(vert_normal_height.xyz);
	float height = vert_normal_height.w;

	// > Prepare sample coords
	vec2 topCoord = worldPos.xz * top_side_scaleRecips.x;
	vec2 xSideCoord = worldPos.xy * top_side_scaleRecips.y;
	vec2 ySideCoord = worldPos.zy * top_side_scaleRecips.y;
	// > Get samples
	vec4 topCol = texture(topDiff, topCoord);
	vec4 xSideCol = texture(sideDiff, xSideCoord);
	vec4 ySideCol = texture(sideDiff, ySideCoord);

	float sideLerp = abs(norm.x);
	vec4 sideCol = mix(xSideCol, ySideCol, sideLerp);
	float topLerp = pow(norm.y, 1.5);
	color = mix(sideCol, topCol, topLerp);

	color.rgb *= (ambientLight + sunColor * max(0., -dot(sunNorm, norm)));
}`
	);

	gl.bindAttribLocation(groundProg, groundProgPosAttribIdx, "pos");

	const w = gl.canvas.width;
	const h = gl.canvas.height;
	ctx2d.setTransform(.5 * w, 0, 0, -.5 * h, .5 * w, .5 * h);

	requestAnimationFrame((time:number) => {
		lastDrawTime = time;
		draw(time);
	});
}

export function draw(time:number):void {
	const d = (time - lastDrawTime) / 1000;

	// > Handle dynamic resizing
	const w = gl.canvas.clientWidth;
	const h = gl.canvas.clientHeight;
	if (gl.canvas.width != w
	|| gl.canvas.height != h) {
		gl.canvas.width = w;
		gl.canvas.height = h;
		gl.viewport(0, 0, w, h);

		ctx2d.canvas.width = w;
		ctx2d.canvas.height = h;
		// (-1,-1) down left, (1,1) up right:
		ctx2d.setTransform(.5 * w, 0, 0, -.5 * h, .5 * w, .5 * h);
	}

	// > Clear and enable buffers, as well as other default state
	gl.clearColor(.375, .625, .875, 1);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.cullFace(gl.BACK);
	// Note to self: Do NOT try enabling multiple capabilities at once with
	// bitwise or; It caused some truly weird behavior.
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	// > Generate universal matrices
	const viewM = viewM4(camPos, camRot);
	// HACK Hardcoded screenshake
	viewM[12] += (Math.random() - .5) * screenShakeStrength;
	viewM[13] += (Math.random() - .5) * screenShakeStrength;
	const projM = perspM4(zNear, zFar, hFovRad, w/h);

	// // Funky sun rotation:
	// (sunNorm as Mut<V3>).set3(([0, 0, -1] as Mut<V3>).basedV3M4(eulerXformationM4([-Math.PI/4, performance.now()/1000, 0])));

	// > Draw general VAOs
	// Note that, because this engine is so hardcoded, this isn't super useful.
	for (const set of vaoSets) {
		gl.useProgram(set.prog);
		gl.uniformMatrix4fv(gl.getUniformLocation(set.prog, "view"), false, new Float32Array(viewM));
		gl.uniformMatrix4fv(gl.getUniformLocation(set.prog, "proj"), false, new Float32Array(projM));

		set.vaoInfos.forEach(bindAndDrawVao);
	}

	// HACK > Draw the ground (hardcoded)
	gl.useProgram(groundProg);
	gl.uniformMatrix4fv(gl.getUniformLocation(groundProg, "view"), false, new Float32Array(viewM));
	gl.uniformMatrix4fv(gl.getUniformLocation(groundProg, "proj"), false, new Float32Array(projM));
	gl.uniform4fv(gl.getUniformLocation(groundProg, "xform"), new Float32Array([ground.pos[0], ground.pos[1], ground.length, ground.heightScale]));
	gl.uniform2fv(gl.getUniformLocation(groundProg, "top_side_scaleRecips"), new Float32Array([ground.topMatScaleRecip, ground.sideMatScaleRecip]));
	gl.uniform3fv(gl.getUniformLocation(groundProg, "sunNorm"), new Float32Array(sunNorm));
	gl.uniform3fv(gl.getUniformLocation(groundProg, "sunColor"), new Float32Array(sunColor));
	gl.uniform3fv(gl.getUniformLocation(groundProg, "ambientLight"), new Float32Array(ambientLight));
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, ground.heightmapTex);
	gl.uniform1i(gl.getUniformLocation(groundProg, "heightMap"), 0);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, ground.normalmapTex);
	gl.uniform1i(gl.getUniformLocation(groundProg, "swizzledNormalMap"), 1);
	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, ground.topMatDiff);
	gl.uniform1i(gl.getUniformLocation(groundProg, "topDiff"), 2);
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, ground.topMatNorm);
	gl.uniform1i(gl.getUniformLocation(groundProg, "topNorm"), 3);
	gl.activeTexture(gl.TEXTURE4);
	gl.bindTexture(gl.TEXTURE_2D, ground.sideMatDiff);
	gl.uniform1i(gl.getUniformLocation(groundProg, "sideDiff"), 4);
	gl.activeTexture(gl.TEXTURE5);
	gl.bindTexture(gl.TEXTURE_2D, ground.sideMatNorm);
	gl.uniform1i(gl.getUniformLocation(groundProg, "sideNorm"), 5);
	bindAndDrawVao(ground.vaoInfo);

	// > Draw hud
	ctx2d.clearRect(-1, -1, 2, 2);

	{
		ctx2d.lineWidth = jetpackFuelBarLineWidth;
		ctx2d.strokeStyle = jetpackFuelBarStroke;
		ctx2d.fillStyle = jetpackFuelBarBg;
		ctx2d.beginPath();
		ctx2d.rect(...jetpackFuelBarRect);
		ctx2d.stroke();
		ctx2d.fill();
		ctx2d.fillStyle = jetpackFuelBarFg;
		const [x, y, w, h] = jetpackFuelBarRect;
		ctx2d.beginPath();
		ctx2d.rect(x, y, w * player.jetpackFuel / player.jetpackFuelMax, h);
		ctx2d.fill();
	}

	// HACK Hardcoded screenshake dampening
	screenShakeStrength = Math.max(0, screenShakeStrength - screenShakeDec * d);

	// > Request next frame
	requestAnimationFrame(draw);
	lastDrawTime = time;

}

export function genGroundVaoInfo(vertsPerDim:number):VaoInfo {
	const tilesPerDim = vertsPerDim - 1;
	const vertCount = vertsPerDim * vertsPerDim;
	const posComponents = 2;
	const posBuffer = new Float32Array(vertCount * posComponents);

	// > Generate position buffer
	for (let vertIdx = 0, y = 0; y < vertsPerDim; ++y) {

		const yComp = y / tilesPerDim;

		for (let x = 0; x < vertsPerDim; ++x) {
			posBuffer[vertIdx++] = x / tilesPerDim;
			posBuffer[vertIdx++] = yComp;
		}
	}

	// > Generate index buffer
	const indexArray = [];
	// For every row of tiles (not vertices):
	for (let y = 0; y < tilesPerDim; ++y) {

		// How this works:
		// We're using triangle strips so we just need to add vertices in an
		// up-down left-right zig-zag pattern. Between rows, the final vertex of
		// the ending row and the first of the next are repeated, creating
		// degenerate triangles that allow us to jump to the next tile row.
		// See also: https://www.learnopengles.com/tag/triangle-strips/

		const yComp = y * vertsPerDim;

		// Insert degenerate triangles
		if (y > 0) {
			indexArray.push(yComp + vertsPerDim - 1);
			indexArray.push(yComp);
		}

		// For every column of vertices (not tiles):
		for (let x = 0; x < vertsPerDim; ++x) {
			const thisVert = yComp + x;
			indexArray.push(thisVert);
			indexArray.push(thisVert + vertsPerDim);
		}

		// DOES NOT WORK WITH BACKFACE CULLING:
		// Using one degenerate triangle per row:
		// How this works:
		// We're using triangle strips so we just need to add vertices in an
		// up-down left-right zig-zag pattern. The final vertex of each row is
		// repeated, created a degenerate triangle that allows us to jump to the
		// next tile row. Because we switch from going left-right to right-left,
		// we can save one whole index per row where otherwise we'd need to
		// repeat the first index of each row too (although this results in
		// zig-zag topology).
		// See also: https://www.learnopengles.com/tag/triangle-strips/

		// const yComp = y * vertsPerDim;

		// if (y % 2 == 0) {
		// 	// > Left to right
		// 	// For every column of vertices (not tiles):
		// 	for (let x = 0; x < vertsPerDim; ++x) {
		// 		const thisVert = yComp + x;
		// 		indexArray.push(thisVert);
		// 		indexArray.push(thisVert + vertsPerDim);
		// 	}

		// } else {
		// 	// > Right to left
		// 	// For every column of vertices (not tiles) BACKWARDS:
		// 	// The --> is a good habit for backward iteration
		// 	// because of unsigned numbers (doesn't matter here)
		// 	for (let x = vertsPerDim; x-- > 0;) {
		// 		const thisVert = yComp + x;
		// 		indexArray.push(thisVert);
		// 		indexArray.push(thisVert + vertsPerDim);
		// 	}
		// }
	}

	// > Return VAO info
	return makeAndBindVao(
		[
			{
				dataArgs: {srcData: posBuffer, usage: Gfx.gl.STATIC_DRAW}
				, attribsArgs: [{
					index: groundProgPosAttribIdx
					, size: 2
					, type: Gfx.gl.FLOAT
					, normalized: false
					, stride: 0
					, offset: 0
				}]
			}
		]
		, {srcData: new Uint32Array(indexArray), usage: Gfx.gl.STATIC_DRAW}
		, gl.TRIANGLE_STRIP
	);
}

/** Gets an {@link ImageData} from a bitmap source. */
export function getImageData(src:Exclude<CanvasImageSource, SVGImageElement>) {
	// > Create canvas and context
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (ctx === null) throw ["Unable to get 2D context"];
	canvas.width = src.width;
	canvas.height = src.height;

	ctx.drawImage(src, 0, 0);
	return ctx.getImageData(0, 0, src.width, src.height);
}

}
