(function() {
	const state = {
		ctrlObject: null,
		zapObject: null,
		listeners: [],
		lastButtonState: [],
		intersected: null,
		zapVisibility: true,
		fire: {},
	};
	const zeroPosRight = new THREE.Vector3(.25, 1.1, -.4);
	const zeroPosLeft = new THREE.Vector3(-.25, 1.1, -.4);
	const raycaster = new THREE.Raycaster();
	raycaster.near = 0;
	raycaster.far = Infinity;

	function gamePads() {
		var vrGamepads = [];
		var gamepads = navigator.getGamepads();
		for (var i = 0; i < gamepads.length; ++i) {
			var gamepad = gamepads[i];
			if (gamepad && gamepad.pose) vrGamepads.push(gamepad);
		}
		return vrGamepads;
	}

	function controller() {
		const ctrl = new THREE.Object3D();
		const geometry = new THREE.CylinderBufferGeometry(0, .02, .2, 32, 5);
		const cx = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
			color: 0xff0000
		}));
		cx.rotation.z = -Math.PI / 2;
		ctrl.add(cx)
		const cy = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
			color: 0x00ff00
		}));
		ctrl.add(cy)
		const cz = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
			color: 0x0000ff
		}));
		cz.rotation.x = -Math.PI / 2;
		ctrl.add(cz)
		state.ctrlObject = ctrl;
		return ctrl;
	}

	function zap() {
		const material = new THREE.LineBasicMaterial({
			color: 0x00ffff
		});
		const geometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1.0)
		]);
		const zap = new THREE.Line(geometry, material);
		zap.visible = false;
		state.zapObject = zap;
		return zap;
	}

	function getController() {
		const obj = controller();
		obj.add(zap());
		return obj;
	}

	function intersections(position, direction, targets) {
		raycaster.set(position, direction);
		const intersects = raycaster.intersectObjects(targets);
		if (intersects.length > 0) {
			if (state.intersected != intersects[0].object) {
				if (state.intersected) {
					state.fire.Left = true;
					state.leftObject = state.intersected;
				}
				state.intersected = intersects[0].object;
				state.intersected.intersect = intersects[0];
				state.fire.Intersected = true;
			}
		} else {
			if (state.intersected) {
				state.fire.Left = true;
				state.leftObject = state.intersected;
			}
			state.intersected = undefined;
		}
	}

	function fire(type, state) {
		const funcAry = state.listeners[type.toLowerCase()];
		if (!funcAry) return;
		for (let i = 0; i < funcAry.length; i++)
			(funcAry[i])(state);
	}

	function addListener(type, func) {
		const ltype = type.toLowerCase();
		const funcAry = state.listeners[ltype];
		if (funcAry) funcAry.push(func);
		else state.listeners[ltype] = [func];
	}

	function update_ctrlObject(q, direction, targets) {
		const zeroPos = (!state.gamepad.hand || state.gamepad.hand == 'right') ?
			zeroPosRight : zeroPosLeft;
		state.ctrlObject.setRotationFromQuaternion(q);
		state.ctrlObject.position.fromArray(zeroPos.toArray());
		if (targets) intersections(zeroPos, direction, targets);
		state.zapObject.scale.z = (state.intersected) ?
			state.intersected.intersect.distance : 10.0;
		state.zapObject.visible = state.zapVisibility;
	}

	function update_touch() {
		state.touchPosition = [state.gamepad.axes[0], state.gamepad.axes[1]];
	}

	function update_buttons() {
		for (let i = 0; i < state.gamepad.buttons.length; i++) {
			const newState = state.gamepad.buttons[i].pressed;
			const lastState = state.lastButtonState[i] || false;
			if (newState != lastState) {
				if (newState) state.fireBtnDown = true;
				else state.fireBtnUp = true;
			}
			state.lastButtonState[i] = newState;
		}
	}

	function update_fireEvents() {
		fire('update', state)
		if (state.fire.Intersected)
			fire('Intersect', state);
		if (state.fire.Left)
			fire('Leave', state);
		if (state.fire.BtnDown)
			fire('ButtonDown', state);
		if (state.fire.BtnUp)
			fire('ButtonUp', state);
		state.fire.Intersected = false;
		state.fire.Left = false;
		state.leftObject = undefined;
		state.fire.BtnDown = false;
		state.fire.BtnUp = false;
	}

	function update(targets) {
		const vrGamePads = gamePads();
		if (!vrGamePads || vrGamePads.length == 0 || !vrGamePads[0]) return;
		const gamepad = vrGamePads[0];
		const q = new THREE.Quaternion().fromArray(gamepad.pose.orientation);
		const direction = (new THREE.Vector3(0, 0, -1)).applyQuaternion(q);
		gamepad.direction = direction;
		state.gamepad = gamepad;
		if (state.ctrlObject) {
			update_ctrlObject(q, direction, targets);
		}
		update_buttons();
		update_touch();
		update_fireEvents();
	}

	function setZapVisibility(zapVisibility) {
		state.zapVisibility = zapVisibility;
	}

	window.GamepadCtrl = {
		update: update,
		getController: getController,
		addListener: addListener,
		setZapVisibility: setZapVisibility,
	};
})();
