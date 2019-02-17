import Menu from '../menu';

let menu = null;
let prevMenu = null;

/**
 * Creates and opens the Camera Height Menu.
 * 
 * @param {Object} lastMenu - The menu to go back to on back button pressed.
 */
export function open(lastMenu) {
  menu = Menu.create({
    name: 'changeCameraHeightMenu'
  });

  menu.addTitle('Change Camera');
  menu.addArrowButton('height_down', {x: 100, y: 182}, {x: 150, y: 242}, 'arrow_down', '#ffc338');
  menu.addArrowButton('height_up', {x: 366, y: 182}, {x: 416, y: 242}, 'arrow_up', '#ffc338');
  menu.addText(this.user.position.y.toFixed(2), 'camera_height', 28, { x: 256, y: 202}, '#ffffff', 'center', false);
  menu.addTextButton('Back', 'back', {x: 100, y: 402}, 316, 50, 28, '#555555', '#ffffff', '#929292', true);
  prevMenu = lastMenu;

  menu.interact = (action, position) => {
    let item = menu.getItem(position);
    if(item) {
      if(action === 'rightIntersect') {
        menu.setHover(item);
      }
      if(action === 'rightTriggerDown'){
        if(item.name === 'back') {
          back.call(this);
        } else {
          item.isActivated = true;
        }
      }
      if(action === 'rightTriggerUp'){
        item.isActivated = false;
      }
      if(action === 'rightTriggerPressed' && item.isActivated) {
        const deltaTime = this.get('deltaViewTime');
        const triggerValue = this.get('controller2').getTriggerValue();

        const moveDistance = triggerValue * deltaTime * 0.001;

        if(item.name === 'height_down') {
          this.get('user').position.y -= moveDistance;
          menu.updateText('camera_height', this.get('user').position.y.toFixed(2));
        } else if(item.name === 'height_up') {
          this.get('user').position.y += moveDistance;
          menu.updateText('camera_height', this.get('user').position.y.toFixed(2));
        }
      }
    } else {
      menu.setHover(null);
      menu.deactivateItems();
    }
  };
  
  menu.createMesh();
  menu.addToController(this.get('controller1'));
}

/**
 * Closes and removes the Camera Height Menu.
 */
export function close() {
  if(menu) {
    this.get('controller1').remove(menu.get('mesh'));
    menu.close();
    menu = null;
  }
}

/**
 * Go back to the previous menu.
 */
export function back() {
  close.call(this);
  if(prevMenu) {
    prevMenu.call(this);
    prevMenu = null;
  }
}

/**
 * Return whether the menu is opened or not.
 */
export function isOpen() {
  return menu ? true : false;
}
