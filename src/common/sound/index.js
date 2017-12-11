'use strict';

var Base = require('../../app/base');
var tmpl = require('./index.ejs.html');

export default class Sound extends Base {
  constructor(config) {
    super(config);

    this._bind();

    window.play = () => {
      this.close();
    }
  }

  _bind() {
    this.subscribe('play:success', this.success, this);
    this.subscribe('play:close', this.close, this);
    this.subscribe('play:guadan', this.guadan, this);
  }

  success() {
    this.renderTo(tmpl, { src: this.successSrc });
  }

  close() {
    this.renderTo(tmpl, { src: this.closeSrc });

  }

  guadan() {
    this.renderTo(tmpl, { src: this.guadanSrc });

  }

  defaults() {

    return {
      successSrc: '../music/success.mp3',
      guadanSrc: '../music/guadan.mp3',
      closeSrc: '../music/close.mp3'

    };
  }

}
