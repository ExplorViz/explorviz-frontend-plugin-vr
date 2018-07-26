import { inject as service } from '@ember/service';
import EmberMap from '@ember/map';
import User from '../utils/multi-user/user';
import VRRendering from './vr-rendering';
import Ember from 'ember';
//import THREE from 'three';

export default VRRendering.extend({
  websockets: service(),
  socketRef: null,
  //Map: UserID -> User
  users: EmberMap.create(),
  userID: null,
  lastPositions: { camera: null, controller1: null, controller2: null },
  controllersConnected: { controller1: false, controller2: false },

  didInsertElement() {
    this._super(...arguments);
    let host, port;
    Ember.$.getJSON("config/config_multiuser.json").then(json => {
      host = json.host;
      port = json.port;

      if(!host || !port) {
        console.log('Config not found');
        return;
      }

      const socket = this.websockets.socketFor(`ws://${host}:${port}/`);
      socket.on('open', this.openHandler, this);
      socket.on('message', this.messageHandler, this);
      socket.on('close', this.closeHandler, this);

      this.set('socketRef', socket);
    });
  },

  update() {
    if(this.camera && !this.lastPositions.camera) {
      this.lastPositions.camera = this.camera.position.toArray();
    }
    if(this.controller1 && !this.lastPositions.controller1) {
      this.lastPositions.controller1 = this.controller1.position.toArray();
    }
    if(this.controller2 && !this.lastPositions.controller2) {
      this.lastPositions.controller2 = this.controller2.position.toArray();
    }
    this.updatePositions();
    this.updateControllers();
  },

  updateControllers() {
    let controllerObj = {
      "event": "receive_user_controllers",
      "time": Date.now()
    };

    let disconnect = [];
    let connect = {};

    let hasChanged = false;

    if(this.controllersConnected.controller1 && this.controller1.getGamepad() === undefined) {
      disconnect.push("controller1");
      this.controllersConnected.controller1 = false;
      hasChanged = true;
    }
    else if(!this.controllersConnected.controller1 && this.controller1.getGamepad() !== undefined) {
      connect.controller1 = this.controller1.getGamepad().id;
      this.controllersConnected.controller1 = true;
      hasChanged = true;
    }

    if(this.controllersConnected.controller2 && this.controller2.getGamepad() === undefined) {
      disconnect.push("controller2");
      this.controllersConnected.controller2 = false;
      hasChanged = true;
    }
    else if(!this.controllersConnected.controller2 && this.controller2.getGamepad() !== undefined) {
      connect.controller2 = this.controller2.getGamepad().id;
      this.controllersConnected.controller2 = true;
      hasChanged = true;
    }

    if(hasChanged) {
      if(Array.isArray(disconnect) && disconnect.length) {
        controllerObj.disconnect = disconnect;
      }
      if(Object.keys(connect).length !== 0) {
        controllerObj.connect = connect;
      }

      if(controllerObj.disconnect || controllerObj.connect) {
        this.send(controllerObj);
      }
    }
  },

  updatePositions() {
    let positionObj = {
      "event": "receive_user_positions",
      "time": Date.now()
    };

    let currentPositions = {
      controller1: this.controller1.position.toArray(),
      controller2: this.controller2.position.toArray(),
      camera: this.camera.position.toArray()
    }

    let hasChanged = false;

    if(JSON.stringify(currentPositions.controller1) !== JSON.stringify(this.lastPositions.controller1)) {
      hasChanged = true;
      positionObj.controller1 = {
        "position": this.controller1.position.toArray(),
        "quaternion": this.controller1.quaternion.toArray()
      };
    }
    if(JSON.stringify(currentPositions.controller2) !== JSON.stringify(this.lastPositions.controller2)) {
      hasChanged = true;
      positionObj.controller2 = {
        "position": this.controller2.position.toArray(),
        "quaternion": this.controller2.quaternion.toArray()
      };
    }
    if(JSON.stringify(currentPositions.camera) !== JSON.stringify(this.lastPositions.camera)) {
      hasChanged = true;
      positionObj.camera = {
        "position": this.camera.position.toArray(),
        "quaternion": this.camera.quaternion.toArray()
      };
    }

    console.log(positionObj);

    if(hasChanged) {
      this.lastPositions = currentPositions;

      this.send(positionObj);
    }
  },

  willDestroyElement() {
    this._super(...arguments);

    const socket = this.socketRef;
    socket.off('open', this.myOpenHandler);
    socket.off('message', this.myMessageHandler);
    socket.off('close', this.myCloseHandler);
  },

  openHandler(event) {
    console.log(`On open event has been called: ${event}`);
  },

  messageHandler(event) {
    const data = JSON.parse(event.data);
    switch(data.event) {
      case 'receive_self_connecting':
        console.log(`${event.data}`);
        this.receiveSelfConnecting(data);
        console.log(`You are connecting with id ${this.get('userID')}`);
        break;
      case 'receive_self_connected':
        console.log(`${event.data}`);
        this.receiveSelfConnected(data);
        console.log(`You just connected with id ${this.get('userID')}`);
        //call update function with 60 fps
        setInterval(this.update.bind(this), 1000 / 60);
        break;
      case 'receive_user_connecting':
        console.log(`${event.data}`);
        console.log(`New client connecting with ID ${data.id}`);
        break;
      case 'receive_user_connected':
        console.log(`${event.data}`);
        this.receiveUserConnected(data);
        console.log(`${data.user.name} connected with ID ${data.user.id}`);
        break;
      case 'receive_user_positions':
        console.log(`${event.data}`);
        this.receiveUserPositions(data);
        break;
      case 'receive_user_controllers':
        console.log(`${event.data}`);
        this.receiveUserControllers(data);
        break;
    }
  },

  receiveSelfConnecting(data) {
    this.set('userID', data.id);
    let JSONObj = {
      "event": "receive_connect_request",
      "name": "" + data.id
    };
    this.send(JSONObj);
  },

  receiveSelfConnected(data) {
    // create User model for all users and add them to the users map
    for (let i = 0; i < data.users.length; i++) {
      const userData = data.users[i];
      let user = User.create();
      user.set('name', userData.name);
      user.set('id', userData.id);
      user.set('state', 'connected');
      user.init();

      if(userData.controllers.controller1) {
        user.initController1(userData.controllers.controller1);
      }
      if(userData.controllers.controller2) {
        user.initController2(userData.controllers.controller1);
      }
      this.get('users').set(userData.id, user);

      //add models for other users
      if(userData.id !== data.id && user.state === 'connected') {
        this.get('scene').add(user.get('camera.model'));
      }
    }
  },

  receiveUserConnected(data) {
    let user = User.create();
    user.set('name', data.user.name);
    user.set('id', data.user.id);
    user.set('state', 'connected');
    user.init();
    this.get('users').set(data.user.id, user);

    //add model for new user
    this.get('scene').add(user.get('camera.model'));
  },

  receiveUserPositions(data) {
    let { camera, id, controller1, controller2 } = data;
    if(this.get('users').has(id)) {
      let user = this.get('users').get(id);
      if(controller1)
        user.updateController1(controller1);
      if(controller2)
        user.updateController2(controller2);
      if(camera)
        user.updateCamera(camera);
    }
  },

  receiveUserControllers(data) {
    let { id, disconnect, connect } = data;

    if(!this.get('users').has(id))
      return;

    let user = this.get('users').get(id);
    if(connect) {
      if(connect.controller1) {
        user.initController1(connect.controller1);
      }
      if(connect.controller2) {
        user.initController2(connect.controller2);
      }
    }
    if(disconnect) {
      for (let i = 0; i < disconnect.length; i++) {
        const controller = disconnect[i];
        if(controller === 'controller1') {
          user.removeController1();
        }
        if(controller === 'controller2') {
          user.removeController2();
        }
      }
    }
  },

  send(obj) {
    this.socketRef.send(JSON.stringify(obj));
  },

  closeHandler(event) {
    console.log(`On close event has been called: ${event}`);
  },

});
