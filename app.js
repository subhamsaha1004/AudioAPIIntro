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
					console.log(audioBuffer);
					playSound(audioBuffer);
				}, errorHandler);
			};
			reader.readAsArrayBuffer(file);

			return false;
		}, false);

		// Playing sound
		function playSound(audioBuffer ){
			// Update the status
			status.innerHTML = "Currently playing: <span>" + fileName + "</span>";

			// Actually play the sound
			var source = context.createBufferSource(); // create a sound source
			source.buffer = audioBuffer; // tell the source which sound to play
			source.connect(context.destination); // connect the source to the context's destination, the speakers
			source.start(0); // play the source now
		}

	} catch(e) {
		alert('Web Audio API is not supported');
	}

}(this));