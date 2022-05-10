/*
 * Array extensions for vector and matrix operations
 */

/* Vectors */

type V2 = [number, number];
type V3 = [number, number, number];
type V4 = [number, number, number, number];

function new3():V3 {
	return [0, 0, 0];
}
function new4():V4 {
	return [0, 0, 0, 0];
}

/** Performs bilinear interpolation between four {@link V3}'s.
 * @remarks Will extrapolate results when x or y is outside [0, 1[.
 * @param x - An x value normalized from [0, 1[.
 * @param y - A y value normalized to [0, 1[.
 * @param ulVal - The down-left value.
 * @param urVal - The down-right value.
 * @param dlVal - The up-left value.
 * @param drVal - The up-right value.
 */
function bilinear3(x:number, y:number, dlVal:V3, drVal:V3, ulVal:V3, urVal:V3):Engine.Mut<V3> {
	const ulMul = (1-x) * (1-y);
	const urMul = x * (1-y);
	const dlMul = (1-x) * y;
	const drMul = x * y;

	return [
		dlVal[0] * ulMul + drVal[0] * urMul + ulVal[0] * dlMul + urVal[0] * drMul
		, dlVal[1] * ulMul + drVal[1] * urMul + ulVal[1] * dlMul + urVal[1] * drMul
		, dlVal[2] * ulMul + drVal[2] * urMul + ulVal[2] * dlMul + urVal[2] * drMul
	] as Engine.Mut<V3>;
}

function extendArray(fnName:string, fn:Function) {
	Object.defineProperty(Array.prototype, fnName, {value: fn});
}

interface Array<T> {
	copy3(this:V3|V4):Engine.Mut<V3>;
	/** Copies a V3 as a V4 with w = 1 */
	copy3As4(this:V3):Engine.Mut<V4>;
	copy4(this:V4):Engine.Mut<V4>;
	set3<R extends V3|V4>(this:Engine.Mut<R>, o:V3|V4):Engine.Mut<R>;
	set4(this:Engine.Mut<V4>, o:V4):Engine.Mut<V4>;
	neg3<R extends V3|V4>(this:Engine.Mut<R>):Engine.Mut<R>;
	neg4(this:Engine.Mut<V4>):Engine.Mut<V4>;
	add3<R extends V3|V4>(this:Engine.Mut<R>, o:V3|V4):Engine.Mut<R>;
	add4(this:Engine.Mut<V4>, o:V4):Engine.Mut<V4>;
	sub3<R extends V3|V4>(this:Engine.Mut<R>, o:V3|V4):Engine.Mut<R>;
	sub4(this:Engine.Mut<V4>, o:V4):Engine.Mut<V4>;
	mul3<R extends V3|V4>(this:Engine.Mut<R>, s:number):Engine.Mut<R>;
	mul3<R extends V3|V4>(this:Engine.Mut<R>, o:V3|V4):Engine.Mut<R>;
	mul4(this:Engine.Mut<V4>, s:number):Engine.Mut<V4>;
	mul4(this:Engine.Mut<V4>, o:V4):Engine.Mut<V4>;
	div3<R extends V3|V4>(this:Engine.Mut<R>, o:Engine.NonZero<number>):Engine.Mut<R>;
	div3<R extends V3|V4>(this:Engine.Mut<R>, o:Engine.NonZero<V3>|Engine.NonZero<V4>):Engine.Mut<R>;
	div4(this:Engine.Mut<V4>, o:number):Engine.Mut<V4>;
	div4(this:Engine.Mut<V4>, o:V4):Engine.Mut<V4>;
	dot3(this:V3|V4, o:V3|V4):number;
	magSq3(this:V3|V4):number;
	mag3(this:V3|V4):number;
	norm3<R extends V3|V4>(this:Engine.NonZero<Engine.Mut<R>>):Engine.NonZero<Engine.Mut<R>>;
	normOrZero3<R extends V3|V4>(this:Engine.Mut<R>):Engine.Mut<R>;
	cross3<R extends V3|V4>(this:Engine.Mut<R>, o:V3|V4):Engine.Mut<R>;
	fastLerp3<R extends V3|V4>(this:Engine.Mut<R>, o:V3|V4, weight:number):Engine.Mut<R>;
	fastLerp4(this:Engine.Mut<V4>, o:V4, weight:number):Engine.Mut<V4>;
}

extendArray("copy3", function (this:V3|V4):V3 {
	return [this[0], this[1], this[2]];
});
extendArray("copy3As4", function (this:V3):V4 {
	return [this[0], this[1], this[2], 1];
});
extendArray("copy4", function (this:V4):V4 {
	return [this[0], this[1], this[2], this[3]];
});
extendArray("set3", function <R extends V3|V4>(this:R, o:V3|V4):R {
	this[0] = o[0];
	this[1] = o[1];
	this[2] = o[2];
	return this;
});
extendArray("set4", function (this:V4, o:V4):V4 {
	this[0] = o[0];
	this[1] = o[1];
	this[2] = o[2];
	this[3] = o[3];
	return this;
});

extendArray("neg3", function <R extends V3|V4>(this:R):R {
	this[0] = -this[0];
	this[1] = -this[1];
	this[2] = -this[2];
	return this;
});
extendArray("neg4", function (this:V4):V4 {
	this[0] = -this[0];
	this[1] = -this[1];
	this[2] = -this[2];
	this[3] = -this[3];
	return this;
});

extendArray("add3", function <R extends V3|V4>(this:R, o:V3|V4):R {
	this[0] += o[0];
	this[1] += o[1];
	this[2] += o[2];
	return this;
});
extendArray("add4", function (this:V4, o:V4):V4 {
	this[0] += o[0];
	this[1] += o[1];
	this[2] += o[2];
	this[3] += o[3];
	return this;
});

extendArray("sub3", function <R extends V3|V4>(this:R, o:V3|V4):R {
	this[0] -= o[0];
	this[1] -= o[1];
	this[2] -= o[2];
	return this;
});
extendArray("sub4", function (this:V4, o:V4):V4 {
	this[0] -= o[0];
	this[1] -= o[1];
	this[2] -= o[2];
	this[3] -= o[3];
	return this;
});

extendArray("mul3", function <R extends V3|V4>(this:R, o:V3|V4|number):R {
	if (typeof o === "number") {
		this[0] *= o;
		this[1] *= o;
		this[2] *= o;
	} else {
		this[0] *= o[0];
		this[1] *= o[1];
		this[2] *= o[2];
	}
	return this;
});
extendArray("mul4", function (this:V4, o:V4|number):V4 {
	if (typeof o === "number") {
		this[0] *= o;
		this[1] *= o;
		this[2] *= o;
		this[3] *= o;
	} else {
		this[0] *= o[0];
		this[1] *= o[1];
		this[2] *= o[2];
		this[3] *= o[3];
	}
	return this;
});

extendArray("div3", function <R extends V3|V4>(this:R, o:V3|V4|number):R {
	if (typeof o === "number") {
		this[0] /= o;
		this[1] /= o;
		this[2] /= o;
	} else {
		this[0] /= o[0];
		this[1] /= o[1];
		this[2] /= o[2];
	}
	return this;
});
extendArray("div4", function (this:V4, o:V4|number):V4 {
	if (typeof o === "number") {
		this[0] /= o;
		this[1] /= o;
		this[2] /= o;
		this[3] /= o;
	} else {
		this[0] /= o[0];
		this[1] /= o[1];
		this[2] /= o[2];
		this[3] /= o[3];
	}
	return this;
});

extendArray("dot3", function (this:V3|V4, o:V3|V4):number {
	return this[0] * o[0]
	+ this[1] * o[1]
	+ this[2] * o[2];
});

extendArray("magSq3", function (this:V3|V4):number {
	return this.dot3(this);
});
extendArray("mag3", function (this:V3|V4):number {
	return Math.sqrt(this.magSq3());
});

extendArray("norm3", function <R extends V3|V4>(this:R):R {
	const magRcp = 1/this.mag3();
	this[0] *= magRcp;
	this[1] *= magRcp;
	this[2] *= magRcp;
	return this;
});
extendArray("normOrZero3", function <R extends V3|V4>(this:R):R {
	const mag = this.mag3();
	const magRcp = mag !== 0 ? 1/mag : 0;
	this[0] *= magRcp;
	this[1] *= magRcp;
	this[2] *= magRcp;
	return this;
});

extendArray("cross3", function <R extends V3|V4>(this:R, o:V3|V4):R {
	const oldX = this[0];
	const oldY = this[1];
	this[0] = this[1]*o[2] - this[2]*o[1];
	this[1] = this[2]*o[0] -    oldX*o[2];
	this[2] =    oldX*o[1] -    oldY*o[0];
	return this;
});

extendArray("fastLerp3", function <R extends V3|V4>(this:R, o:V3|V4, weight:number):R {
	this[0] = Engine.fastLerp(this[0], o[0], weight);
	this[1] = Engine.fastLerp(this[1], o[1], weight);
	this[2] = Engine.fastLerp(this[2], o[2], weight);
	return this;
});
extendArray("fastLerp4", function (this:V4, o:V4, weight:number):V4 {
	this[0] = Engine.fastLerp(this[0], o[0], weight);
	this[1] = Engine.fastLerp(this[1], o[1], weight);
	this[2] = Engine.fastLerp(this[2], o[2], weight);
	this[3] = Engine.fastLerp(this[3], o[3], weight);
	return this;
});

/* Matrices */

type M3 = [number, number, number,
           number, number, number,
           number, number, number];
type M43 = [number, number, number,
            number, number, number,
            number, number, number,
            number, number, number];
type M4 = [number, number, number, number,
           number, number, number, number,
           number, number, number, number,
           number, number, number, number];

function identityM4():Engine.Mut<M4> {
	return [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	] as Engine.Mut<M4>;
}

function viewM4(pos:V3, rot:V3):Engine.Mut<M4> {
	// const viewM = invEulerXformationM4(rot);
	// [viewM[12], viewM[13], viewM[14]] = pos.basedV3M4(viewM).neg3();
	return invEulerXformationM4(rot, pos);
}

function perspM4(zNear:number, zFar:number, hFovRad:number, fovRatio:number):Engine.Mut<M4> {
	// zClip = z'/-z
	// z' = az + b
	// when z = -zNear: zClip = -1, z' =  z
	// 	-zNear = -a*zNear + b
	// when z =  -zFar: zClip =  1, z' = -z
	// 	  zFar = -a*zFar  + b
	// -zNear - zFar = a(zFar - zNear)
	// a = (zNear + zFar) / (zNear - zFar)
	// b = zFar + a*zFar
	const zScalar = (zNear + zFar) / (zNear - zFar);
	// zNear is negative of the z value that should map to -1.
	// -zNear * zScalar + b = -1
	// -zNear * -2 / (zFar + zNear) + b = -1
	// b = zNear * -2 / (zFar + zNear) - 1
	const zOffset = zFar * zScalar + zFar;
	// x' = a * x
	// F = hFovRads * 0.5
	// when x =  z*sinF/cosF, x' = z
	// a * x = 1
	// a * (z*sinF/cosF) = z
	// a * sinF/cosF) = 1
	// a = cosF/sinF
	const xScalar = 1/Math.tan(hFovRad*0.5);
	const yScalar = xScalar * fovRatio;
	return [
		xScalar,       0,       0,  0,
		      0, yScalar,       0,  0,
		      0,       0, zScalar, -1,
		      0,       0, zOffset,  0,
	] as Engine.Mut<M4>;
}

function eulerBasis(rot:V3):Engine.Mut<M3> {
	const cosX = Math.cos(rot[0]), cosY = Math.cos(rot[1]), cosZ = Math.cos(rot[2])
	    , sinX = Math.sin(rot[0]), sinY = Math.sin(rot[1]), sinZ = Math.sin(rot[2]);

	return [
		cosY*cosZ + sinY*sinX*sinZ, cosX*sinZ, cosY*sinX*sinZ - sinY*cosZ,
		sinY*sinX*cosZ - cosY*sinZ, cosX*cosZ, sinY*sinZ + cosY*sinX*cosZ,
		                 sinY*cosX,     -sinX,                  cosY*cosX,
	] as Engine.Mut<M3>;
}
function eulerXformationM43(rot:V3, translate:V3 = [0,0,0]):Engine.Mut<M43> {
	const cosX = Math.cos(rot[0]), cosY = Math.cos(rot[1]), cosZ = Math.cos(rot[2])
	    , sinX = Math.sin(rot[0]), sinY = Math.sin(rot[1]), sinZ = Math.sin(rot[2]);

	return [
		cosY*cosZ + sinY*sinX*sinZ,    cosX*sinZ, cosY*sinX*sinZ - sinY*cosZ,
		sinY*sinX*cosZ - cosY*sinZ,    cosX*cosZ, sinY*sinZ + cosY*sinX*cosZ,
		                 sinY*cosX,        -sinX,                  cosY*cosX,
		              translate[0], translate[1],               translate[2],
	] as Engine.Mut<M43>;
}
function eulerXformationM4(rot:V3, translate:V3 = [0,0,0]):Engine.Mut<M4> {
	const cosX = Math.cos(rot[0]), cosY = Math.cos(rot[1]), cosZ = Math.cos(rot[2])
	    , sinX = Math.sin(rot[0]), sinY = Math.sin(rot[1]), sinZ = Math.sin(rot[2]);

	return [
		cosY*cosZ + sinY*sinX*sinZ,    cosX*sinZ, cosY*sinX*sinZ - sinY*cosZ, 0,
		sinY*sinX*cosZ - cosY*sinZ,    cosX*cosZ, sinY*sinZ + cosY*sinX*cosZ, 0,
		                 sinY*cosX,        -sinX,                  cosY*cosX, 0,
		              translate[0], translate[1],               translate[2], 1,
	] as Engine.Mut<M4>;
	// // z rot
	//  cosZ, sinZ, 0,
	// -sinZ, cosZ, 0,
	//     0,    0, 1,
	//
	// // x rot
	// 1,     0,    0,
	// 0,  cosX, sinX,
	// 0, -sinX, cosX,
	//
	// // x * z
	//  cosZ, cosX*sinZ, sinX*sinZ,
	// -sinZ, cosX*cosZ, sinX*cosZ,
	//     0,     -sinX,      cosX,
	//
	// // y rot
	// cosY, 0, -sinY,
	//    0, 1,     0,
	// sinY, 0,  cosY,
	//
	// // y * x * z
	// cosY*cosZ + sinY*sinX*sinZ, cosX*sinZ, cosY*sinX*sinZ - sinY*cosZ,
	// sinY*sinX*cosZ - cosY*sinZ, cosX*cosZ, sinY*sinZ + cosY*sinX*cosZ,
	//                  sinY*cosX,     -sinX,                  cosY*cosX,
}

function invEulerBasis(rot:V3):Engine.Mut<M3> {
	const cosX = Math.cos(rot[0]),  cosY = Math.cos(rot[1]),  cosZ = Math.cos(rot[2])
	    , sinX = Math.sin(-rot[0]), sinY = Math.sin(-rot[1]), sinZ = Math.sin(-rot[2]);

	return [
		cosZ*cosY - sinZ*sinX*sinY, sinZ*cosY + cosZ*sinX*sinY, -cosX*sinY,
		                -sinZ*cosX,                  cosZ*cosX,       sinX,
		cosZ*sinY + sinZ*sinX*cosY, sinZ*sinY - cosZ*sinX*cosY,  cosX*cosY,
	] as Engine.Mut<M3>;
}
function invEulerXformationM43(rot:V3, translate:V3 = [0,0,0]):Engine.Mut<M43> {
	const cosX = Math.cos(rot[0]),  cosY = Math.cos(rot[1]),  cosZ = Math.cos(rot[2])
	    , sinX = Math.sin(-rot[0]), sinY = Math.sin(-rot[1]), sinZ = Math.sin(-rot[2]);

	const inv = [
		cosZ*cosY - sinZ*sinX*sinY, sinZ*cosY + cosZ*sinX*sinY, -cosX*sinY,
		                -sinZ*cosX,                  cosZ*cosX,       sinX,
		cosZ*sinY + sinZ*sinX*cosY, sinZ*sinY - cosZ*sinX*cosY,  cosX*cosY,
		                         0,                          0,          0,
	] as Engine.Mut<M43>;
	const xformedTranslate = translate.basedV3M43(inv);
	inv[9] = -xformedTranslate[0];
	inv[10] = -xformedTranslate[1];
	inv[11] = -xformedTranslate[2];
	return inv;
}
function invEulerXformationM4(rot:V3, translate:V3 = [0,0,0]):Engine.Mut<M4> {
	const cosX = Math.cos(rot[0]),  cosY = Math.cos(rot[1]),  cosZ = Math.cos(rot[2])
	    , sinX = Math.sin(-rot[0]), sinY = Math.sin(-rot[1]), sinZ = Math.sin(-rot[2]);

	const inv = [
		cosZ*cosY - sinZ*sinX*sinY, sinZ*cosY + cosZ*sinX*sinY, -cosX*sinY, 0,
		                -sinZ*cosX,                  cosZ*cosX,       sinX, 0,
		cosZ*sinY + sinZ*sinX*cosY, sinZ*sinY - cosZ*sinX*cosY,  cosX*cosY, 0,
		                         0,                          0,          0, 1,
	] as Engine.Mut<M4>;
	const xformedTranslate = translate.basedV3M4(inv);
	inv[12] = -xformedTranslate[0];
	inv[13] = -xformedTranslate[1];
	inv[14] = -xformedTranslate[2];
	return inv;
	// // y rot
	// cosY, 0, -sinY,
	//    0, 1,     0,
	// sinY, 0,  cosY,
	//
	// // x rot
	// 1,     0,    0,
	// 0,  cosX, sinX,
	// 0, -sinX, cosX,
	//
	// // x * y
	// cosY,  sinX*sinY, -cosX*sinY,
	//    0,       cosX,       sinX,
	// sinY, -sinX*cosY,  cosX*cosY,
	//
	// // z rot
	//  cosZ, sinZ, 0,
	// -sinZ, cosZ, 0,
	//     0,    0, 1,
	//
	// // z * x * y
	// cosZ*cosY - sinZ*sinX*sinY, sinZ*cosY + cosZ*sinX*sinY, -cosX*sinY,
	//                 -sinZ*cosX,                  cosZ*cosX,       sinX,
	// cosZ*sinY + sinZ*sinX*cosY, sinZ*sinY - cosZ*sinX*cosY,  cosX*cosY,
}

function newM4():Engine.Mut<M4> {
	return [
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
	] as Engine.Mut<M4>;
}

interface Array<T> {
	xformedM4(this:M4, o:M4):Engine.Mut<M4>;
	xposeM4(this:Engine.Mut<M4>):this;
}

extendArray("xformedM4", function (this:M4, o:M4):M4 {
	const res = newM4();

	for (let y = 0; y < 4; ++y) {
		for (let x = 0; x < 4; ++x) {
			res[y*4 + x]
			=      this[x]! * o[y*4]!
			+  this[4 + x]! * o[y*4 + 1]!
			+  this[8 + x]! * o[y*4 + 2]!
			+ this[12 + x]! * o[y*4 + 3]!;
		}
	}

	return res;
});

extendArray("xposeM4", function (this:Engine.Mut<M4>):Engine.Mut<M4> {
	for (let y = 0; y < 4; ++y) {
		const yRow = y*4;
		for (let x = y; x < 4; ++x) {
			const a = yRow + x;
			const b = x*4 + y;
			const t = this[a]!;
			this[a] = this[b]!;
			this[b] = t;
		}
	}
	return this;
});

interface Array<T> {
	/** Returns a transformed V3 using a basis matrix */
	basedV3(this:V3|V4, m:M3):Engine.Mut<V3>;
	/** Returns a transformed V4 using a basis matrix */
	basedV4(this:V4, m:M3):Engine.Mut<V4>;
	/** Returns a transformed V3 using the basis component of an M43 */
	basedV3M43(this:V3|V4, m:M43):Engine.Mut<V3>;
	/** Returns a transformed V3 using the basis component of an M4 */
	basedV3M4(this:V3|V4, m:M4):Engine.Mut<V3>;
	/** Returns a transformed V4 using the basis component of an M4 */
	basedV4M4(this:V4, m:M4):Engine.Mut<V4>;
	/** Returns a transformed V3 as though w == 1 */
	xformedHomV3M4(this:V3|V4, m:M4):Engine.Mut<V3>;
	/** Returns a transformed V3 as though w == 1 */
	xformedHomV3M43(this:V3|V4, m:M43):Engine.Mut<V3>;
	xformedV4M4(this:V4, m:M4):Engine.Mut<V4>;
}

extendArray("basedV3", function (this:V3|V4, m:M3):V3 {
	return [
		this[0] * m[0] + this[1] * m[3] + this[2] * m[6],
		this[0] * m[1] + this[1] * m[4] + this[2] * m[7],
		this[0] * m[2] + this[1] * m[5] + this[2] * m[8],
	];
});

extendArray("basedV4", function (this:V4, m:M3):V4 {
	return [
		this[0] * m[0] + this[1] * m[3] + this[2] * m[6],
		this[0] * m[1] + this[1] * m[4] + this[2] * m[7],
		this[0] * m[2] + this[1] * m[5] + this[2] * m[8],
		this[3],
	];
});
extendArray("basedV3M43", function (this:V3|V4, m:M43):V3 {
	return [
		this[0] * m[0] + this[1] * m[4] + this[2] *  m[8],
		this[0] * m[1] + this[1] * m[5] + this[2] *  m[9],
		this[0] * m[2] + this[1] * m[6] + this[2] * m[10],
	];
});
extendArray("basedV3M4", function (this:V3|V4, m:M4):V3 {
	return [
		this[0] * m[0] + this[1] * m[4] + this[2] *  m[8],
		this[0] * m[1] + this[1] * m[5] + this[2] *  m[9],
		this[0] * m[2] + this[1] * m[6] + this[2] * m[10],
	];
});
extendArray("basedV4M4", function (this:V4, m:M4):V4 {
	return [
		this[0] * m[0] + this[1] * m[4] + this[2] *  m[8],
		this[0] * m[1] + this[1] * m[5] + this[2] *  m[9],
		this[0] * m[2] + this[1] * m[6] + this[2] * m[10],
		this[3],
	];
});

extendArray("xformedHomV3M4", function (this:V3|V4, m:M4):V3 {
	return [
		this[0] * m[0] + this[1] * m[4] + this[2] *  m[8] + m[12],
		this[0] * m[1] + this[1] * m[5] + this[2] *  m[9] + m[13],
		this[0] * m[2] + this[1] * m[6] + this[2] * m[10] + m[14],
	];
});
extendArray("xformedHomV3M43", function (this:V3|V4, m:M43):V3 {
	return [
		this[0] * m[0] + this[1] * m[3] + this[2] * m[6] + m[9],
		this[0] * m[1] + this[1] * m[4] + this[2] * m[7] + m[10],
		this[0] * m[2] + this[1] * m[5] + this[2] * m[8] + m[11],
	];
});
extendArray("xformedV4M4", function (this:V4, m:M4):V4 {
	return [
		this[0] * m[0] + this[1] * m[4] + this[2] *  m[8] + this[3] * m[12],
		this[0] * m[1] + this[1] * m[5] + this[2] *  m[9] + this[3] * m[13],
		this[0] * m[2] + this[1] * m[6] + this[2] * m[10] + this[3] * m[14],
		this[0] * m[3] + this[1] * m[7] + this[2] * m[11] + this[3] * m[15],
	];
});
