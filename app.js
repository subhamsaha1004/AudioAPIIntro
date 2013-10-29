(function(window) {
	var doc = window.document,
			$ = function(selector) {
				var result = doc.querySelectorAll(selector);
				return (result.length > 1) ? result : result[0];
			};

	Node.prototype.on = Node.prototype.addEventListener;
	NodeList.prototype.on = function(type, func, flag) {
		[].forEach.call(this, function(node, index) {
			node.on(type, func, flag);
		});
	};

	try {
		// Getting the audio context
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		var context = new AudioContext();
		var audioBuffer = null;
		var fileName = "";
		var status = $('#status');

		// generic error handler
		function errorHandler(error) {
			console.log('Error occured: ' + error.message);
		}

		// cancelling the default behaviour
		function cancelEvent(event) {
			event.preventDefault();
			event.stopPropagation();
		}

		// Sound object with all the neccessary functionalities like play/pause and changevolume
		var soundSample = {};
		soundSample.gainNode = null;
		soundSample.playing = true;
		soundSample.playSound = function (playBuffer, time){
			// Actually play the sound
			var source = context.createBufferSource(); // create a sound source
			source.buffer = playBuffer || audioBuffer; // tell the source which sound to play

			// gain node for volume control
			if(!context.createGain) {
				context.createGain = context.createGainNode;
			}
			this.gainNode = context.createGain();

			// insert gain node between source and destination
			source.connect(this.gainNode);
			this.gainNode.connect(context.destination); // connect the source to the context's destination, the speakers

			// start playback in a loop
			source.loop = true;
			if(!source.start) source.start = source.noteOn;
			source.start(time || 0); // play the source now
			this.source = source;

			// Update the status
			updateStatus('Play');
		}

		soundSample.stopSound = function() {
			if(!this.source.stop) {
				this.source.stop = source.noteOff;
			}
			this.source.stop(0);
			updateStatus('Stop');
		};

		soundSample.toggle = function() {
			this.playing ? this.stopSound() : this.playSound();
			this.playing = !this.playing;
		};

		soundSample.changeVolume = function(element) {
			var volume = element.value;
			var fraction = parseInt(element.value)	 / parseInt(element.max);
			if(this.gainNode) {
				this.gainNode.gain.value = fraction;
				$(".volumeControl span em").innerHTML = ': ' + volume;
			} else {
				console.log('gainNode is null');
			}
			
		};

		// Applying a simple filter effect to a sound, code not optimized, need to change later
		var FilterSample = {
			FREQ_MUL: 7000,
			QUAL_MUL: 30,
			playing: true
		};

		FilterSample.play = function() {
			// create the source
			var source == context.createBufferSource();
			source.buffer = playBuffer || audioBuffer;

			// create the filter
			var filter = context.createBiquadFilter();
			filter.type = 0; // LOWPASS
			filter.frequency.value = 5000;

			// connect source to filter, filter to destination
			source.connect(filter);
			filter.connect(context.destination);

			// Play!!
			if(!source.start) source.start = source.noteOn;
			source.start(0);
			source.loop = true;

			// save source and filter for later use
			this.source = source;
			this.filter = filter;
		};

		FilterSample.stop = function() {
			if(!this.source.stop) this.source.stop = this.source.noteOff;
			this.source.stop(0);
		};

		FilterSample.toggle = function() {
			this.playing ? this.stop() : this.play();
			this.playing = !this.playing;
		};

		FilterSample.changeFrequency = function(element) {
			// Clamp the frequency between the minimum value and half of the sampling rate
			var minValue = 40;
			var maxValue = context.sampleRate / 2;

			// Logarithm (base 2) to compute how many octaves fall in the range
			var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
			// Compute a multiplier from 0 to 1 based on an exponential scale
			var multiplier = Math.pow(2, numberOfOctaves * (element.value - 1.0));

			// get back to the frequency value between min and max
			this.filter.frequency.value = maxValue * multiplier;
		};

		FilterSample.changeQuality = function(element) {
			this.filter.Q.value = element.value * this.QUAL_MUL;
		};

		FilterSample.toggleFilter = function(element) {
			this.source.disconnect(0);
			this.filter.disconnect(0);

			// check if we want to enable the filter
			if(element.checked) {
				// connect through the filter
				this.source.connect(this.filter);
				this.filter.connect(context.destination);
			} else {
				// connect directly
				this.source.connect(context.destination);
			}
		};

		// end of filter sample

		function updateStatus(text) {
			status.innerHTML = "Currently playing: <span>" + fileName + "</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<button id='toggle'>" + text + "</button>";
		}

		// configure event handler for toggling the sound
		status.on('click', function(e) {
			var target = e.target;
			if(target.nodeName.toUpperCase() === 'BUTTON' && target.id === 'toggle') {
				soundSample.toggle();
			}
		}, false);

		$('#volume').on('input', function(e) {
			soundSample.changeVolume(this);
		}), false;

		// Handling drag and drop
		var dropZone = $('#dropZone');
		dropZone.on('dragenter', function(e) {
			// adding class on drag enter for visual effect
			cancelEvent(e);
			this.classList.add('enter');
		}, false);

		dropZone.on('dragover', function(e) {
			cancelEvent(e);
		}, false);

		dropZone.on('drop', function(e) {
			// removing the class on drop
			cancelEvent(e);
			this.classList.remove('enter');
			status.innerHTML = "Loading. Please Wait...";

			// fetching the  file from the event data
			var file = e.dataTransfer.files[0];
			fileName = file.name;

			// Reading the file using the FileReader API
			var reader = new FileReader();
			reader.onload = function(e) {
				var result = e.target.result;

				// Decoding the array buffer to generate an audiobuffer
				context.decodeAudioData(result, function(buffer) {
					// saving the buffer for future use
					audioBuffer = buffer;
					soundSample.playSound();
				}, errorHandler);
			};
			reader.readAsArrayBuffer(file);

			return false;
		}, false);

		// Using a buffer loader to load multiple sounds
		var bufferLoaderBtn = $('#bufferLoader');

		bufferLoaderBtn.on('click', function(e) {
			if(typeof BufferLoader === 'function') {
				// create a buffer loader
				var bufferLoader = new BufferLoader(context, [
					'sounds/Ghanchakkar/1.mp3',
					'sounds/Ghanchakkar/2.mp3'
				], finishedLoading);

				// load the bufferloader
				bufferLoader.load();
			} else {
				console.log('BufferLoader is not supported');
			}
		}, false);

		function finishedLoading(bufferList) {
			var sources = [];
			[].forEach.call(bufferList, function(buffer, index) {
				sources.push(context.createBufferSource());
				sources[index].buffer = buffer;
				sources[index].connect(context.destination);
				sources[index].start(0);
			});
		}

	} catch(e) {
		alert('Web Audio API is not supported');
	}

}(this));