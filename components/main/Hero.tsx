'use client';

import React, { useEffect, useRef, ReactNode } from 'react';

export type AetherHeroProps = {
    title?: ReactNode;
    subtitle?: ReactNode;
    ctaLabel?: string;
    ctaHref?: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
    overlayGradient?: string;
    textColor?: string;
    fragmentSource?: string;
    dprMax?: number;
    clearColor?: [number, number, number, number];
    height?: string | number;
    className?: string;
    ariaLabel?: string;
    children?: ReactNode;
};

const DEFAULT_FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define S smoothstep
#define MN min(R.x,R.y)
float pattern(vec2 uv) {
  float d=.0;
  for (float i=.0; i<3.; i++) {
    uv.x+=sin(T*(1.+i)+uv.y*1.5)*.2;
    d+=.005/abs(uv.x);
  }
  return d;	
}
vec3 scene(vec2 uv) {
  vec3 col=vec3(0);
  uv=vec2(atan(uv.x,uv.y)*2./6.28318,-log(length(uv))+T);
  for (float i=.0; i<3.; i++) {
    int k=int(mod(i,3.));
    col[k]+=pattern(uv+i*6./MN);
  }
  return col;
}
void main() {
  vec2 uv=(FC-.5*R)/MN;
  vec3 col=vec3(0);
  float s=12., e=9e-4;
  col+=e/(sin(uv.x*s)*cos(uv.y*s));
  uv.y+=R.x>R.y?.5:.5*(R.y/R.x);
  col+=scene(uv);
  O=vec4(col,1.);
}`;

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 position;
void main(){ gl_Position = vec4(position, 0.0, 1.0); }
`;

export default function AetherHero({
    title = 'Make the impossible feel inevitable.',
    subtitle = 'A minimal hero with a living shader background.',
    ctaLabel = 'Get Started',
    ctaHref = '#',
    secondaryCtaLabel,
    secondaryCtaHref,
    align = 'center',
    maxWidth = 960,
    overlayGradient = 'linear-gradient(180deg, #00000099, #00000040 40%, transparent)',
    fragmentSource = DEFAULT_FRAG,
    dprMax = 2,
    clearColor = [0, 0, 0, 1],
    height = '100vh',
    className = '',
    ariaLabel = 'Aurora hero background',
    children,
}: AetherHeroProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const bufRef = useRef<WebGLBuffer | null>(null);
    const uniTimeRef = useRef<WebGLUniformLocation | null>(null);
    const uniResRef = useRef<WebGLUniformLocation | null>(null);
    const rafRef = useRef<number | null>(null);

    const compileShader = (gl: WebGL2RenderingContext, src: string, type: number) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(sh) || 'Unknown shader error';
            gl.deleteShader(sh);
            throw new Error(info);
        }
        return sh;
    };

    const createProgram = (gl: WebGL2RenderingContext, vs: string, fs: string) => {
        const v = compileShader(gl, vs, gl.VERTEX_SHADER);
        const f = compileShader(gl, fs, gl.FRAGMENT_SHADER);
        const prog = gl.createProgram()!;
        gl.attachShader(prog, v);
        gl.attachShader(prog, f);
        gl.linkProgram(prog);
        gl.deleteShader(v);
        gl.deleteShader(f);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(prog) || 'Program link error';
            gl.deleteProgram(prog);
            throw new Error(info);
        }
        return prog;
    };

    useEffect(() => {
        const canvas = canvasRef.current!;
        const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
        if (!gl) return;

        let prog: WebGLProgram;
        try {
            prog = createProgram(gl, VERT_SRC, fragmentSource);
        } catch (e) {
            console.error(e);
            return;
        }
        programRef.current = prog;

        const verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
        const buf = gl.createBuffer()!;
        bufRef.current = buf;
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

        gl.useProgram(prog);
        const posLoc = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        uniTimeRef.current = gl.getUniformLocation(prog, 'time');
        uniResRef.current = gl.getUniformLocation(prog, 'resolution');

        gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

        const fit = () => {
            const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, dprMax));
            const rect = canvas.getBoundingClientRect();
            const cssW = Math.max(1, rect.width);
            const cssH = Math.max(1, rect.height);
            const W = Math.floor(cssW * dpr);
            const H = Math.floor(cssH * dpr);
            if (canvas.width !== W || canvas.height !== H) {
                canvas.width = W;
                canvas.height = H;
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
        };
        fit();

        const ro = new ResizeObserver(fit);
        ro.observe(canvas);
        window.addEventListener('resize', fit);

        const loop = (now: number) => {
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(prog);
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            if (uniResRef.current) gl.uniform2f(uniResRef.current, canvas.width, canvas.height);
            if (uniTimeRef.current) gl.uniform1f(uniTimeRef.current, now * 1e-3);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', fit);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (bufRef.current) gl.deleteBuffer(bufRef.current);
            if (programRef.current) gl.deleteProgram(programRef.current);
        };
    }, [fragmentSource, dprMax, clearColor]);

    const alignClass = align === 'left' ? 'items-start text-left' : align === 'right' ? 'items-end text-right' : 'items-center text-center';

    return (
        <section
            className={`aurora-hero relative overflow-hidden ${className}`}
            style={{ height }}
            aria-label="Hero"
        >
            {/* Shader canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block select-none touch-none"
                role="img"
                aria-label={ariaLabel}
            />



            {/* Content layer */}
            <div className={`relative z-10 h-full flex ${alignClass} justify-center p-6 md:p-16 text-white`}>
                <div className="w-full" style={{ maxWidth }}>
                    <h1 className="m-0 text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight font-normal drop-shadow-2xl" style={{ fontFamily: "'Indie Flower', cursive" }}>
                        {title}
                    </h1>

                    {subtitle && (
                        <p className="mt-4 text-sm md:text-base leading-relaxed opacity-80 drop-shadow-lg max-w-2xl mx-auto font-extralight">
                            {subtitle}
                        </p>
                    )}

                    {(ctaLabel || secondaryCtaLabel) && (
                        <div className="inline-flex gap-3 mt-8 flex-wrap">
                            {ctaLabel && (
                                <a
                                    href={ctaHref}
                                    className="px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white no-underline font-normal border border-white/30 shadow-lg transition-all hover:bg-white/20 hover:scale-105"
                                >
                                    {ctaLabel}
                                </a>
                            )}

                            {secondaryCtaLabel && (
                                <a
                                    href={secondaryCtaHref}
                                    className="px-5 py-3 rounded-xl bg-transparent text-white/85 no-underline font-normal border border-white/30 transition-all hover:text-white hover:bg-white/10"
                                >
                                    {secondaryCtaLabel}
                                </a>
                            )}
                        </div>
                    )}

                    {children}
                </div>
            </div>
        </section>
    );
}

export { AetherHero };
