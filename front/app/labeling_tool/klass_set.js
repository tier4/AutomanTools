

export default class KlassSet {
  _labelTool = null;
  _klasses = null;
  _targetKlass = null;
  // DOM
  _klassSetList = null;
  _nextId = 0;

  constructor(labelTool) {
    this._labelTool = labelTool;
  }
  init() {
    const klassSetList = $('#class-list')
      .css({
        'cursor': 'pointer'
      });
    this._klassSetList = klassSetList;
    this._klasses = new Map();
    return new Promise((resolve, reject) => {
      let klassset = this._labelTool.getProjectInfo().klassset;

      klassset.records.forEach((klass) => {
        let config = JSON.parse(klass.config);
        this._klasses.set(
          klass.name,
          new Klass(
            this,
            this._nextId++,
            klass.name,
            config.color,
            new THREE.Vector2(config.minSize.x, config.minSize.y),
            this._klassSetList
          )
        );
      });
      // select default target class
      this._targetKlass = this._klasses.get(
        klassset.records[0].name
      );
      this._targetKlass.setActive(true);
      resolve();
    });
  }
  getByName(name) {
    if (typeof name != 'string') {
      Controls.error(
        'KlassSet get by name error: name is not string "' + name + '"'
      );
      return;
    }
    return this._klasses.get(name);
  }
  getTarget() {
    return this._targetKlass;
  }
  setTarget(tgt) {
    let next = this._getKlass(tgt),
        prev = this._targetKlass;
    if (next.id === prev.id) {
      return prev;
    }
    this._targetKlass = next;
    // DOM change
    prev.setActive(false);
    next.setActive(true);
    return next;
  }
  _getKlass(kls) {
    if (kls instanceof Klass) {
      return kls;
    } else if (typeof(kls) === 'string') {
      return this._klasses.get(kls) || null;
    }
    return null;
  }
};

class Klass {
  constructor(klassSet, id, name, color, size, klassSetList) {
    this.klassSet = klassSet;
    this.id = id;
    this.name = name;
    this.color = color;
    this.minSize = size;

    // TODO: redesign
    const dom = $('<div>');
    dom.append(
      $('<span>')
        .text(' ')
        .css({
          background: color,
          width: '10px',
          height: '10px',
          display: 'inline-block'
        }),
      $('<span>')
        .text(' ' + name)
    ).css({
      'color': 'white',
    }).click(() => {
      this.klassSet._labelTool.selectKlass(this);
    }).hover(() => {
      if (this.klassSet.getTarget() !== this) {
        dom.css({
          'background': '#aaa'
        });
      }
    }, () => {
      if (this.klassSet.getTarget() !== this) {
        dom.css({
          'background': ''
        });
      }
    });
    this.dom = dom;
    this.klassSet._klassSetList.append(dom);
  }
  setActive(flag) {
    this.dom.css(
      flag ? {
        'background': '#fff',
        'color': '#333'
      } : {
        'background': '',
        'color': '#fff'
      }
    );
  }
  getName() {
    return this.name;
  }
  getColor() {
    return this.color;
  }
  getMinSize() {
    return this.minSize;
  }
}
