type V2 = [number, number];
type V3 = [number, number, number];
type V4 = [number, number, number, number];
declare function new3(): V3;
declare function new4(): V4;
declare function bilinear3(x: number, y: number, dlVal: V3, drVal: V3, ulVal: V3, urVal: V3): Engine.Mut<V3>;
declare function extendArray(fnName: string, fn: Function): void;
interface Array<T> {
    copy3(this: V3 | V4): Engine.Mut<V3>;
    copy3As4(this: V3): Engine.Mut<V4>;
    copy4(this: V4): Engine.Mut<V4>;
    set3<R extends V3 | V4>(this: Engine.Mut<R>, o: V3 | V4): Engine.Mut<R>;
    set4(this: Engine.Mut<V4>, o: V4): Engine.Mut<V4>;
    neg3<R extends V3 | V4>(this: Engine.Mut<R>): Engine.Mut<R>;
    neg4(this: Engine.Mut<V4>): Engine.Mut<V4>;
    add3<R extends V3 | V4>(this: Engine.Mut<R>, o: V3 | V4): Engine.Mut<R>;
    add4(this: Engine.Mut<V4>, o: V4): Engine.Mut<V4>;
    sub3<R extends V3 | V4>(this: Engine.Mut<R>, o: V3 | V4): Engine.Mut<R>;
    sub4(this: Engine.Mut<V4>, o: V4): Engine.Mut<V4>;
    mul3<R extends V3 | V4>(this: Engine.Mut<R>, s: number): Engine.Mut<R>;
    mul3<R extends V3 | V4>(this: Engine.Mut<R>, o: V3 | V4): Engine.Mut<R>;
    mul4(this: Engine.Mut<V4>, s: number): Engine.Mut<V4>;
    mul4(this: Engine.Mut<V4>, o: V4): Engine.Mut<V4>;
    div3<R extends V3 | V4>(this: Engine.Mut<R>, o: Engine.NonZero<number>): Engine.Mut<R>;
    div3<R extends V3 | V4>(this: Engine.Mut<R>, o: Engine.NonZero<V3> | Engine.NonZero<V4>): Engine.Mut<R>;
    div4(this: Engine.Mut<V4>, o: number): Engine.Mut<V4>;
    div4(this: Engine.Mut<V4>, o: V4): Engine.Mut<V4>;
    dot3(this: V3 | V4, o: V3 | V4): number;
    magSq3(this: V3 | V4): number;
    mag3(this: V3 | V4): number;
    norm3<R extends V3 | V4>(this: Engine.NonZero<Engine.Mut<R>>): Engine.NonZero<Engine.Mut<R>>;
    normOrZero3<R extends V3 | V4>(this: Engine.Mut<R>): Engine.Mut<R>;
    cross3<R extends V3 | V4>(this: Engine.Mut<R>, o: V3 | V4): Engine.Mut<R>;
    fastLerp3<R extends V3 | V4>(this: Engine.Mut<R>, o: V3 | V4, weight: number): Engine.Mut<R>;
    fastLerp4(this: Engine.Mut<V4>, o: V4, weight: number): Engine.Mut<V4>;
}
type M3 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
type M43 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
type M4 = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
declare function identityM4(): Engine.Mut<M4>;
declare function viewM4(pos: V3, rot: V3): Engine.Mut<M4>;
declare function perspM4(zNear: number, zFar: number, hFovRad: number, fovRatio: number): Engine.Mut<M4>;
declare function eulerBasis(rot: V3): Engine.Mut<M3>;
declare function eulerXformationM43(rot: V3, translate?: V3): Engine.Mut<M43>;
declare function eulerXformationM4(rot: V3, translate?: V3): Engine.Mut<M4>;
declare function invEulerBasis(rot: V3): Engine.Mut<M3>;
declare function invEulerXformationM43(rot: V3, translate?: V3): Engine.Mut<M43>;
declare function invEulerXformationM4(rot: V3, translate?: V3): Engine.Mut<M4>;
declare function newM4(): Engine.Mut<M4>;
interface Array<T> {
    xformedM4(this: M4, o: M4): Engine.Mut<M4>;
    xposeM4(this: Engine.Mut<M4>): this;
}
interface Array<T> {
    basedV3(this: V3 | V4, m: M3): Engine.Mut<V3>;
    basedV4(this: V4, m: M3): Engine.Mut<V4>;
    basedV3M43(this: V3 | V4, m: M43): Engine.Mut<V3>;
    basedV3M4(this: V3 | V4, m: M4): Engine.Mut<V3>;
    basedV4M4(this: V4, m: M4): Engine.Mut<V4>;
    xformedHomV3M4(this: V3 | V4, m: M4): Engine.Mut<V3>;
    xformedHomV3M43(this: V3 | V4, m: M43): Engine.Mut<V3>;
    xformedV4M4(this: V4, m: M4): Engine.Mut<V4>;
}
declare namespace Engine.Gfx {
    let gl: WebGL2RenderingContext;
    let ctx2d: CanvasRenderingContext2D;
    const camPos: V3;
    const camRot: V3;
    let hFovRad: number;
    let zNear: number;
    let zFar: number;
    let screenShakeStrength: number;
    const jetpackScreenShake = 0;
    const landingSpeedScreenShakeMult: number;
    const landingSpeedScreenShakeOffset = -0.375;
    const sunNorm: number[];
    const sunColor: number[];
    const ambientLight: number[];
    let vaoSets: {
        prog: WebGLProgram;
        vaoInfos: VaoInfo[];
    }[];
    function init(): Promise<void>;
    function draw(time: number): void;
    function genGroundVaoInfo(vertsPerDim: number): VaoInfo;
    function getImageData(src: Exclude<CanvasImageSource, SVGImageElement>): ImageData;
}
declare namespace Engine.Gfx {
    export interface VaoInfo {
        vao: WebGLVertexArrayObject;
        count: GLsizei;
        mode: GLenum;
        indexInfo?: {
            indexType: WebGLRenderingContextBase["UNSIGNED_BYTE"] | WebGLRenderingContextBase["UNSIGNED_SHORT"] | WebGLRenderingContextBase["UNSIGNED_INT"];
        };
        drawAction: (vaoInfo: VaoInfo) => void;
    }
    type bufferDataArgs = {
        srcData: BufferSource;
        usage: GLenum;
    } | {
        srcData: ArrayBufferView;
        usage: GLenum;
        srcOffset: GLuint;
        length?: GLuint;
    };
    type vertexAttribArgs = {
        index: GLuint;
        size: GLint;
        type: GLenum;
        normalized: GLboolean;
        stride: GLsizei;
        offset: GLintptr;
    };
    type dataAttribsGroupArgs = {
        dataArgs: bufferDataArgs;
        attribsArgs: [vertexAttribArgs, ...vertexAttribArgs[]];
    };
    type indexBufferDataType = Uint8Array | Uint16Array | Uint32Array;
    type indexBufferDataArgs = {
        srcData: indexBufferDataType;
        usage: GLenum;
    } | {
        srcData: indexBufferDataType;
        usage: GLenum;
        srcOffset: GLuint;
        length?: GLuint;
    };
    export function bindAndDrawVao(vaoInfo: VaoInfo): void;
    type textureOptions = {
        generateMipmap?: boolean;
        magFilter?: GLenum;
        minFilter?: GLenum;
        wrapS?: GLenum;
        wrapT?: GLenum;
    };
    export function loadImage(src: string): Promise<HTMLImageElement>;
    export function genAndBindTexture(src: ImageBitmapSource, internalformat: GLenum, type: GLenum, options?: textureOptions): Promise<WebGLTexture>;
    export function genAndBindTextureFrom2dArrayRGB(array2d: Array<number>, height: number, options?: textureOptions): Promise<WebGLTexture>;
    export function loadAndBindTexture(src: string, internalformat: GLenum, type: GLenum, options?: textureOptions): Promise<WebGLTexture>;
    export function makeAndBindVao(dataAttribsGroups: [dataAttribsGroupArgs, ...dataAttribsGroupArgs[]], indexBuffer: indexBufferDataArgs, mode: GLenum): VaoInfo;
    export function makeAndBindVao(dataAttribsGroups: [dataAttribsGroupArgs, ...dataAttribsGroupArgs[]], count: number, mode: GLenum): VaoInfo;
    export function makeGLProgram(vsSource: string, fsSource: string): WebGLProgram;
    export function glTypeFromTypeArray(typedArray: BasicTypedArray): number;
    export function glWrapFromWrapping(wrapping: Wrapping): GLenum;
    export function glSizeFromType(type: GLenum): GLsizei;
    export {};
}
declare namespace Engine {
    export const baseDir = "";
    export const keys: Set<string>;
    export const newKeys: Set<string>;
    export let pointerLocked: boolean;
    export let lockedPointerDX: number;
    export let lockedPointerDY: number;
    export function main(): Promise<void>;
    export let player: Player;
    export let ground: Terrain;
    class Player {
        readonly pos: V3;
        readonly rot: V3;
        readonly vel: V3;
        moveAcc: number;
        maxHorSpd: number;
        overspeedSlowdownFixedAcc: number;
        overspeedSlowdownFactorAcc: number;
        gravity: number;
        jumpSpd: number;
        jetpackAcc: number;
        spectating: boolean;
        height: number;
        grounded: boolean;
        jetpackAccMult: number;
        airAccMult: number;
        flySpd: number;
        fastFlyMul: number;
        jetpackFuelMax: number;
        jetpackFuel: number;
        jetpackFuelCostPerSec: number;
        jetpackFuelRegenPerSec: number;
        jetpackFuelRegenDelay: number;
        jetpackFuelRegenTimer: number;
        jetpackRunoutUseDelay: number;
        jetpackUseTimer: number;
        update(d: number): void;
        move(d: number): void;
    }
    class Terrain {
        private heightmapData;
        private normalmapData;
        heightmapTex: WebGLTexture;
        normalmapTex: WebGLTexture;
        topMatDiff: WebGLTexture;
        topMatNorm: WebGLTexture;
        topMatScaleRecip: number;
        sideMatDiff: WebGLTexture;
        sideMatNorm: WebGLTexture;
        sideMatScaleRecip: number;
        vaoInfo: Gfx.VaoInfo;
        readonly length: number;
        readonly heightScale: number;
        readonly res: number;
        readonly pos: V2;
        readonly wrapping: Wrapping;
        private constructor();
        static new(hmapSrc: string, topMatDiffSrc: string, topMatNormSrc: string, topMatScale: number, sideMatDiffSrc: string, sideMatNormSrc: string, sideMatScale: number, length: number, heightScale: number, res: number, pos: V2, wrapping: Wrapping): Promise<Terrain>;
        mapXFromWorldX(x: number): number;
        mapYFromWorldZ(z: number): number;
        dlTriXFromWorldX(x: number): number;
        dlTriYFromWorldZ(z: number): number;
        private bilinearHeightAtLocal;
        heightAt(x: number, z: number): number;
        private bilinearNormalAtLocal;
        normalAt(x: number, z: number): NonZero<Mut<V3>>;
        triNormalAt(x: number, z: number): NonZero<Mut<V3>>;
    }
    export {};
}
declare namespace Engine {
    type Branded = {
        __brand: any;
        __base: any;
    };
    type Brand<T, B extends string> = T extends Branded ? T["__base"] & {
        __base: T["__base"];
        __brand: (T["__brand"] & {
            [key in B]: any;
        });
    } : T & {
        __base: T;
        __brand: {
            [key in B]: any;
        };
    };
    type Unbrand<T, B extends string> = T extends Branded ? Omit<T, "__brand"> & {
        __brand: Omit<T["__brand"], B>;
    } : T;
    export type Mut<T> = Brand<T, "Mut">;
    export type Immut<T extends Mut<unknown>> = Unbrand<T, "Mut">;
    export type NonZero<T> = Brand<T, "NonZero">;
    export type Zeroable<T> = Unbrand<T, "NonZero">;
    export type NonEmpty<T> = Brand<T, "NonEmpty">;
    export type CanBeEmpty<T> = Exclude<Unbrand<T, "NonEmpty">, {
        0: T[keyof T & number];
    }>;
    export type NonJagged<T extends Array<unknown>> = Brand<T, "NonJagged">;
    export type CanBeJagged<T> = Unbrand<T, "NonJagged">;
    export type BasicTypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
    export const HALF_PI: number;
    export const PI: number;
    export const TWO_PI: number;
    export function bilinear(x: number, y: number, dlVal: number, drVal: number, ulVal: number, urVal: number): number;
    export function clamp(n: number, min: number, max: number): number;
    export function fastLerp(a: number, b: number, weight: number): number;
    export function slowLerp(a: number, b: number, weight: number): number;
    export function sq(n: number): number;
    export function handleOptions<T>(optionsObj: T, handlers: Required<{
        [k in keyof T]: (option: NonNullable<T[k]>) => unknown;
    }>): void;
    export function mod(a: number, b: number): number;
    export const enum Wrapping {
        repeat = 0,
        clamp = 1
    }
    export type WrappingArray<T> = Brand<Array<T>, "WrappingArray">;
    export function CreateWrappingArray<T>(array: T[], wrapping: Wrapping): WrappingArray<T>;
    export {};
}
