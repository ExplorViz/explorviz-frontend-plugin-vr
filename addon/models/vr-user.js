import DS from 'ember-data';
import THREE from 'three';

const { Model, attr } = DS;

export default Model.extend({

  name: attr('string'),
  state: attr('string'),

  highlightedEntity: {
    appID: null,
    entityID: null,
    sourceClazzID: null,
    targetClazzID: null,
    originalColor: null
  },
  controller1: null,
  controller2: null,
  camera: null,
  color: null, // [r,g,b], r,g,b = 0,...,255
  namePlane: null, // PlaneGeometry containing username

  initCamera(obj) {
    this.set('camera', {
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      model: new THREE.Object3D()
    });
    this.get('camera.model').add(obj);
  },

  initController1(name, obj) {
    this.set('controller1', {
      id: name,
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      model: new THREE.Object3D()
    });

    this.get('controller1.model').add(obj);
  },

  initController2(name, obj) {
    this.set('controller2', {
      id: name,
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      model: new THREE.Object3D()
    });

    this.get('controller2.model').add(obj);
  },

  removeController1() {
    this.set('controller1', null);
  },

  removeController2() {
    this.set('controller2', null);
  },

  removeCamera() {
    this.set('camera', null);
  },

  removeNamePlane() {
    this.set('namePlane', null);
  },

  /**
   * Updates the camera model's position and rotation.
   * 
   * @param {{position: number[], quaternion: number[]}} camera - Object containing the new camera position and quaterion.
   */
  updateCamera(camera) {
    if (this.get('camera')) {
      this.get('camera').position.fromArray([camera.position[0], camera.position[1] - 0.01, camera.position[2]]);
      this.get('camera').quaternion.fromArray(camera.quaternion);
      this.get('camera').model.position.copy(this.get('camera').position);
      this.get('camera').model.quaternion.copy(this.get('camera').quaternion);
    }
  },

  /**
   * Updates the controller1 model's position and rotation.
   * 
   * @param {{position: number[], quaternion: number[]}} controller - Object containing the new controller1 position and quaterion.
   */
  updateController1(controller) {
    if (this.get('controller1')) {
      this.get('controller1').position.fromArray(controller.position);
      this.get('controller1').quaternion.fromArray(controller.quaternion);
      this.get('controller1').model.position.copy(this.get('controller1').position);
      this.get('controller1').model.quaternion.copy(this.get('controller1').quaternion);
    }
  },

  /**
   * Updates the controller2 model's position and rotation.
   * 
   * @param {{position: number[], quaternion: number[]}} controller - Object containing the new controller2 position and quaterion.
   */
  updateController2(controller) {
    if (this.get('controller2')) {
      this.get('controller2').position.fromArray(controller.position);
      this.get('controller2').quaternion.fromArray(controller.quaternion);
      this.get('controller2').model.position.copy(this.get('controller2').position);
      this.get('controller2').model.quaternion.copy(this.get('controller2').quaternion);
    }
  },

  setHighlightedEntity(appID, entityID, sourceClazzID, targetClazzID, originalColor) {
    this.set('highlightedEntity.appID', appID);
    this.set('highlightedEntity.entityID', entityID);
    this.set('highlightedEntity.sourceClazzID', sourceClazzID);
    this.set('highlightedEntity.targetClazzID', targetClazzID);
    this.set('highlightedEntity.originalColor', originalColor);
  },

  /**
   * Hides user or unhides them.
   * 
   * @param {boolean} bool - If false, hides user's controllers, camera and name tag. Shows them if true.
   */
  setVisible(bool) {
    if (this.get('camera')) {
      this.set('camera.model.visible', bool);
    }
    if (this.get('controller1')) {
      this.set('controller1.model.visible', bool);
    }
    if (this.get('controller2')) {
      this.set('controller2.model.visible', bool);
    }
    if (this.get('namePlane')) {
      this.set('namePlane.visible', bool);
    }
  }
});
