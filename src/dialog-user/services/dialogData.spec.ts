import DialogData from './dialogData';
import * as angular from 'angular';
const dialogField = {
  'href': 'http://localhost:3001/api/service_templates/10000000000015/service_dialogs/10000000007060',
  'id': 10000000007060,
  'name': 'service_name',
  'display': 'edit',
  'display_method_options': {},
  'required': true,
  'required_method_options': {},
  'default_value': '',
  'values_method_options': {},
  'options': {
    'protected': false
  },
  'created_at': '2017-06-16T19:29:28Z',
  'updated_at': '2017-06-16T19:29:28Z',
  'label': 'Service Name',
  'dialog_group_id': 10000000002378,
  'position': 0,
  'validator_type': 'regex',
  'validator_rule': '[0-9]',
  'dynamic': false,
  'read_only': false,
  'visible': true,
  'type': 'DialogFieldTextBox',
  'resource_action': {
    'resource_type': 'DialogField',
    'ae_attributes': {}
  }
};

describe('DialogDataService test', () => {
  let dialogData;

  beforeEach(() => {
    angular.mock.module('miqStaticAssets.dialogUser');
    angular.mock.module('miqStaticAssets.common');
    angular.mock.inject(($http, MiQEndpointsService, $rootScope, $httpBackend) => {
      dialogData = new DialogData();
    });
  });

  it('should create service', () => {
    expect(dialogData).toBeDefined();
  });

  it('should set some default field properties', () => {
    const configuredField = dialogData.setupField(dialogField);
    expect(configuredField.fieldValidation).toBeDefined();
    expect(configuredField.fieldBeingRefreshed).toBe(false);
    expect(configuredField.errorMessage).toBeDefined();
  });

  describe('#setupField', () => {
    describe('when the field is a drop down list', () => {
      describe('when the field is an integer type', () => {
        describe('when the field has no default value', () => {
          it('stores the values without forcing null into a NaN', () => {
            let testField = {
              'data_type': 'integer',
              'default_value': null,
              'values': [[null, '<None>'], ['1', 'One'], ['2', 'Two']],
              'type': 'DialogFieldDropDownList',
              'options': {'sort_by': 'description', 'sort_order': 'ascending'}
            };
            let newField = dialogData.setupField(testField);
            expect(newField.values[0]).toEqual([null, '<None>']);
          });
        });
      });
    });
  });

  describe('#validateField', () => {
    describe('when the field is required', () => {
      describe('when the field is a tag control', () => {
        describe('when the field forces a single value', () => {
          describe('when the field value is 0 (the "choose" option)', () => {
            let testField;

            beforeEach(() => {
              testField = {
                'type': 'DialogFieldTagControl',
                'default_value': 0,
                'required': true,
                'options': {
                  'force_single_value': true
                }
              };
            });

            it('does not pass validation', () => {
              let validation = dialogData.validateField(testField);
              expect(validation.isValid).toEqual(false);
              expect(validation.message).toEqual('This field is required');
            });
          });

          describe('when the field value is null', () => {
            let testField;

            beforeEach(() => {
              testField = {
                'type': 'DialogFieldTagControl',
                'default_value': null,
                'required': true,
                'options': {
                  'force_single_value': true
                }
              };
            });

            it('does not pass validation', () => {
              let validation = dialogData.validateField(testField);
              expect(validation.isValid).toEqual(false);
              expect(validation.message).toEqual('This field is required');
            });
          });

          describe('when the field value is any other number', () => {
            let testField;

            beforeEach(() => {
              testField = {
                'type': 'DialogFieldTagControl',
                'default_value': 1234,
                'required': true,
                'options': {
                  'force_single_value': true
                }
              };
            });

            it('passes validation', () => {
              let validation = dialogData.validateField(testField);
              expect(validation.isValid).toEqual(true);
              expect(validation.message).toEqual('');
            });
          });
        });

        describe('when the field does not force a single value', () => {
          describe('when the field value is empty', () => {
            let testField;

            beforeEach(() => {
              testField = {
                'type': 'DialogFieldTagControl',
                'default_value': [],
                'required': true,
                'options': {
                  'force_single_value': false
                }
              };
            });

            it('does not pass validation', () => {
              let validation = dialogData.validateField(testField);
              expect(validation.isValid).toEqual(false);
              expect(validation.message).toEqual('This field is required');
            });
          });

          describe('when the field value is null', () => {
            let testField;

            beforeEach(() => {
              testField = {
                'type': 'DialogFieldTagControl',
                'default_value': null,
                'required': true,
                'options': {
                  'force_single_value': false
                }
              };
            });

            it('does not pass validation', () => {
              let validation = dialogData.validateField(testField);
              expect(validation.isValid).toEqual(false);
              expect(validation.message).toEqual('This field is required');
            });
          });

          describe('when the field value has selected values', () => {
            let testField;

            beforeEach(() => {
              testField = {
                'type': 'DialogFieldTagControl',
                'default_value': [1234],
                'required': true,
                'options': {
                  'force_single_value': false
                }
              };
            });

            it('passes validation', () => {
              let validation = dialogData.validateField(testField);
              expect(validation.isValid).toEqual(true);
              expect(validation.message).toEqual('');
            });
          });
        });
      });
    });
  });

  describe('#setDefaultValue', () => {
    it('should allow a default value to be set', () => {
      let testField = dialogField;
      testField.default_value = 'test';
      let testDefault = dialogData.setDefaultValue(testField);
      expect(testDefault).toBe('test');
    });

    it('should prevent a form from being valid if drop down no option is selected', () => {
      const testDropDown = {
        required: true,
        type: 'DialogFieldDropDownList',
        label: 'Test Field',
        values: [
          ['', 'Test'],
          ['5', 'Test2'],
          ['2', 'Test5']
        ]
      };

      const validateFailure = {
        isValid: false,
        field: 'Test Field',
        message: 'This field is required'
      };
      const validation = dialogData.validateField(testDropDown, '');
      expect(validation).toEqual(validateFailure);
    });

    describe('when the data type is a check box', () => {
      let testField = {
        default_value: 'f',
        values: 't',
        name: 'test',
        type: 'DialogFieldCheckBox'
      }

      describe('when the field is dynamic', () => {
        beforeEach(() => {
          testField['dynamic'] = true;
        });

        it('ensures the checkbox uses the values that are set', () => {
          let testDefault = dialogData.setDefaultValue(testField);
          expect(testDefault).toBe('t');
        });
      });

      describe('when the field is not dynamic', () => {
        beforeEach(() => {
          testField['dynamic'] = false;
        });

        it('ensures the checkbox uses the default value that is set', () => {
          let testDefault = dialogData.setDefaultValue(testField);
          expect(testDefault).toBe('f');
        });
      });
    });

    describe('when the data type is a date control', () => {
      let dateField = {'type': 'DialogFieldDateControl'};

      describe('when the values are undefined', () => {
        beforeEach(() => {
          dateField['values'] = undefined;
        });

        it('returns a new date', () => {
          let todaysDate = new Date();
          let expectedDate = dialogData.setDefaultValue(dateField);
          expect(expectedDate.getFullYear()).toEqual(todaysDate.getFullYear());
          expect(expectedDate.getMonth()).toEqual(todaysDate.getMonth());
          expect(expectedDate.getDate()).toEqual(todaysDate.getDate());
          expect(expectedDate.getHours()).toEqual(todaysDate.getHours());
          expect(expectedDate.getMinutes()).toEqual(todaysDate.getMinutes());
        });
      });

      describe('when the values exist', () => {
        beforeEach(() => {
          dateField['values'] = '2017-09-18';
        });

        it('returns a new date based on the values', () => {
          expect(dialogData.setDefaultValue(dateField)).toEqual(new Date('2017-09-18'));
        });
      });
    });
  });

  it('should allow a select list to be sorted', () => {
    const testDropDown = {
      values: [
        [0, 'Test'],
        [5, 'Test2'],
        [2, 'Test5']
      ],
      options: { sort_by: 'value', sort_order: 'descending', data_type: 'integer' }
    };
    const testSorted = dialogData.updateFieldSortOrder(testDropDown);
    const expectedResult = [[5, 'Test2'], [2, 'Test5'], [0, 'Test']];
    expect(testSorted).toEqual(expectedResult);
    const testDropDownDescription = {
      values: [
        [0, 'B'],
        [5, 'C'],
        [2, 'A']
      ],
      options: { sort_by: 'description', sort_order: 'descending' }
    };
    const testSortedDescription = dialogData.updateFieldSortOrder(testDropDownDescription);
    const expectedSortedResult = [[5, 'C'], [0, 'B'], [2, 'A']];
    expect(testSortedDescription).toEqual(expectedSortedResult);
  });
  it('should allow a numeric Description field to be sorted in a dropdown', () => {
    const testDropDownDescription = {
      values: [
        ['zero', '0'],
        ['five', '5'],
        ['two', '2']
      ],
      options: { sort_by: 'description', sort_order: 'descending' }
    };
    const testSortedDescription = dialogData.updateFieldSortOrder(testDropDownDescription);
    const expectedSortedResult = [['five', '5'], ['two', '2'], ['zero', '0']];
    expect(testSortedDescription).toEqual(expectedSortedResult);
  });
});
