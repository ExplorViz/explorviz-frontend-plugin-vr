import Service from '@ember/service';

export default Service.extend({

  userID: null, // Own userID
  state: null, // Own connection status, state in {'connecting', 'connected', 'spectating'}
  color: null,
  controllersConnected: null, // Tells which controller(s) is/are connected

});