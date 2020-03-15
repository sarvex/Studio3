var ImageSHADER		 = ['precision lowp float;',
						'uniform sampler2D u_image;',
						'varying vec4 v_color;',
						'varying vec2 v_texture;',
						'void main(void) {',
						'	gl_FragColor = texture2D(u_image, v_texture) * v_color;',
						'}'].join('\n')

var RectSHADER	 	= ['precision lowp float;',
						'varying vec4 v_color;',
						'void main(void) {',
						'	gl_FragColor = v_color;',
						'}'].join('\n')


var VERTEXSHADER = ['attribute vec3 a_position;',
						'attribute vec4 a_color;',
						'attribute vec2 a_texture;',
						'uniform vec2 u_resolution;',
						'uniform mat3 u_matrix;',
						'varying vec4 v_color;',
						'varying vec2 v_texture;',
						'void main(void) {',
						'   vec2 canvas_coords = (u_matrix * vec3(a_position.xy,1)).xy;',
						'   vec2 clipSpace = ((canvas_coords / u_resolution)*2.0) - 1.0;',
						'	gl_Position = vec4(clipSpace * vec2(1, -1), a_position.z, 1);',
						'	v_color = a_color;',
						'	v_texture = a_texture;',
						'}'].join('\n')

Studio.Stage.prototype.loadShader = function(who, shader) {
	this.ctx.shaderSource(who, shader)
}

Studio.Stage.prototype.WEBGL = {

	type: 'webgl',

	antialias: false,
	premultipliedAlpha: false,
	stencil: true,

	getContext: function() {
		if (Studio.browser_info.iOS) {
			this.WEBGL.antialias = true
		} else {
			this.WEBGL.antialias = false
		}
		this.ctx = this.bitmap.getContext(Studio.browser_info.webGL, {
			antialias: this.WEBGL.antialias ,
			premultipliedAlpha: this.WEBGL.premultipliedAlpha ,
			stencil: this.WEBGL.stencil
		})
	},
	newBatch: function(gl, name) {
		// gl._rects = new Float32Array(this._maxCount)
	},
	init: function(gl) {
		this.programs = {}

		this._max_textures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
		this._count = 0
		this.rect_buffer = new Studio.BufferGL(null,0,this)
		gl.clearColor(0,0,0,1)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		gl.enable(gl.DEPTH_TEST)
		gl.depthFunc(gl.LESS)

		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.enable(gl.BLEND)
		// gl.disable(gl.DEPTH_TEST);

		this.createProgram(
			'DefaultProgram',
			this.compileShader(VERTEXSHADER, gl.VERTEX_SHADER),
			this.compileShader(ImageSHADER, gl.FRAGMENT_SHADER)
		).prep = function(stage, program){
			var gl = stage.ctx
			var resolutionLocation = gl.getUniformLocation( program, 'u_resolution')
			gl.matrixLocation = gl.getUniformLocation( program, 'u_matrix')

			gl.enableVertexAttribArray(0)

			gl.positionLocation = gl.getAttribLocation( program, 'a_position')
			gl.bindAttribLocation( program, 0, 'a_position')

			gl.colorLocation = gl.getAttribLocation( program, 'a_color')

			gl.textureLocation = gl.getAttribLocation( program, 'a_texture')

			gl.uniform2f(resolutionLocation, stage.width, stage.height)

			gl.enableVertexAttribArray(gl.positionLocation)
			gl.enableVertexAttribArray(gl.colorLocation)
			gl.enableVertexAttribArray(gl.textureLocation)
		}

		this.createProgram(
			'RectProgram',
			this.compileShader(VERTEXSHADER, gl.VERTEX_SHADER),
			this.compileShader(RectSHADER, gl.FRAGMENT_SHADER)
		).prep = function(stage, program){
			var gl = stage.ctx
			var resolutionLocation = gl.getUniformLocation( program, 'u_resolution')
			gl.matrixLocation = gl.getUniformLocation( program, 'u_matrix')

			gl.enableVertexAttribArray(0)

			gl.positionLocation = gl.getAttribLocation( program, 'a_position')
			gl.bindAttribLocation( program, 0, 'a_position')

			gl.colorLocation = gl.getAttribLocation( program, 'a_color')

			gl.uniform2f(resolutionLocation, stage.width, stage.height)

			gl.enableVertexAttribArray(gl.positionLocation)
			gl.enableVertexAttribArray(gl.colorLocation)
		}

		this.useProgram('DefaultProgram')
	},

	prep: function(gl) {
		this.buffers = {}

		this._rect_index_buffer = gl.createBuffer()
		this._rect_index = new Uint16Array(this._maxCount*6)

		for (var i = 0, j = 0; i < this._maxCount*6; i += 6, j += 4) {
			this._rect_index[i + 0] = j + 0
			this._rect_index[i + 1] = j + 1
			this._rect_index[i + 2] = j + 2
			this._rect_index[i + 3] = j + 1
			this._rect_index[i + 4] = j + 2
			this._rect_index[i + 5] = j + 3
		}
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._rect_index_buffer)
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._rect_index, gl.STATIC_DRAW)
	},
	render:  function(lag) {
		this._count = 0
		this.draws = 0
		this.ctx.clearColor(this.color.r,this.color.g,this.color.b,this.color.a)
		this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT)
		if (this.previousScene) {
			this.previousScene.buildElement(this, lag, this.interpolate)
			this.previousScene.vertex_children(this, lag, this.interpolate)
		}
		if (this.activeScene) {
			this.activeScene.buildElement(this, lag, this.interpolate)
			this.activeScene.vertex_children(this, lag, this.interpolate)
		}
		this.vertex_children(this, lag, this.interpolate)
		this.rect_buffer.draw(this.ctx)
		this.camera.render(this, lag, 1);
		for (var i in this.buffers) {
			this.buffers[i].draw(this.ctx)
		}
		if (this._effects) {
			this.runEffects();
		}
	}
}
