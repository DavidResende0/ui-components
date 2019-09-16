import * as _ from 'lodash';
import {ComponentDemo} from '../services/availableComponentBuilder';

@ComponentDemo({
  name: 'small',
  title: 'Small tile',
  template: require('./../views/tile-view/small.html'),
  group: 'tile-menu',
  controller: 'demoDataTable as vm'
})
@ComponentDemo({
  name: 'big',
  title: 'Big tile',
  template: require('./../views/tile-view/big.html'),
  group: 'tile-menu',
  controller: 'demoDataTable as vm'
})
@ComponentDemo({
  name: 'basic',
  title: 'Basic data table',
  template: require('./../views/data-table/basic.html'),
  group: 'data-table',
  controller: 'demoDataTable as vm'
})
export default class DataTableController {
  public rows;
  public cols;
  public perPage;
  public filteredRows: any;
  public settings: any;
  /* @ngInject */
  constructor(public MiQDataTableService: any, private MiQEndpointsService: any, private $filter: any) {
    this.settings = {};
    this.perPage = {
      enabled: true,
      text: 20,
      value: 20,
      hidden: false,
      items: [
        {text: 5, value: 5, hidden: false, enabled: true},
        {text: 10, value: 10, hidden: false, enabled: true},
        {text: 20, value: 20, hidden: false, enabled: true},
        {text: 50, value: 50, hidden: false, enabled: true},
        {text: 100, value: 100, hidden: false, enabled: true},
        {text: 1000, value: 1000, hidden: false, enabled: true},
        {text: 'All', value: -1, hidden: false, enabled: true},
      ]
    };
    this.setEndpoints();
    this.fetchData().then(data => {
      this.rows = data.rows;
      this.cols = data.cols;
      this.settings = data.settings;
      let start = (this.settings.current - 1) * this.settings.perpage;
      this.settings.translateTotalOf = (start, end, total) => {
        return `${start + 1} - ${end + 1} of ${total}`;
      };
      this.onLoadNext(start, this.settings.perpage);
      this.onSort(2, true);
      this.settings.selectAllTitle = 'select all';
      this.settings.sortedByTitle = 'sorted by';
      this.settings.perPageTitle = 'per page';
      this.settings.dropdownClass = ['someClass'];
    });
  }

  public onLoadNext(start, perPage) {
    this.perPage.value = perPage;
    this.perPage.text = `${perPage} ${this.perPage.labelItems ? this.perPage.labelItems : ''}`;
    this.settings.perpage = perPage;
    this.settings.startIndex = start;
    this.settings.current = ( start / perPage) + 1;
    this.settings.total = Math.ceil(this.settings.items / this.settings.perpage);
    this.filterAndSort();
  }

  public onSort(headerId, isAscending) {
    this.settings.sortBy = {
      sortObject: this.cols[headerId],
      isAscending: isAscending
    };
    this.filterAndSort();
  }

  public filterAndSort() {
    this.filteredRows = this.rows;
    if (this.settings.sortBy) {
      this.filteredRows = this.sortItems(this.filteredRows);
    }
    this.filteredRows = this.limitTo();
  }

  public sortItems(rows) {
    let filteredRows = _.sortBy(rows, (row: any) => {
      let indexOfColumn = this.cols.indexOf(this.settings.sortBy.sortObject);
      return row.cells[indexOfColumn]['text'];
    });
    filteredRows = this.settings.sortBy.isAscending ? filteredRows : filteredRows.reverse();
    return filteredRows;
  }

  public limitTo() {
    this.filteredRows = this.$filter('limitTo')(
      this.filteredRows,
      this.settings.perpage,
      this.settings.startIndex
    );
    return this.filteredRows;
  }

  public onRowClick(item) {
    console.log('It was clicked on item:', item);
  }

  public onItemSelect(item, isSelected) {
    let selectedItem: any = _.find(this.rows, {id: item.id});
    selectedItem.checked = isSelected;
    selectedItem.selected = isSelected;
    console.log('Item which was selected and was selected?', item, isSelected);
  }

  private setEndpoints() {
    this.MiQEndpointsService.rootPoint = '/data';
    this.MiQEndpointsService.endpoints.listDataTable = '/data-table.json';
  }

  private fetchData() {
    return this.MiQDataTableService.retrieveRowsAndColumnsFromUrl();
  }
}
