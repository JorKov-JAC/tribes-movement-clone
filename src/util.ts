/*
 * Utility types, constants, functions, etc...
*/

namespace Engine {

// "Newtype" types
type Branded = {__brand:any, __base:any};
type NoBrand<T> = T extends Branded ? T["__base"] : T;
/** Makes a "newtype" based on {@link T}. */
type Brand<T, B extends string> = T extends Branded
	// ? T["__base"] & {__base:T["__base"]} & ({__brand:T["__brand"]} & {__brand:{[key in B]:any}})
	? T["__base"] & {__base:T["__base"], __brand:(T["__brand"] & {[key in B]:any})}
	: T & {__base:T, __brand:{[key in B]:any}};
type Unbrand<T, B extends string> = T extends Branded
	? Omit<T, "__brand"> & {__brand: Omit<T["__brand"], B>}
	: T;
type Rebrand<T, B extends string> = Brand<NoBrand<T>, B>;

/** Brand indicating that this object can safely be mutated. */
// export type Mut<T> = T & {__mutable:null, base:T}
export type Mut<T> = Brand<T, "Mut">;
/** Removes the {@link Mut} brand. */
// export type Immut<T extends Mut<unknown>> = T['base']
export type Immut<T extends Mut<unknown>> = Unbrand<T, "Mut">;

/** Brand indicating that this object is non-zero. */
export type NonZero<T> = Brand<T, "NonZero">;
/** Removes the {@link NonZero} brand. */
export type Zeroable<T> = Unbrand<T, "NonZero">;

/** Brand indicating that this object is not empty. */
export type NonEmpty<T> = Brand<T, "NonEmpty">;
/** Removes the {@link NonEmpty} brand. */
export type CanBeEmpty<T> = Exclude<Unbrand<T, "NonEmpty">, {0: T[keyof T & number]}>;

/** Brand indicating that this array's members have identical lengths. */
export type NonJagged<T extends Array<unknown>> = Brand<T, "NonJagged">;
/** Removes the {@link NonJagged} brand. */
export type CanBeJagged<T> = Unbrand<T, "NonJagged">;


/** Includes all TypedArray types except the BigInt types. */
export type BasicTypedArray
	= Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array;


export const HALF_PI = .5 * Math.PI;
export const PI = Math.PI;
export const TWO_PI = 2 * Math.PI;

/** Performs bilinear interpolation between four values.
 * @remarks Will extrapolate results when {@link x} or {@link y} is outside [0, 1[.
 * @param x - An x value normalized from [0, 1[.
 * @param y - A y value normalized to [0, 1[.
 * @param dlVal - The down-left value.
 * @param drVal - The down-right value.
 * @param ulVal - The up-left value.
 * @param urVal - The up-right value.
*/
export function bilinear(x:number, y:number, dlVal:number, drVal:number, ulVal:number, urVal:number):number {
	return fastLerp(fastLerp(dlVal, drVal, x), fastLerp(ulVal, urVal, x), y);
}

export function clamp(n:number, min:number, max:number):number {
	return n <= min ? min : n >= max ? max : n;
}

/** Interpolates two values with an exact first endpoint and inexact second
 * endpoint.
 * @remarks Will extrapolate results when {@link weight} is outside [0, 1[.
*/
export function fastLerp(a:number, b:number, weight:number):number {
	return (b - a) * weight + a;
}
/** Interpolates two values with exact endpoint results.
 * @remarks Will extrapolate results when {@link weight} is outside [0, 1[.
*/
export function slowLerp(a:number, b:number, weight:number):number {
	return a * (1-weight) + b * weight;
}

/** Squares a number. */
export function sq(n:number):number {
	return n * n;
}

export function handleOptions<T>(optionsObj:T, handlers:Required<{ [k in keyof T] : (option:NonNullable<T[k]>)=>unknown }>):void {
	for (const key in optionsObj) {
		handlers[key](optionsObj[key] as NonNullable<typeof optionsObj[typeof key]>);
	}
}

export function mod(a:number, b:number):number { return (a % b + b) % b; }

export const enum Wrapping {
	repeat
	, clamp
}

export type WrappingArray<T> = Brand<Array<T>, "WrappingArray">;

export function CreateWrappingArray<T>(array:T[], wrapping:Wrapping):WrappingArray<T> {
	type WA = WrappingArray<T>;

	switch (wrapping) {
		case Wrapping.repeat:
			return <WA> new Proxy(array, {
				get: (obj, key) => {
					if (typeof key !== "string") return obj[key as any];

					const idx = Number(key);
					if (isNaN(idx)) return obj[key as any];

					return obj[mod(idx, obj.length)];
				}
			});
		case Wrapping.clamp:
			return <WA> new Proxy(array, {
				get: (obj, key) => {
					if (typeof key !== "string") return obj[key as any];

					const idx = Number(key);
					if (isNaN(idx)) return obj[key as any];

					return obj[clamp(idx, 0, obj.length - 1)];
				}
			});
	}
}

}
