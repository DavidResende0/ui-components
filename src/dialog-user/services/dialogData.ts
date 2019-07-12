import * as _ from 'lodash';
import * as angular from 'angular';
import {__} from '../../common/translateFunction';

export default class DialogDataService {

  /**
   * Sets up and configures properties for a dialog field
   * @memberof DialogDataService
   * @function setupField
   * @param data {any} This is a object that is all the information for a particular dialog field
   *
   **/
  public setupField(data: any) {
    let field = _.cloneDeep(data);
    field.fieldBeingRefreshed = field.fieldBeingRefreshed || false;

    const sortableFieldTypes = ['DialogFieldDropDownList', 'DialogFieldRadioButton'];
    if (_.includes(sortableFieldTypes, field.type)) {
      field.values = this.setupSortableValues(field);
    }

    field.default_value = this.setDefaultValue(field);

    return field;
  }

  // converts values to the right data_type, and order
  public setupSortableValues({
    data_type,
    default_value,
    options,
    values,
  }) {
    let dropDownValues = [];

    for (let option of values) {
      const value = ((data_type === 'integer' && option[0] !== null) ? parseInt(option[0], 10) : option[0]);
      const description = (!Number.isInteger(option[1]) ? option[1] : parseInt(option[1], 10));
      dropDownValues.push([value, description]);
    }

    if (options.sort_by !== 'none') {
      return this.updateFieldSortOrder({
        data_type,
        options,
        values: dropDownValues,
      });
    }

    return dropDownValues;
  }

  /**
   *
   * This method updates sort order of dialog options for a dialog field that is a drop down.
   * @memberof DialogDataService
   * @function updateFieldSortOrder
   * @param data {any} This is a object that is all the information for a particular dialog field
   *
   **/
  private updateFieldSortOrder({
    data_type,
    options,
    values,
  }) {
    const firstValue = values[0][0];
    let tempValues = [...values];
    let defaultDropdownField = [];

    // The following if deals with a empty default option if it exists
    if (data_type === 'integer' && _.isNaN(firstValue) || _.isNull(firstValue)) {
      defaultDropdownField = tempValues.shift();
    }

    const sortBy = (options.sort_by === 'value' ? 0 : 1);
    let sortedValues = _.sortBy(tempValues, sortBy);
    if (options.sort_order !== 'ascending') {
      sortedValues = sortedValues.reverse();
    }

    if (defaultDropdownField.length) {
      sortedValues.unshift(defaultDropdownField);
    }

    return sortedValues;
  }

  /**
   *
   * This method sets default value for a dialog field
   * @memberof DialogDataService
   * @function setDefaultValue
   * @param data {any} This is a object that is all the information for a particular dialog field
   *
   **/
  private setDefaultValue(data): any {
    let defaultValue: any = '';

    if (_.isObject(data.values)) {
      const firstOption = 0; // these are meant to help make code more readable
      const fieldValue = 0;

      defaultValue = data.values[firstOption][fieldValue];
    }

    if (data.default_value) {
      defaultValue = data.default_value;
    }

    if (data.type === 'DialogFieldDateControl' || data.type === 'DialogFieldDateTimeControl') {
      defaultValue = data.default_value ? new Date(data.default_value) : new Date();
    }

    // don't convert twice, FIXME: later refactor so that this doesn't get called twice for the same data
    if (data.type === 'DialogFieldDropDownList' && data.default_value && _.isString(data.default_value)) {
      if (data.options.force_multi_value) {
        // multi-select - convert value from JSON, assume right type
        defaultValue = JSON.parse(data.default_value);
      } else if (data.data_type === 'integer') {
        // single-select - convert value to the chosen default_type, API always returns string
        defaultValue = parseInt(data.default_value, 10) || 0;
      }
    }

    if (data.type === 'DialogFieldTagControl') {
      // setting the default_value for a tag control's select box
      // In case the default_value is not set for the ng-model of the component, an empty value option is displayed
      let defaultOption = _.find(data.values, { id: null });
      if (defaultOption) {
        defaultOption.id = 0;
        defaultValue = defaultOption.id;
      }
    }

    return defaultValue;
  }

  /**
   * Validates a dialog field to ensure that the values supplied meet required criteria
   * @memberof DialogDataService
   * @function validateField
   * @param field {any} This is a object that is all the information for a particular dialog field
   * @param value {any} Value is optional.  Allows you to explicitly pass in the value to verify for a field
   **/
  public validateField(field, value): any {
    const validation = {
      ...{  // unused, nice for debugging
        label: field.label,
        name: field.name,
        value,
      },
      isValid: true,
      message: '',
    };

    if (field.required) {
      if (field.type === 'DialogFieldCheckBox' && value === 'f') {
        validation.isValid = false;
        validation.message = __('This field is required');
      } else if (field.type === 'DialogFieldTagControl') {
        if (this.isInvalidTagControl(field.options.force_single_value, value)) {
          validation.isValid = false;
          validation.message = __('This field is required');
        }
      } else if (_.isEmpty(value)) {
        validation.isValid = false;
        validation.message = __('This field is required');
      }
    }

    // Run check if someone has specified a regex.  Make sure if its required it is not blank
    if (field.validator_rule && field.validator_type === 'regex' && validation.isValid === true) {
      if (angular.isDefined(value) && !_.isEmpty(value)) {
        // This use case ensures that an optional field doesnt check a regex if field is blank
        const regexPattern = field.validator_rule.replace(/\\A/i, '^').replace(/\\Z/i,'$');
        const regex = new RegExp(regexPattern);
        const regexValidates = regex.test(value);
        validation.isValid = regexValidates;
        validation.message = __('Entered text should match the format:') + ' ' + regexPattern;
      }
    }

    if (['DialogFieldDateControl', 'DialogFieldDateTimeControl'].includes(field.type) && ! _.isDate(value)) {
      validation.isValid = false;
      validation.message = __('Select a valid date');
    }

    return validation;
  }

  /**
   * Determines if a value is a tag control and whether or not that value is valid
   * @memberof DialogDataService
   * @function isInvalidTagControl
   * @param forceSingleValue {boolean} Whether or not the field allows multiple selections
   * @param fieldValue {any} This is the value of the field in question to be validated
   **/
  private isInvalidTagControl(forceSingleValue, fieldValue) {
    let invalid = false;

    if (forceSingleValue) {
      if (_.isNumber(fieldValue)) {
        if (fieldValue === 0) {
          invalid = true;
        }
      } else if (_.isEmpty(fieldValue)) {
        invalid = true;
      }
    } else {
      if (_.isEmpty(fieldValue)) {
        invalid = true;
      }
    }

    return invalid;
  }
}
