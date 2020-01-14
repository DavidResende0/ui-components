import * as _ from 'lodash';

/**
 * Controller for the Dialog Editor Modal Field Template component
 * @ngdoc controller
 * @name ModalFieldController
 */
class ModalFieldController {
  public modalData: any;
  public sortableOptionsValues: any;
  public readonly DROPDOWN_ENTRY_VALUE: number = 0;
  public readonly DROPDOWN_ENTRY_DESCRIPTION: number = 1;

  /*@ngInject*/
  constructor(private $scope,
              private $element: any) {
    // Rules for Drag&Drop sorting of values in a Dropdown element
    this.sortableOptionsValues = {
      axis: 'y',
      cancel: 'input',
      delay: 100,
      cursor: 'move',
      opacity: 0.5,
      revert: 50,
      stop: (e: any, ui: any) => {
        this.$element.find('select').selectpicker('refresh');
      },
    };
  }

  public resetDefaultValue() {
    // TODO replace with shared impl

    if ('force_multi_value' in this.modalData.options && this.modalData.options.force_multi_value) {
      this.modalData.default_value = [];
    } else if ('force_single_value' in this.modalData.options && ! this.modalData.options.force_single_value) {
      this.modalData.default_value = [];
    } else if (this.modalData.data_type === 'integer') {
      this.modalData.default_value = 0;
    } else {
      this.modalData.default_value = '';
    }

    console.log('resetDefaultValue', this.modalData.default_value);
  }

  // reset default_value on data_type change and single/multi change
  public $onInit() {
    const watch = (path, fn) => {
      this.$scope.$watch(path, (current, old) => {
        if (current !== old) {
          return fn();
        }
      });
    };

    watch('vm.modalData.options.force_multi_value', () => this.resetDefaultValue());
    watch('vm.modalData.options.force_single_value', () => this.resetDefaultValue());
    watch('vm.modalData.data_type', () => this.resetDefaultValue());
    // vm.modalData.values - handled by entriesChange
  }

  // reset default_value on entries list change
  public entriesChange() {
    setTimeout(() => this.$element.find('select').selectpicker('refresh'));
    this.resetDefaultValue();
  }
}

/**
 * @memberof miqStaticAssets
 * @ngdoc component
 * @name dialogEditorModalFieldTemplate
 * @description
 *    Component contains templates for the modal for each field type
 * @example
 * <dialog-editor-modal-field-template ng-switch-when="DialogFieldTextBox"
 *                                     template="text-box.html"
 *                                     modal-data="vm.modalData">
 * </dialog-editor-modal-field-template>
 */
export default class ModalFieldTemplate {
  /*@ngInject*/
  public template = ($element: any, $attrs: any) => require(`./${$attrs.template}`);
  public scope: boolean = true;
  public controller = ModalFieldController;
  public controllerAs: string = 'vm';
  public bindings: any = {
    modalData: '=',
    categories: '=?',
    addEntry: '=?',
    removeEntry: '=?',
    currentCategoryEntries: '=?',
    setupCategoryOptions: '=?',
    resolveCategories: '=?',
    modalTabIsSet: '<',
    modalTab: '=',
    showFullyQualifiedName: '<',
    treeOptions: '<',
  };
}
