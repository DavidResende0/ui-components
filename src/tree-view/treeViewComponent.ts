/* tslint:disable:max-line-length */
import * as ng from 'angular';
import * as _ from 'lodash';

export class TreeViewController {
  private tree;
  private element;
  private rendered : boolean;

  public name : string;
  public data;
  public persist : string;
  public selected;
  public reselect;
  public onSelect: (args: {node: any}) => void;
  public lazyLoad: (args: {node: any}) => Promise<any>;
  public errorHandlers: any;

  /*@ngInject*/
  constructor(private $element : ng.IRootElementService, private $timeout : ng.ITimeoutService) {
    this.errorHandlers = this.errorHandlers || {};
  }

  public $postLink() {
    // It's necessary to wait for the template to be ready as the treeview requires an element ID
    this.$timeout(() => {
      this.renderTree();
    });
  }

  public $onChanges(changes) {
    // For the first time render the tree with $postLink
    if (!this.rendered) {
      return;
    }
    // Render the tree after the data has attribute been altered
    // WARNING: Do not use this for lazy-loading!
    if (changes.data && changes.data.currentValue !== undefined) {
      this.renderTree();
    }

    // Prevent initial node selection before the tree is fully rendered
    if (this.rendered && !changes.selected.isFirstChange() && changes.selected.currentValue !== undefined) {
      this.selectNode(changes.selected.currentValue);
    }
  }

  /*
   * @function renderTree
   *
   * This function searches for the `<div class='treeview'>` element in the
   * template and renders the treeview into it with the `data` attribute of
   * the component. The function clears any elements from the container div
   * and so the function can be used for re-rendering the tree if necessary.
   */
  private renderTree() {
    this.rendered = false;
    this.element = ng.element(this.$element[0].querySelector('div.treeview'));
    this.element.empty();

    new Promise((resolve) => {
      this.element.treeview({
        data:            this.data,
        showImage:       true,
        expandIcon:      'fa fa-fw fa-angle-right',
        collapseIcon:    'fa fa-fw fa-angle-down',
        loadingIcon:     'fa fa-fw fa-spinner fa-pulse',
        levels:          1,
        allowReselect:   this.reselect,
        preventUnselect: true,
        showBorders:     false,
        onNodeExpanded:  this.storeNodeState(true),
        onNodeCollapsed: this.storeNodeState(undefined),
        onNodeSelected:  this.onSelect ? (_event, node) => this.$timeout(() => this.onSelect({node: node})) : () => null,
        lazyLoad:        this.lazyLoad ? (node, render) => this.$timeout(() => this.lazyLoad({node: node}).then(render)) : () => null,
        onRendered:      () => this.$timeout(resolve)
      });
    }).then(() => {
      // include the tree
      this.tree = this.element.treeview(true);
      // expand path

      // Initial node selection right after rendering
      if (this.selected && this.tree.getSelected().length === 0) {
        this.selectNode(this.selected);
      }

      // Restore the tree if tree persistence is enabled
      if (this.persist) {
        this.loadTreeState();
      }

      this.rendered = true;
    });
  }

  private findNode(params) {
    return this.tree.getNodes().find(node => Object.keys(params)
      .map(param => node[param] === params[param])
      .every(bool => bool)
    );
  }

  /*
   * @function selectNode
   *
   * This function is able to select a node that is not loaded in the tree yet.
   * Simply provide an array of matchers instead of a single one. The matchers
   * should hierarchically follow the structure above the node to be selected.
   *
   * The matched nodes will be expanded and lazily loaded one by one until the
   * loop reaches the last node that will be simply selected instead.
   */
  private selectNode(tail) {
    let head = tail;
    if (Array.isArray(tail)) {
      head = tail.pop();
    } else {
      tail = [];
    }

    TreeViewController.lazyTraverse(
      head,
      this.selectSingleNode.bind(this),
      tail,
      this.lazyExpandNode.bind(this),
      this.errorHandlers.selected
    );
  }

  /*
   * function lazyExpandNode
   *
   * This function returns with a lambda that attempts to expand the node that
   * matches the `obj` argument. This resulting lambda is intended for use as
   * a body of an ES6 Promise as it expects the `resolve` and `reject` methods
   * as its arguments. It makes sure that the children of the node are loaded
   * before resolving the promise.
   */
  private lazyExpandNode(obj) {
    return (resolve, reject) => {
      let node = this.findNode(obj);

      // Node not found
      if (!node) {
        return reject();
      }
      // No need to wait if the node is not lazy
      if (!node.lazyLoad) {
        this.tree.expandNode(node);
        return resolve();
      }

      // The event handler needs to be named for its future deregister
      let handler = (_event, exp) => {
        if (exp.nodeId === node.nodeId) {
          // Deregister itself after success
          this.element.unbind('nodeExpanded', handler);
          resolve();
        }
      };

      this.element.on('nodeExpanded', handler);
      this.tree.toggleNodeExpanded(node);
    };
  }

  private selectSingleNode(obj) {
    let node = this.findNode(obj);
    this.tree.revealNode(node, {silent: true});
    this.tree.selectNode(node, {silent: true});
    this.tree.expandNode(node);
  }

  private expandSingleNode(obj) {
    let node = this.findNode(obj);
    this.tree.revealNode(node, {silent: true});
    this.tree.expandNode(node);
  }

  private storeNodeState(state) {
    return (_event, node) => {
      // Do not set the tree state if not necessary
      if (!this.persist) {
        return;
      }

      if (state) {
        // Build the path to the expanded node
        state = [];
        let item = this.tree.getParents(node)[0];
        while (item) {
          let obj = {};
          obj[this.persist] = item[this.persist];
          state.unshift(obj);
          item = this.tree.getParents(item)[0];
        }
      }

      let store = JSON.parse(sessionStorage.getItem(`treeView-${this.name}`)) || {};
      // Save the new node in the session storage
      store[node[this.persist]] = state;
      sessionStorage.setItem(`treeView-${this.name}`, JSON.stringify(store));
    };
  }

  private loadTreeState() {
    let store = JSON.parse(sessionStorage.getItem(`treeView-${this.name}`)) || {};
    // Create a list of store keys that should be ignored
    let blacklist = _.flatten(Object.keys(store)
                      .map(key => store[key]))
                      .map(obj => obj[this.persist]);

    Object.keys(store).forEach(key => {
        // Ignore the blacklisted items
        if (_.includes(blacklist, key)) {
          return;
        }

        let obj = {};
        obj[this.persist] = key;

        TreeViewController.lazyTraverse(
          obj,
          this.expandSingleNode.bind(this),
          store[key],
          this.lazyExpandNode.bind(this)
        );
      }
    );
  }

  /*
   * @function lazyTraverse
   *
   * Reduces `tail` into a chain of promises with `tailF` as the body of the promise.
   * An iteration step will always depend on the promise created in the previous one.
   * Finally the `headF` function is called on `head` after resolving all promises.
   * If anything goes wrong during the traversal the fallback function is called.
   */
  // tu
  private static lazyTraverse(head : any,
                              headF : Function,
                              tail : Array<any>,
                              tailF : Function,
                              fallback : Function = () => null) {
    const emptyPromise = new Promise(nope => nope());
    tail.reduce((sum, value) => sum.then(() => new Promise(tailF(value))), emptyPromise)
      .then(() => headF(head)).catch(fallback);
  }
}

export default class TreeView implements ng.IComponentOptions {
  public controller = TreeViewController;
  public template = '<div class="treeview treeview-pf-select" ng-attr-id="treeview-{{ $ctrl.name }}"></div></div>';
  public bindings: any = {
    name: '@',
    data: '<',
    persist: '@?',
    selected: '<?',
    reselect: '<?',
    onSelect: '&?',
    lazyLoad: '&?',
    errorHandlers: '<?',
  };
}
