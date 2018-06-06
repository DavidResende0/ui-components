import * as ng from 'angular';

export class QuaditemController {
  /*
   * The data object can contain the following keys:
   * - fonticon
   * - fileicon
   * - text
   * - tooltip
   * - background - background color of the given quadrant
   * - color - color of text/fonticon
   * - piechart - numeric value between 0..20, requires the .piechart CSS class from the demo to be extracted
   */

  public data : any;

  /* @ngInject */
  constructor(private $filter) {}

  public fontSize() : string {
    const length = this.$filter('abbrNumber')(this.data.text).length;

    if (length < 3) {
      return 'font-normal';
    } else if (length > 2 && length < 4) {
      return 'font-small';
    } else {
      return 'font-tiny';
    }
  }
}

export default class Quaditem implements ng.IComponentOptions {
  public controller = QuaditemController;
  public template = require('./quaditem.html');
  public bindings : any = {
    data: '<'
  };
}
