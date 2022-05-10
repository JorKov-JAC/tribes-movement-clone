namespace Engine {

export const baseDir = '';

const targetTickrate = 1/60;

export const keys:Set<string> = new Set();
export const newKeys:Set<string> = new Set();

export let pointerLocked:boolean = false;
export let lockedPointerDX:number = 0;
export let lockedPointerDY:number = 0;

const mouseButtons = {
	0: "MouseLeft"
	, 1: "MouseMiddle"
	, 2: "MouseRight"
};
type mouseButtonsOrUndefined = {[key:number]:typeof mouseButtons[keyof typeof mouseButtons & number]|undefined};

export async function main() {

	const canvas = document.getElementById("game") as HTMLCanvasElement;
	const canvas2d = document.getElementById("game2d") as HTMLCanvasElement;

	Gfx.gl = canvas.getContext("webgl2");
	Gfx.ctx2d = canvas2d.getContext("2d");

	if (!Gfx.gl) {
		canvas.outerHTML = "<p>ERROR webgl2 failed; Please update your browser or enable webgl2 in its settings</p>";
		return;
	}
	if (!Gfx.ctx2d) {
		canvas.outerHTML = "<p>ERROR 2d context failed</p>";
		return;
	}

	canvas.addEventListener("keydown", e => {
		if (!pointerLocked && e.code !== "Enter") return;
		if (!pointerLocked) canvas.requestPointerLock();
		e.preventDefault();
		e.stopPropagation();

		keys.add(e.code);
		newKeys.add(e.code);
	});
	canvas.addEventListener("keyup", e => {
		if (!pointerLocked) return;
		e.preventDefault();
		e.stopPropagation();

		// Remove from keys but leave in newKeys so press events still trigger.
		keys.delete(e.code);
	});
	canvas.addEventListener("click", e => {
		e.preventDefault();
		e.stopPropagation();
		if (!pointerLocked) {
			canvas.requestPointerLock();
			return;
		}
	});
	document.addEventListener("pointerlockchange", () => {
		if (document.pointerLockElement === canvas) pointerLocked = true;
		else {
			pointerLocked = false;
			// Remove from keys but leave in newKeys so press events still
			// trigger.
			keys.clear();
		}
	});
	canvas.addEventListener("mousemove", e => {
		if (!pointerLocked) return;
		e.preventDefault();
		e.stopPropagation();

		lockedPointerDX += e.movementX;
		lockedPointerDY += e.movementY;
	});
	canvas.addEventListener("mousedown", e => {
		if (!pointerLocked) return;
		e.preventDefault();
		e.stopPropagation();

		const key = (mouseButtons as mouseButtonsOrUndefined)[e.button];
		if (key === undefined) return;

		keys.add(key);
		newKeys.add(key);
	});
	canvas.addEventListener("mouseup", e => {
		if (!pointerLocked) return;
		e.preventDefault();
		e.stopPropagation();

		const key = (mouseButtons as mouseButtonsOrUndefined)[e.button];
		if (key === undefined) return;

		// Remove from keys but leave in newKeys so press events still trigger.
		keys.delete(key)
	});

	const testProg = Gfx.makeGLProgram(
`#version 300 es

uniform mat4 view;
uniform mat4 proj;

in vec2 pos;

out float depth;

void main() {
	gl_Position = proj * view * vec4(0.0, pos, 1.0);
	//gl_Position.xy /= gl_Position.w;

	// vec4 res = proj * view * vec4(0.0, pos, 1.0);
	// res.xy /= res.w;
	// gl_Position = res;

	// gl_Position = view * vec4(0.0, pos, 1.0);

	depth = gl_Position.z;
}
`
, `#version 300 es
precision highp float;

in float depth;

out vec4 color;

void main() {
	color = vec4(0.5, 1.0 - mix(0.5, 0.0, depth), 0.5, 1.0);
}
`
	);

	const squareVaoInfo = Gfx.makeAndBindVao(
		[
			{
				dataArgs: {srcData: new Float32Array([-0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5]), usage: Gfx.gl.STATIC_DRAW}
				, attribsArgs: [{index: Gfx.gl.getAttribLocation(testProg, "pos"), size: 2, type: Gfx.gl.FLOAT, normalized: false, stride: 0, offset: 0}]
			}
		]
		, 6
		, Gfx.gl.TRIANGLES
	);

	Gfx.vaoSets.push({prog: testProg, vaoInfos: [squareVaoInfo]}, /* {prog: groundProgram, vaoInfos: [groundVaoInfo]} */);

	await initGame();
	await Gfx.init();
}

/* Game */

export let player:Player;
let controls:Controls;

// HACK Global scope ground object (as opposed to a VaoInfo in a list)
export let ground:Terrain;

async function initGame() {
	player = new Player();
	controls = new Controls(2, 1/2**7);

	// HACK Hardcoded init ground
	const groundLength = 1024;
	const groundCenterOffset = -groundLength * .5;
	ground = await Terrain.new(
		baseDir + 'res/heightmap.png'
		, baseDir + 'res/forest2_d.jpg'
		, baseDir + 'res/forest2_n.jpg'
		, 16
		, baseDir + 'res/forest4_d.jpg'
		, baseDir + 'res/forest4_n.jpg'
		, 16
		, groundLength
		, 128
		, (128 * 3) + 1
		, [groundCenterOffset, groundCenterOffset]
		, Wrapping.clamp
	);

	const tickDelay = Math.round(targetTickrate * 1000);
	setInterval(tick, tickDelay, tickDelay / 1000);
}

function tick(d:number) {
	player.update(d);

	(Gfx.camPos as Mut<V3>).set3([player.pos[0], player.pos[1] + player.height, player.pos[2]]);
	(Gfx.camRot as Mut<V3>).set3(player.rot);

	newKeys.clear();
	lockedPointerDX = 0;
	lockedPointerDY = 0;
}

class Controls {
	/** Keyboard turn speed */
	keyTurnSens:number;
	/** Mouse turn sensitivity */
	mouseTurnSens:number;

	move_front = 'KeyW';
	move_back = 'KeyS';
	move_left = 'KeyA';
	move_right = 'KeyD';
	move_up = 'MouseRight';
	move_down = 'Space';

	move_fast = 'ShiftLeft';

	turn_up = 'ArrowUp';
	turn_down = 'ArrowDown';
	turn_left = 'ArrowLeft';
	turn_right = 'ArrowRight';

	toggle_spectate = 'KeyX';

	constructor(keyTurnSens:number, mouseTurnSens:number) {
		this.keyTurnSens = keyTurnSens;
		this.mouseTurnSens = mouseTurnSens;
	}
}

class Player {
	readonly pos:V3 = [0, 0, 0];
	readonly rot:V3 = [0, 0, 0];
	readonly vel:V3 = [0, 0, 0];
	moveAcc = 32;
	maxHorSpd = 0;
	overspeedSlowdownFixedAcc = 12;
	overspeedSlowdownFactorAcc = 3/4;
	gravity = -9.807;
	jumpSpd = this.gravity * -.625;
	jetpackAcc = this.gravity * -1.5;
	spectating = false;
	height = 1.5;
	/** True if player is on the ground, false otherwise. */
	grounded = false;
	/** Player movement acceleration multiplier when jetpacking, overrides
	 * {@link airAccMult}. */
	jetpackAccMult = 3/8;
	/** Player movement acceleration multiplier when in the air */
	airAccMult = this.jetpackAccMult/4;
	/** Speed when flying. */
	flySpd = 24;
	/** Amount to multiply player speed by when they are flying fast. */
	fastFlyMul = 2;

	jetpackFuelMax = 1;
	jetpackFuel = this.jetpackFuelMax;
	// jetpackFuelCostPerSec = 7/24;
	jetpackFuelCostPerSec = 1/3;
	jetpackFuelRegenPerSec = 1/6;
	jetpackFuelRegenDelay = 1;
	jetpackFuelRegenTimer = 0;
	jetpackRunoutUseDelay = this.jetpackFuelRegenDelay + .25;
	jetpackUseTimer = 0;

	update(d:number):void {
		this.move(d);
	}

	move(d:number):void {
		if (newKeys.has(controls.toggle_spectate)) {
			// (this.vel as Mut<V3>).set3([0, 0, 0]);
			this.spectating = !this.spectating;
		}
		// > Decide if player is skiing
		const skiing = keys.has(controls.move_down);

		this.rot[0]
		+= (keys.has(controls.turn_up) ? controls.keyTurnSens * d : 0)
		+ (keys.has(controls.turn_down) ? -controls.keyTurnSens * d : 0)
		- lockedPointerDY * controls.mouseTurnSens;
		// Clamp pitch:
		this.rot[0] = clamp(this.rot[0], -HALF_PI, HALF_PI);

		this.rot[1]
		+= (keys.has(controls.turn_left) ? controls.keyTurnSens * d : 0)
		+ (keys.has(controls.turn_right) ? -controls.keyTurnSens * d : 0)
		- lockedPointerDX * controls.mouseTurnSens;
		// Keep yaw within [-PI, PI[:
		this.rot[1] = mod(this.rot[1] + PI, TWO_PI) - PI;

		const acc = new3();

		if (!this.spectating) {

			// > Decide if player is jetpacking and/or jumping
			let jetpacking = false;
			if (keys.has(controls.move_up)) {
				// Jump:
				if (this.grounded) this.vel[1] = Math.max(this.jumpSpd, this.vel[1]);
				// Jetpack:
				if (this.jetpackFuel > 0 && this.jetpackUseTimer <= 0) {
					jetpacking = true;
					Gfx.screenShakeStrength = Math.max(Gfx.jetpackScreenShake, Gfx.screenShakeStrength);
				}
			}

			// > Handle slowing down when above max speed
			const horVel:V3 = this.vel.copy3().mul3([1, 0, 1]);
			const horVelNorm:V3 = horVel.copy3().normOrZero3();
			const horSpeed = horVel.mag3();
			if (this.grounded && !skiing) {
				const overspeed = Math.max(0, horSpeed - this.maxHorSpd);
				const slowdown = Math.min( overspeed * (1-Math.pow((1-this.overspeedSlowdownFactorAcc), d)) + this.overspeedSlowdownFixedAcc * d, overspeed );
				(this.vel as Mut<V3>).sub3( horVelNorm.copy3().mul3(slowdown) );
			}

			const horAccMag = this.moveAcc * (this.grounded ? (skiing ? 0 : 1) : jetpacking ? this.jetpackAccMult : this.airAccMult);
			const wantHorAcc = ([
				(keys.has(controls.move_left) ? -1 : 0)
					+ (keys.has(controls.move_right) ? 1 : 0)
				, 0
				, (keys.has(controls.move_front) ? -1 : 0)
					+ (keys.has(controls.move_back) ? 1 : 0)
			] as Mut<V3>)
			// Normalize player's wish direction:
			.normOrZero3()
			// Times acceleration:
			.mul3(horAccMag);

			// // > Prevent player from accelerating above the max speed:
			// const wantHorSpd = wantHorAcc.copy3().mul3(d).add3(horVel).mag3();
			// const horAcc = (wantHorSpd > this.maxHorSpd && wantHorSpd > horSpeed) ? new3() : wantHorAcc.copy3();
			// HACK Don't bother with this for now:
			const horAcc = (wantHorAcc.magSq3() === 0 && this.grounded && !skiing) ? horVelNorm.copy3().mul3( -Math.min(horAccMag, horSpeed) ) : wantHorAcc.copy3();

			// > Transform local movement to world movement
			const moveBasis = eulerBasis([0, this.rot[1], 0]);
			(acc as Mut<V3>).add3(horAcc.basedV3(moveBasis));

			acc[1] += this.gravity + (jetpacking ? this.jetpackAcc : 0);

			if (jetpacking) {
				acc[1] == this.jetpackAcc;
				this.jetpackFuel -= this.jetpackFuelCostPerSec * d;
				if (this.jetpackFuel <= 0) this.jetpackUseTimer = this.jetpackRunoutUseDelay;
				this.jetpackFuelRegenTimer = this.jetpackFuelRegenDelay;
			}
		} else {
			const playerBasis = eulerBasis(this.rot);

			const playerMove_view = ([
				(keys.has(controls.move_left) ? -this.flySpd : 0)
				+ (keys.has(controls.move_right) ? this.flySpd : 0),
				(keys.has(controls.move_up) ? this.flySpd : 0)
				+ (keys.has(controls.move_down) ? -this.flySpd : 0),
				(keys.has(controls.move_front) ? -this.flySpd : 0)
				+ (keys.has(controls.move_back) ? this.flySpd : 0)
			] as Mut<V3>);
			(this.vel as Mut<V3>).set3(playerMove_view.basedV3(playerBasis).mul3(keys.has(controls.move_fast) ? this.fastFlyMul : 1));
		}

		(acc as Mut<V3>).mul3(d);

		(this.pos as Mut<V3>).add3(this.vel.copy3().add3( acc.copy3().mul3(.5) ).mul3(d));
		(this.vel as Mut<V3>).add3(acc);

		this.grounded = false;
		// HACK > Hardcoded ground collision
		// const groundMapX = mod( Math.round((this.pos[0] / ground.length + .5) * ground.heightmapData.width), ground.heightmapData.width );
		// const groundMapY = mod( Math.round((this.pos[2] / ground.length + .5) * ground.heightmapData.height), ground.heightmapData.height );
		const groundHeight = ground.heightAt(this.pos[0], this.pos[2]);
		if (this.pos[1] < groundHeight) {
			this.pos[1] = groundHeight;
			const groundNorm = ground.normalAt(this.pos[0], this.pos[2]);
			const velDotGround = this.vel.dot3(groundNorm);
			if (velDotGround < 0) {
				this.grounded = true;
				Gfx.screenShakeStrength = Math.max(Gfx.screenShakeStrength, clamp(velDotGround * -Gfx.landingSpeedScreenShakeMult + Gfx.landingSpeedScreenShakeOffset, 0, 1));
				(this.vel as Mut<V3>).sub3((groundNorm as Mut<V3>).mul3(velDotGround));
			}
		}

		const rightEdge = ground.length * .5;
		const leftEdge = -rightEdge;
		const frontEdge = ground.length * .5;
		const backEdge = -frontEdge;
		if (this.pos[0] < leftEdge) {
			this.pos[0] = leftEdge;
			this.vel[0] = 0;
		}
		if (this.pos[0] > rightEdge) {
			this.pos[0] = rightEdge;
			this.vel[0] = 0;
		}
		if (this.pos[2] < backEdge) {
			this.pos[2] = backEdge;
			this.vel[2] = 0;
		}
		if (this.pos[2] > frontEdge) {
			this.pos[2] = rightEdge;
			this.vel[2] = 0;
		}

		if (this.jetpackFuelRegenTimer <= 0) this.jetpackFuel += this.jetpackFuelRegenPerSec * d;
		this.jetpackFuel = clamp(this.jetpackFuel, 0, this.jetpackFuelMax);
		this.jetpackFuelRegenTimer -= d;
		this.jetpackUseTimer -= d;
	}
}

class Terrain {

	/** 2D array of heights normalized from 0 to 1 */
	private heightmapData:WrappingArray<WrappingArray<number>>;
	private normalmapData:WrappingArray<WrappingArray<V3>>;

	heightmapTex:WebGLTexture;
	normalmapTex:WebGLTexture;
	topMatDiff:WebGLTexture;
	topMatNorm:WebGLTexture;
	topMatScaleRecip:number;
	sideMatDiff:WebGLTexture;
	sideMatNorm:WebGLTexture;
	sideMatScaleRecip:number;

	vaoInfo:Gfx.VaoInfo;
	readonly length:number;
	readonly heightScale:number;
	readonly res:number;
	readonly pos:V2 = [0, 0];
	/** Wrapping mode */
	readonly wrapping:Wrapping;

	/** Use {@link new} for creating new instances */
	// We don't use a constructor for new instances because they cannot be
	// async. This constructor is called internally.
	private constructor(
	heightmapData:Terrain["heightmapData"], heightmapTex:WebGLTexture
	, normalmapData:Terrain["normalmapData"], normalmapTex:WebGLTexture
	, topMatDiff:WebGLTexture, topMatNorm:WebGLTexture, topMatScaleRecip:number
	, sideMatDiff:WebGLTexture , sideMatNorm:WebGLTexture, sideMatScaleRecip:number
	, vaoInfo:Gfx.VaoInfo, length:number, heightScale:number, res:number
	, pos:V2, wrapping:Wrapping
	) {
		this.heightmapData = heightmapData;
		this.heightmapTex = heightmapTex;
		this.normalmapData = normalmapData;
		this.normalmapTex = normalmapTex;
		this.topMatDiff = topMatDiff;
		this.topMatNorm = topMatNorm;
		this.topMatScaleRecip = topMatScaleRecip;
		this.sideMatDiff = sideMatDiff;
		this.sideMatNorm = sideMatNorm;
		this.sideMatScaleRecip = sideMatScaleRecip;
		this.vaoInfo = vaoInfo;
		this.length = length;
		this.heightScale = heightScale;
		this.res = res;
		this.pos = pos;
		this.wrapping = wrapping;
	}


	static async new(
	hmapSrc:string, topMatDiffSrc:string, topMatNormSrc:string
	, topMatScale:number, sideMatDiffSrc:string, sideMatNormSrc:string
	, sideMatScale:number, length:number, heightScale:number, res:number
	, pos:V2, wrapping:Wrapping
	) {
		const heightmapImagePromise = Gfx.loadImage(hmapSrc);
		const topMatDiffImagePromise = Gfx.loadImage(topMatDiffSrc);
		const topMatNormImagePromise = Gfx.loadImage(topMatNormSrc);
		const sideMatDiffImagePromise = Gfx.loadImage(sideMatDiffSrc);
		const sideMatNormImagePromise = Gfx.loadImage(sideMatNormSrc);

		const vaoInfo = Gfx.genGroundVaoInfo(res);

		const heightmapImage = await heightmapImagePromise;

		const glWrap = Gfx.glWrapFromWrapping(wrapping);

		const heightmapTexPromise = Gfx.genAndBindTexture(
			heightmapImage
			, Gfx.gl.LUMINANCE
			, Gfx.gl.UNSIGNED_BYTE
			, { minFilter: Gfx.gl.LINEAR, wrapS: glWrap, wrapT: glWrap }
		);

		const heightmapImageData = Gfx.getImageData(heightmapImage);

		// > Convert ImageData to a 2d wrapping array of height values
		const hm = CreateWrappingArray<WrappingArray<number>>(new Array(heightmapImageData.height), wrapping);
		for (let y = 0; y < heightmapImageData.height; ++y) {
			const row = CreateWrappingArray<number>(new Array(heightmapImageData.width), wrapping);
			hm[y] = row;
			for (let x = 0; x < heightmapImageData.width; ++x) {
				// 4 is number of color components per ImageData pixel.
				// ImageData is from [0, 255], map to [0, 1]
				row[x] = heightmapImageData.data[(y * heightmapImageData.width + x) * 4]! / 255;
			}
		}

		// > Create normal map data based on height values
		const normalmapData = CreateWrappingArray<WrappingArray<V3>>(new Array(hm.length), wrapping);
		for (let y = 0; y < hm.length; ++y) {
			const row = CreateWrappingArray<V3>(new Array(hm[y]!.length), wrapping);
			normalmapData[y] = row;
			for (let x = 0; x < hm[y]!.length; ++x) {


				const centre = hm[y]![x]! * heightScale;
				const leftDelta = hm[y]![x-1]! * heightScale - centre;
				const rightDelta = hm[y]![x+1]! * heightScale - centre;
				const backDelta = hm[y-1]![x]! * heightScale - centre;
				const frontDelta = hm[y+1]![x]! * heightScale - centre;

				const sampleDist = length / hm.length;
				const leftNorm:V3 = ([leftDelta, sampleDist, 0] as NonZero<Mut<V3>>).norm3();
				const rightNorm:V3 = ([-rightDelta, sampleDist, 0] as NonZero<Mut<V3>>).norm3();
				const xSlope = (leftNorm[0] + rightNorm[0]) / (leftNorm[1] + rightNorm[1]);
				const backNorm:V3 = ([backDelta, sampleDist, 0] as NonZero<Mut<V3>>).norm3();
				const frontNorm:V3 = ([-frontDelta, sampleDist, 0] as NonZero<Mut<V3>>).norm3();
				const zSlope = (backNorm[0] + frontNorm[0]) / (backNorm[1] + frontNorm[1]);
				const norm:V3 = ([xSlope, 1, zSlope] as NonZero<Mut<V3>>).norm3();

				normalmapData[y]![x]! = norm;
			}
		}
		// > Create normal map texture
		const normalmapTexPromise = Gfx.genAndBindTextureFrom2dArrayRGB(
			normalmapData.flatMap(row => row.flatMap(norm => [norm[0]*127.5 + 127.5, norm[1]*127.5 + 127.5, norm[2]*127.5 + 127.5]))
			, normalmapData.length
			, { minFilter: Gfx.gl.LINEAR }
		)

		const topMatDiffTexPromise = Gfx.genAndBindTexture(
			await topMatDiffImagePromise
			, Gfx.gl.RGB
			, Gfx.gl.UNSIGNED_BYTE
			, { generateMipmap: true, minFilter: Gfx.gl.LINEAR_MIPMAP_LINEAR }
		);
		const topMatNormTexPromise = Gfx.genAndBindTexture(
			await topMatNormImagePromise
			, Gfx.gl.RGB
			, Gfx.gl.UNSIGNED_BYTE
			, { generateMipmap: true, minFilter: Gfx.gl.LINEAR_MIPMAP_LINEAR }
		);
		const sideMatDiffTexPromise = Gfx.genAndBindTexture(
			await sideMatDiffImagePromise
			, Gfx.gl.RGB
			, Gfx.gl.UNSIGNED_BYTE
			, { generateMipmap: true, minFilter: Gfx.gl.LINEAR_MIPMAP_LINEAR }
		);
		const sideMatNormTexPromise = Gfx.genAndBindTexture(
			await sideMatNormImagePromise
			, Gfx.gl.RGB
			, Gfx.gl.UNSIGNED_BYTE
			, { generateMipmap: true, minFilter: Gfx.gl.LINEAR_MIPMAP_LINEAR }
		);

		return new this(
			hm
			, await heightmapTexPromise
			, normalmapData
			, await normalmapTexPromise
			, await topMatDiffTexPromise
			, await topMatNormTexPromise
			, 1/topMatScale
			, await sideMatDiffTexPromise
			, await sideMatNormTexPromise
			, 1/sideMatScale
			, vaoInfo
			, length
			, heightScale
			, res
			, pos
			, wrapping
		);
	}

	mapXFromWorldX(x:number):number {
		return (x - this.pos[0]) / this.length * this.heightmapData.length - .5;
	}
	mapYFromWorldZ(z:number):number {
		return (z - this.pos[1]) / this.length * this.heightmapData.length - .5;
	}
	/** Gets the x of the down-left vertices of the VAO triangles containing x. */
	dlTriXFromWorldX(x:number):number {
		const trisPerDim = this.res - 1;
		return Math.floor( (x - this.pos[0]) / this.length * trisPerDim ) / trisPerDim * this.heightmapData.length - .5;
	}
	/** Gets the y of the down-left vertices of the VAO triangles containing y. */
	dlTriYFromWorldZ(z:number):number {
		const trisPerDim = this.res - 1;
		return Math.floor( (z - this.pos[1]) / this.length * trisPerDim ) / trisPerDim * this.heightmapData.length - .5;
	}

	/** Gets the height at a local-space coordinate using bilinear interpolation
	 * instead of triangle interpolation.
	 */
	private bilinearHeightAtLocal(x:number, y:number) {
		const hm = this.heightmapData;

		const leftIdx = Math.floor(x);
		const downIdx = Math.floor(y);
		const fractX = x - leftIdx;
		const fractY = y - downIdx;

		return bilinear(
			fractX
			, fractY
			, hm[downIdx]![leftIdx]!
			, hm[downIdx]![leftIdx+1]!
			, hm[downIdx+1]![leftIdx]!
			, hm[downIdx+1]![leftIdx+1]!
		);
	}

	/** Gets the height at a world-space coordinate using triangle interpolation
	 * which corresponds to the VAO.
	*/
	heightAt(x:number, z:number):number {
		const mapX = this.mapXFromWorldX(x);
		const mapY = this.mapYFromWorldZ(z);
		const dlVertX = this.dlTriXFromWorldX(x);
		const dlVertY = this.dlTriYFromWorldZ(z);
		const trisPerDim = this.res - 1;
		const vertDist = this.heightmapData.length / trisPerDim;
		const fractX = (mapX - dlVertX) / vertDist;
		const fractY = (mapY - dlVertY) / vertDist;

		if (fractX + fractY > 1) {
			const ul = this.bilinearHeightAtLocal(dlVertX, dlVertY + vertDist);
			const ur = this.bilinearHeightAtLocal(dlVertX + vertDist, dlVertY + vertDist);
			const dr = this.bilinearHeightAtLocal(dlVertX + vertDist, dlVertY);
			const horLerp = fastLerp(ur, ul, (1-fractX) / fractY);
			const lerp = fastLerp(dr, horLerp, fractY);
			return lerp * this.heightScale;
		} else {
			const dl = this.bilinearHeightAtLocal(dlVertX, dlVertY);
			const dr = this.bilinearHeightAtLocal(dlVertX + vertDist, dlVertY);
			const ul = this.bilinearHeightAtLocal(dlVertX, dlVertY + vertDist);
			const horLerp = fastLerp(dl, dr, fractX / (1-fractY));
			const lerp = fastLerp(horLerp, ul, fractY);
			return lerp * this.heightScale;
		}
	}

	/** Gets the normal at a local-space coordinate using bilinear interpolation
	 * instead of triangle interpolation.
	 */
	private bilinearNormalAtLocal(x:number, y:number):NonZero<Mut<V3>> {
		const nm = this.normalmapData;

		const leftIdx = Math.floor(x);
		const downIdx = Math.floor(y);
		const fractX = x - leftIdx;
		const fractY = y - downIdx;

		return bilinear3(
			fractX
			, fractY
			, nm[downIdx]![leftIdx]!
			, nm[downIdx]![leftIdx+1]!
			, nm[downIdx+1]![leftIdx]!
			, nm[downIdx+1]![leftIdx+1]!
		) as NonZero<Mut<V3>>;
	}

	/** Gets the normal at a world-space coordinate using bilinear interpolation
	 * instead of triangle interpolation.
	 */
	normalAt(x:number, z:number):NonZero<Mut<V3>> {
		return this.bilinearNormalAtLocal(this.mapXFromWorldX(x), this.mapYFromWorldZ(z));
	}

	/** Gets the normal at a world-space coordinate using triangle interpolation
	 * which corresponds to the VAO.
	*/
	triNormalAt(x:number, z:number):NonZero<Mut<V3>> {
		const mapX = this.mapXFromWorldX(x);
		const mapY = this.mapYFromWorldZ(z);
		const dlVertX = this.dlTriXFromWorldX(x);
		const dlVertY = this.dlTriYFromWorldZ(z);
		const trisPerDim = this.res - 1;
		const vertDist = this.heightmapData.length / trisPerDim;
		const fractX = (mapX - dlVertX) / vertDist;
		const fractY = (mapY - dlVertY) / vertDist;

		if (fractX + fractY > 1) {
			const ul = this.bilinearNormalAtLocal(dlVertX, dlVertY + vertDist);
			const ur = this.bilinearNormalAtLocal(dlVertX + vertDist, dlVertY + vertDist);
			const dr = this.bilinearNormalAtLocal(dlVertX + vertDist, dlVertY);
			const horLerp = ( (ur as Mut<V3>).fastLerp3(ul, (1-fractX) / fractY) as NonZero<Mut<V3>> ).norm3();
			return ( (dr as Mut<V3>).fastLerp3(horLerp, fractY).mul3(this.heightScale) as NonZero<Mut<V3>> ).norm3();
		} else {
			const dl = this.bilinearNormalAtLocal(dlVertX, dlVertY);
			const dr = this.bilinearNormalAtLocal(dlVertX + vertDist, dlVertY);
			const ul = this.bilinearNormalAtLocal(dlVertX, dlVertY + vertDist);
			const horLerp = ( (dl as Mut<V3>).fastLerp3(dr, fractX / (1-fractY)) as NonZero<Mut<V3>> ).norm3();
			return ( (horLerp as Mut<V3>).fastLerp3(ul, fractY).mul3(this.heightScale) as NonZero<Mut<V3>> ).norm3();
		}
	}
}

}
