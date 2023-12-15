import React, { useEffect, useRef } from "react";
import "./MyCanvas.scss";

interface Pointer {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  down: boolean;
  moved: boolean;
  color: number[];
}

interface WebGLExtensions {
  formatRGBA: { internalFormat: number; format: number } | null;
  formatRG: { internalFormat: number; format: number } | null;
  formatR: { internalFormat: number; format: number } | null;
  halfFloatTexType: number;
  supportLinearFiltering: any;
}

type FBOStructure = [WebGLTexture | null, WebGLFramebuffer | null, number];

type FBO = {
  read: FBOStructure;
  write: FBOStructure;
  swap: () => void;
};

const MyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pointers: Pointer[] = [];
  let splatStack: (number | undefined)[] = [];

  const getWebGLContext = (
    canvas: HTMLCanvasElement
  ): { gl: WebGLRenderingContext | null; ext: WebGLExtensions | null } => {
    const params = {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
    };

    const gl = (canvas.getContext("webgl2", params) ||
      canvas.getContext("webgl", params) ||
      canvas.getContext("experimental-webgl", params)) as WebGLRenderingContext;

    if (!gl) {
      console.error("WebGL not supported, falling back on experimental-webgl");
      return { gl: null, ext: null };
    }

    const isWebGL2 = gl instanceof WebGL2RenderingContext;

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    } else {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2
      ? (gl.HALF_FLOAT as number)
      : (halfFloat && halfFloat.HALF_FLOAT_OES) || 0;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
      formatRGBA = getSupportedFormat(
        gl,
        gl.RGBA16F,
        gl.RGBA,
        halfFloatTexType
      );
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    } else {
      formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
      formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }

    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  };

  function getSupportedFormat(
    gl: WebGLRenderingContext,
    internalFormat: number,
    format: number,
    type: number
  ) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
      switch (internalFormat) {
        case (gl as any).R16F:
          return getSupportedFormat(
            gl,
            (gl as any).RG16F,
            (gl as any).RG,
            type
          );
        case (gl as any).RG16F:
          return getSupportedFormat(
            gl,
            (gl as any).RGBA16F,
            (gl as any).RGBA,
            type
          );
        default:
          return null;
      }
    }

    return {
      internalFormat,
      format,
    };
  }

  function supportRenderTextureFormat(
    gl: WebGLRenderingContext,
    internalFormat: number,
    format: number,
    type: number
  ) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      4,
      4,
      0,
      format,
      type,
      null
    );

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) return false;
    return true;
  }

  class PointerPrototype implements Pointer {
    id = -1;
    x = 0;
    y = 0;
    dx = 0;
    dy = 0;
    down = false;
    moved = false;
    color = [30, 0, 300];
  }

  class GLProgram {
    private program: WebGLProgram | null;
    public uniforms: { [uniformName: string]: WebGLUniformLocation | null } =
      {};

    constructor(
      private gl: WebGLRenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ) {
      this.program = this.gl.createProgram();

      if (!this.program) {
        throw new Error("Unable to create WebGL program.");
      }

      this.gl.attachShader(this.program, vertexShader);
      this.gl.attachShader(this.program, fragmentShader);
      this.gl.linkProgram(this.program);

      if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
        throw new Error(
          "Failed to link WebGL program: " +
            this.gl.getProgramInfoLog(this.program)
        );
      }

      const uniformCount = this.gl.getProgramParameter(
        this.program,
        this.gl.ACTIVE_UNIFORMS
      );
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = this.gl.getActiveUniform(this.program, i);
        if (uniformInfo) {
          const uniformName = uniformInfo.name;
          this.uniforms[uniformName] = this.gl.getUniformLocation(
            this.program,
            uniformName
          );
        }
      }
    }

    bind() {
      if (this.program) {
        this.gl.useProgram(this.program);
      }
    }
  }

  let divergence: FBO;

  useEffect(() => {
    const canvas = canvasRef.current;

    console.log("canvas :>> ", canvas);

    if (!canvas) return;

    const { gl, ext } = getWebGLContext(canvas);

    function createCurlFBO(
      texId: number,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number
    ): FBO {
      let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(
        texId + 1,
        w,
        h,
        internalFormat,
        format,
        type,
        param
      );

      return {
        read: fbo1,
        write: fbo2,
        swap: () => {
          let temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    }

    function createFBO(
      texId: number,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number
    ): FBOStructure {
      (gl as WebGLRenderingContext).activeTexture(
        (gl as WebGLRenderingContext).TEXTURE0 + texId
      );
      let texture = (gl as WebGLRenderingContext).createTexture();
      (gl as WebGLRenderingContext).bindTexture(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        texture
      );
      (gl as WebGLRenderingContext).texParameteri(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        (gl as WebGLRenderingContext).TEXTURE_MIN_FILTER,
        param
      );
      (gl as WebGLRenderingContext).texParameteri(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        (gl as WebGLRenderingContext).TEXTURE_MAG_FILTER,
        param
      );
      (gl as WebGLRenderingContext).texParameteri(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        (gl as WebGLRenderingContext).TEXTURE_WRAP_S,
        (gl as WebGLRenderingContext).CLAMP_TO_EDGE
      );
      (gl as WebGLRenderingContext).texParameteri(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        (gl as WebGLRenderingContext).TEXTURE_WRAP_T,
        (gl as WebGLRenderingContext).CLAMP_TO_EDGE
      );
      (gl as WebGLRenderingContext).texImage2D(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        0,
        internalFormat,
        w,
        h,
        0,
        format,
        type,
        null
      );

      let fbo = (gl as WebGLRenderingContext).createFramebuffer();
      (gl as WebGLRenderingContext).bindFramebuffer(
        (gl as WebGLRenderingContext).FRAMEBUFFER,
        fbo
      );
      (gl as WebGLRenderingContext).framebufferTexture2D(
        (gl as WebGLRenderingContext).FRAMEBUFFER,
        (gl as WebGLRenderingContext).COLOR_ATTACHMENT0,
        (gl as WebGLRenderingContext).TEXTURE_2D,
        texture,
        0
      );
      (gl as WebGLRenderingContext).viewport(0, 0, w, h);
      (gl as WebGLRenderingContext).clear(
        (gl as WebGLRenderingContext).COLOR_BUFFER_BIT
      );

      return [texture, fbo, texId];
    }

    function createDoubleFBO(
      texId: number,
      w: number,
      h: number,
      internalFormat: number,
      format: number,
      type: number,
      param: number
    ) {
      let fbo1 = createFBO(texId, w, h, internalFormat, format, type, param);
      let fbo2 = createFBO(
        texId + 1,
        w,
        h,
        internalFormat,
        format,
        type,
        param
      );

      return {
        get read() {
          return fbo1;
        },
        get write() {
          return fbo2;
        },
        swap() {
          let temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    }
    let lastTime = Date.now();
    let animationFrameId: number;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let config = {
      TEXTURE_DOWNSAMPLE: 1,
      DENSITY_DISSIPATION: 0.95,
      VELOCITY_DISSIPATION: 0.99,
      PRESSURE_DISSIPATION: 1,
      PRESSURE_ITERATIONS: 350,
      CURL: 0,
      SPLAT_RADIUS: 0.005,
    };

    pointers.push(new PointerPrototype());

    const compileShader = (type: number, source: string): WebGLShader => {
      const shader = gl?.createShader(type);
      if (!shader) {
        throw new Error("Unable to create shader.");
      }

      gl?.shaderSource(shader, source);
      gl?.compileShader(shader);

      console.log("gl :>> ", gl);

      console.log("shader :>> ", shader);

      console.log(
        "gl?.getShaderInfoLog(shader) :>> ",
        gl?.getShaderInfoLog(shader)
      );

      if (!gl?.getShaderParameter(shader, gl?.COMPILE_STATUS)) {
        throw new Error(
          "Failed to compile shader: " + gl?.getShaderInfoLog(shader)
        );
      }

      return shader;
    };

    const baseVertexShader = compileShader(
      (gl as WebGLRenderingContext).VERTEX_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;

        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `
    );

    const clearShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;

        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `
    );

    const displayShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTexture;

        void main () {
            gl_FragColor = texture2D(uTexture, vUv);
        }
    `
    );

    const splatShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `
    );

    const advectionManualFilteringShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform float dt;
        uniform float dissipation;

        vec4 bilerp (in sampler2D sam, in vec2 p) {
            vec4 st;
            st.xy = floor(p - 0.5) + 0.5;
            st.zw = st.xy + 1.0;
            vec4 uv = st * texelSize.xyxy;
            vec4 a = texture2D(sam, uv.xy);
            vec4 b = texture2D(sam, uv.zy);
            vec4 c = texture2D(sam, uv.xw);
            vec4 d = texture2D(sam, uv.zw);
            vec2 f = p - st.xy;
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main () {
            vec2 coord = gl_FragCoord.xy - dt * texture2D(uVelocity, vUv).xy;
            gl_FragColor = dissipation * bilerp(uSource, coord);
            gl_FragColor.a = 1.0;
        }
    `
    );

    const advectionShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform float dt;
        uniform float dissipation;

        void main () {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            gl_FragColor = dissipation * texture2D(uSource, coord);
            gl_FragColor.a = 1.0;
        }
    `
    );

    const divergenceShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;

        vec2 sampleVelocity (in vec2 uv) {
            vec2 multiplier = vec2(1.0, 1.0);
            if (uv.x < 0.0) { uv.x = 0.0; multiplier.x = -1.0; }
            if (uv.x > 1.0) { uv.x = 1.0; multiplier.x = -1.0; }
            if (uv.y < 0.0) { uv.y = 0.0; multiplier.y = -1.0; }
            if (uv.y > 1.0) { uv.y = 1.0; multiplier.y = -1.0; }
            return multiplier * texture2D(uVelocity, uv).xy;
        }

        void main () {
            float L = sampleVelocity(vL).x;
            float R = sampleVelocity(vR).x;
            float T = sampleVelocity(vT).y;
            float B = sampleVelocity(vB).y;
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `
    );

    const curlShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
        }
    `
    );

    const vorticityShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;

        void main () {
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
            vec2 force = vec2(abs(T) - abs(B), 0.0);
            force *= 1.0 / length(force + 0.00001) * curl * C;
            vec2 vel = texture2D(uVelocity, vUv).xy;
            gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
        }
    `
    );

    const pressureShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;

        vec2 boundary (in vec2 uv) {
            uv = min(max(uv, 0.0), 1.0);
            return uv;
        }

        void main () {
            float L = texture2D(uPressure, boundary(vL)).x;
            float R = texture2D(uPressure, boundary(vR)).x;
            float T = texture2D(uPressure, boundary(vT)).x;
            float B = texture2D(uPressure, boundary(vB)).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `
    );

    const gradientSubtractShader = compileShader(
      (gl as WebGLRenderingContext).FRAGMENT_SHADER,
      `
        precision highp float;
        precision mediump sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;

        vec2 boundary (in vec2 uv) {
            uv = min(max(uv, 0.0), 1.0);
            return uv;
        }

        void main () {
            float L = texture2D(uPressure, boundary(vL)).x;
            float R = texture2D(uPressure, boundary(vR)).x;
            float T = texture2D(uPressure, boundary(vT)).x;
            float B = texture2D(uPressure, boundary(vB)).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `
    );

    const defaultInternalFormat = (gl as WebGLRenderingContext).RGBA;
    const defaultFormat = (gl as WebGLRenderingContext).RGBA;

    let textureWidth: number;
    let textureHeight: number;
    let density: FBO;
    let velocity: FBO;

    const texType = (ext as WebGLExtensions).halfFloatTexType;

    let curl: FBO;
    let pressure: FBO;
    initFramebuffers();

    const clearProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      clearShader
    );
    const displayProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      displayShader
    );
    const splatProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      splatShader
    );
    const advectionProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      (ext as WebGLExtensions).supportLinearFiltering
        ? advectionShader
        : advectionManualFilteringShader
    );
    const divergenceProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      divergenceShader
    );
    const curlProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      curlShader
    );
    const vorticityProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      vorticityShader
    );
    const pressureProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      pressureShader
    );
    const gradienSubtractProgram = new GLProgram(
      gl as WebGLRenderingContext,
      baseVertexShader,
      gradientSubtractShader
    );

    function initFramebuffers() {
      textureWidth =
        (gl as WebGLRenderingContext).drawingBufferWidth >>
        config.TEXTURE_DOWNSAMPLE;
      textureHeight =
        (gl as WebGLRenderingContext).drawingBufferHeight >>
        config.TEXTURE_DOWNSAMPLE;

      const rgba = (ext as WebGLExtensions).formatRGBA;
      const rg = (ext as WebGLExtensions).formatRG;
      const r = (ext as WebGLExtensions).formatR;

      density = createDoubleFBO(
        2,
        textureWidth,
        textureHeight,
        (
          rgba as {
            internalFormat: number;
            format: number;
          }
        ).internalFormat,
        (
          rgba as {
            internalFormat: number;
            format: number;
          }
        ).format,
        texType,
        (ext as WebGLExtensions).supportLinearFiltering
          ? (gl as WebGLRenderingContext).LINEAR
          : (gl as WebGLRenderingContext).NEAREST
      );

      let internalFormat: number;
      let format: number;

      if (rg) {
        internalFormat = rg.internalFormat;
        format = rg.format;
      } else {
        internalFormat = defaultInternalFormat;
        format = defaultFormat;
      }

      function createVelocityFBO(
        texId: number,
        w: number,
        h: number,
        internalFormat: number,
        format: number,
        type: number,
        param: number
      ): FBO {
        const fbo1 = createFBO(
          texId,
          w,
          h,
          internalFormat,
          format,
          type,
          param
        );
        const fbo2 = createFBO(
          texId + 1,
          w,
          h,
          internalFormat,
          format,
          type,
          param
        );

        return {
          read: [fbo1[0], fbo1[1], fbo1[2]],
          write: [fbo2[0], fbo2[1], fbo2[2]],
          swap: () => {
            const temp: [WebGLTexture | null, WebGLFramebuffer | null, number] =
              [fbo1[0], fbo1[1], fbo1[2]];
            fbo1[0] = fbo2[0];
            fbo1[1] = fbo2[1];
            fbo1[2] = fbo2[2];
            fbo2[0] = temp[0];
            fbo2[1] = temp[1];
            fbo2[2] = temp[2];
          },
        };
      }

      velocity = createVelocityFBO(
        0,
        textureWidth,
        textureHeight,
        internalFormat,
        format,
        texType,
        (ext as WebGLExtensions).supportLinearFiltering
          ? (gl as WebGLRenderingContext).LINEAR
          : (gl as WebGLRenderingContext).NEAREST
      );

      divergence = createCurlFBO(
        4,
        textureWidth,
        textureHeight,
        (
          r as {
            internalFormat: number;
            format: number;
          }
        ).internalFormat,
        (
          r as {
            internalFormat: number;
            format: number;
          }
        ).format,
        texType,
        (gl as WebGLRenderingContext).NEAREST
      );

      console.log("divergence :>> ", divergence);

      curl = createCurlFBO(
        5,
        textureWidth,
        textureHeight,
        (
          r as {
            internalFormat: number;
            format: number;
          }
        ).internalFormat,
        (
          r as {
            internalFormat: number;
            format: number;
          }
        ).format,
        texType,
        (gl as WebGLRenderingContext).NEAREST
      );
      pressure = createDoubleFBO(
        6,
        textureWidth,
        textureHeight,
        (
          r as {
            internalFormat: number;
            format: number;
          }
        ).internalFormat,
        (
          r as {
            internalFormat: number;
            format: number;
          }
        ).format,
        texType,
        (gl as WebGLRenderingContext).NEAREST
      );
    }

    const blit = (() => {
      (gl as WebGLRenderingContext).bindBuffer(
        (gl as WebGLRenderingContext).ARRAY_BUFFER,
        (gl as WebGLRenderingContext).createBuffer()
      );
      (gl as WebGLRenderingContext).bufferData(
        (gl as WebGLRenderingContext).ARRAY_BUFFER,
        new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]),
        (gl as WebGLRenderingContext).STATIC_DRAW
      );
      (gl as WebGLRenderingContext).bindBuffer(
        (gl as WebGLRenderingContext).ELEMENT_ARRAY_BUFFER,
        (gl as WebGLRenderingContext).createBuffer()
      );
      (gl as WebGLRenderingContext).bufferData(
        (gl as WebGLRenderingContext).ELEMENT_ARRAY_BUFFER,
        new Uint16Array([0, 1, 2, 0, 2, 3]),
        (gl as WebGLRenderingContext).STATIC_DRAW
      );
      (gl as WebGLRenderingContext).vertexAttribPointer(
        0,
        2,
        (gl as WebGLRenderingContext).FLOAT,
        false,
        0,
        0
      );
      (gl as WebGLRenderingContext).enableVertexAttribArray(0);

      return (destination: WebGLFramebuffer | null) => {
        if (destination !== null) {
          (gl as WebGLRenderingContext).bindFramebuffer(
            (gl as WebGLRenderingContext).FRAMEBUFFER,
            destination
          );
          (gl as WebGLRenderingContext).drawElements(
            (gl as WebGLRenderingContext).TRIANGLES,
            6,
            (gl as WebGLRenderingContext).UNSIGNED_SHORT,
            0
          );
        }
      };
    })();

    const update = () => {
      resizeCanvas();

      const dt = Math.min((Date.now() - lastTime) / 1000, 0.016);
      lastTime = Date.now();

      (gl as WebGLRenderingContext).viewport(0, 0, textureWidth, textureHeight);

      if (splatStack.length > 0) multipleSplats(splatStack.pop());

      advectionProgram.bind();
      (gl as WebGLRenderingContext).uniform2f(
        advectionProgram.uniforms.texelSize,
        1.0 / textureWidth,
        1.0 / textureHeight
      );
      (gl as WebGLRenderingContext).uniform1i(
        advectionProgram.uniforms.uVelocity,
        velocity.read[2]
      );
      (gl as WebGLRenderingContext).uniform1i(
        advectionProgram.uniforms.uSource,
        velocity.read[2]
      );
      (gl as WebGLRenderingContext).uniform1f(advectionProgram.uniforms.dt, dt);
      (gl as WebGLRenderingContext).uniform1f(
        advectionProgram.uniforms.dissipation,
        config.VELOCITY_DISSIPATION
      );
      blit(velocity.write[1]);
      velocity.swap();

      (gl as WebGLRenderingContext).uniform1i(
        advectionProgram.uniforms.uVelocity,
        velocity.read[2]
      );
      (gl as WebGLRenderingContext).uniform1i(
        advectionProgram.uniforms.uSource,
        density.read[2]
      );
      (gl as WebGLRenderingContext).uniform1f(
        advectionProgram.uniforms.dissipation,
        config.DENSITY_DISSIPATION
      );
      blit(density.write[1]);
      density.swap();

      for (let i = 0; i < pointers.length; i++) {
        const pointer = pointers[i];
        if (pointer.moved) {
          splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
          pointer.moved = false;
        }
      }

      curlProgram.bind();
      (gl as WebGLRenderingContext).uniform2f(
        curlProgram.uniforms.texelSize,
        1.0 / textureWidth,
        1.0 / textureHeight
      );
      (gl as WebGLRenderingContext).uniform1i(
        curlProgram.uniforms.uVelocity,
        velocity.read[2]
      );
      blit(curl.write[1]);

      vorticityProgram.bind();
      (gl as WebGLRenderingContext).uniform2f(
        vorticityProgram.uniforms.texelSize,
        1.0 / textureWidth,
        1.0 / textureHeight
      );
      (gl as WebGLRenderingContext).uniform1i(
        vorticityProgram.uniforms.uVelocity,
        velocity.read[2]
      );
      (gl as WebGLRenderingContext).uniform1i(
        vorticityProgram.uniforms.uCurl,
        curl.read[2]
      );
      (gl as WebGLRenderingContext).uniform1f(
        vorticityProgram.uniforms.curl,
        config.CURL
      );
      (gl as WebGLRenderingContext).uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write[1]);
      velocity.swap();

      divergenceProgram.bind();
      (gl as WebGLRenderingContext).uniform2f(
        divergenceProgram.uniforms.texelSize,
        1.0 / textureWidth,
        1.0 / textureHeight
      );
      (gl as WebGLRenderingContext).uniform1i(
        divergenceProgram.uniforms.uVelocity,
        velocity.read[2]
      );
      blit(divergence.read[1]);

      clearProgram.bind();
      let pressureTexId = pressure.read[2];
      (gl as WebGLRenderingContext).activeTexture(
        (gl as WebGLRenderingContext).TEXTURE0 + pressureTexId
      );
      (gl as WebGLRenderingContext).bindTexture(
        (gl as WebGLRenderingContext).TEXTURE_2D,
        pressure.read[0]
      );
      (gl as WebGLRenderingContext).uniform1i(
        clearProgram.uniforms.uTexture,
        pressureTexId
      );
      (gl as WebGLRenderingContext).uniform1f(
        clearProgram.uniforms.value,
        config.PRESSURE_DISSIPATION
      );
      blit(pressure.write[1]);
      pressure.swap();

      pressureProgram.bind();
      (gl as WebGLRenderingContext).uniform2f(
        pressureProgram.uniforms.texelSize,
        1.0 / textureWidth,
        1.0 / textureHeight
      );
      (gl as WebGLRenderingContext).uniform1i(
        pressureProgram.uniforms.uDivergence,
        divergence.read[2]
      );

      pressureTexId = pressure.read[2];
      (gl as WebGLRenderingContext).uniform1i(
        pressureProgram.uniforms.uPressure,
        pressureTexId
      );
      (gl as WebGLRenderingContext).activeTexture(
        (gl as WebGLRenderingContext).TEXTURE0 + pressureTexId
      );
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        (gl as WebGLRenderingContext).bindTexture(
          (gl as WebGLRenderingContext).TEXTURE_2D,
          pressure.read[0]
        );
        blit(pressure.write[1]);
        pressure.swap();
      }

      gradienSubtractProgram.bind();
      (gl as WebGLRenderingContext).uniform2f(
        gradienSubtractProgram.uniforms.texelSize,
        1.0 / textureWidth,
        1.0 / textureHeight
      );
      (gl as WebGLRenderingContext).uniform1i(
        gradienSubtractProgram.uniforms.uPressure,
        pressure.read[2]
      );
      (gl as WebGLRenderingContext).uniform1i(
        gradienSubtractProgram.uniforms.uVelocity,
        velocity.read[2]
      );
      blit(velocity.write[1]);
      velocity.swap();

      (gl as WebGLRenderingContext).viewport(
        0,
        0,
        (gl as WebGLRenderingContext).drawingBufferWidth,
        (gl as WebGLRenderingContext).drawingBufferHeight
      );
      displayProgram.bind();
      (gl as WebGLRenderingContext).uniform1i(
        displayProgram.uniforms.uTexture,
        density.read[2]
      );
      blit(null);

      animationFrameId = requestAnimationFrame(update);
    };

    const splat = (
      x: number,
      y: number,
      dx: number,
      dy: number,
      color: number[]
    ) => {
      splatProgram.bind();
      (gl as WebGLRenderingContext).uniform1i(
        splatProgram.uniforms.uTarget,
        velocity.read[2]
      );
      (gl as WebGLRenderingContext).uniform1f(
        splatProgram.uniforms.aspectRatio,
        canvas.width / canvas.height
      );
      (gl as WebGLRenderingContext).uniform2f(
        splatProgram.uniforms.point,
        x / canvas.width,
        1.0 - y / canvas.height
      );
      (gl as WebGLRenderingContext).uniform3f(
        splatProgram.uniforms.color,
        dx,
        -dy,
        1.0
      );
      (gl as WebGLRenderingContext).uniform1f(
        splatProgram.uniforms.radius,
        config.SPLAT_RADIUS
      );
      blit(velocity.write[1]);
      velocity.swap();

      (gl as WebGLRenderingContext).uniform1i(
        splatProgram.uniforms.uTarget,
        density.read[2]
      );
      (gl as WebGLRenderingContext).uniform3f(
        splatProgram.uniforms.color,
        color[0] * 0.3,
        color[1] * 0.3,
        color[2] * 0.3
      );
      blit(density.write[1]);
      density.swap();
    };

    const multipleSplats = (amount: number | undefined) => {
      const numSplats = amount || 0;

      for (let i = 0; i < numSplats; i++) {
        const color = [
          Math.random() * 10,
          Math.random() * 10,
          Math.random() * 10,
        ];
        const x = canvas.width * Math.random();
        const y = canvas.height * Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        splat(x, y, dx, dy, color);
      }
    };

    const resizeCanvas = () => {
      if (
        canvas.width !== canvas.clientWidth ||
        canvas.height !== canvas.clientHeight
      ) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        initFramebuffers();
      }
    };

    multipleSplats(parseInt(String(Math.random() * 20)) + 5);

    update();

    console.log("hey :>> ");

    canvas.addEventListener("mousemove", (e) => {
      // console.log("object :>> ");
      pointers[0].moved = pointers[0].down;
      pointers[0].dx = (e.offsetX - pointers[0].x) * 10.0;
      pointers[0].dy = (e.offsetY - pointers[0].y) * 10.0;
      pointers[0].x = e.offsetX;
      pointers[0].y = e.offsetY;
    });

    canvas.addEventListener(
      "touchmove",
      (e) => {
        console.log("touchmove :>> ");
        e.preventDefault();
        const touches = e.targetTouches;
        for (let i = 0; i < touches.length; i++) {
          let pointer = pointers[i];
          pointer.moved = pointer.down;
          pointer.dx = (touches[i].pageX - pointer.x) * 10.0;
          pointer.dy = (touches[i].pageY - pointer.y) * 10.0;
          pointer.x = touches[i].pageX;
          pointer.y = touches[i].pageY;
        }
      },
      false
    );

    canvas.addEventListener("mousemove", () => {
      // console.log("move :>> ");
      pointers[0].down = true;
      pointers[0].color = [
        Math.random() * 10,
        Math.random() + 0.1,
        Math.random() + 0.1,
      ];
    });

    canvas.addEventListener("touchstart", (e) => {
      console.log("touchstart :>> ");

      e.preventDefault();
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        if (i >= pointers.length) pointers.push(new PointerPrototype());

        pointers[i].id = touches[i].identifier;
        pointers[i].down = true;
        pointers[i].x = touches[i].pageX;
        pointers[i].y = touches[i].pageY;
        pointers[i].color = [
          Math.random() * 10,
          Math.random() + 0.2,
          Math.random() + 0.2,
        ];
      }
    });

    window.addEventListener("mouseleave", () => {
      console.log("leave :>> ");

      pointers[0].down = false;
    });

    window.addEventListener("touchend", (e) => {
      console.log("touchend :>> ");

      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++)
        for (let j = 0; j < pointers.length; j++)
          if (touches[i].identifier == pointers[j].id) pointers[j].down = false;
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  console.log("component :>> ");
  return <canvas ref={canvasRef} />;
};

export default MyCanvas;
